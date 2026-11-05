import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { NemuDevice, NemuDeviceError, DEVICE_GRANT_TYPE } from "../src/device.js";
import { NemuValidationError } from "../src/core/errors.js";

let base = "";
let device_handler: () => Response = () => new Response("", { status: 500 });
let token_handler: () => Response = () => new Response("", { status: 500 });
let token_calls = 0;
let bodies: URLSearchParams[] = [];

const server = Bun.serve({
  port: 0,
  async fetch(request) {
    bodies.push(new URLSearchParams(await request.text()));
    const path = new URL(request.url).pathname;
    if (path.endsWith("/oauth/device_authorization")) return device_handler();
    if (path.endsWith("/oauth/token")) {
      token_calls += 1;
      return token_handler();
    }
    return new Response("not found", { status: 404 });
  },
});

beforeAll(() => {
  base = `http://localhost:${server.port}`;
});

afterAll(() => {
  server.stop(true);
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function make(): NemuDevice {
  return new NemuDevice({ client_id: "nemu_cli", base_url: `${base}/api/v1` });
}

function reset(): void {
  token_calls = 0;
  bodies = [];
}

const AUTHORIZATION = {
  device_code: "dc_test",
  user_code: "BDXW-KRTQ",
  verification_uri: `${"https://app.nemu.cc"}/device`,
  verification_uri_complete: "https://app.nemu.cc/device?user_code=BDXW-KRTQ",
  expires_in: 30,
  interval: 0.01,
};

describe("constructing the device client", () => {
  test("a client id is required", () => {
    expect(() => new NemuDevice({ client_id: "" })).toThrow(
      NemuValidationError,
    );
  });

  test("the device endpoint is derived from the token endpoint", () => {
    const device = make();
    expect(device.urls.device_url).toBe(
      `${base}/api/oauth/device_authorization`,
    );
    expect(device.urls.token_url).toBe(`${base}/api/oauth/token`);
  });
});

describe("asking for a code", () => {
  test("the client identifies itself", async () => {
    reset();
    device_handler = () => json(AUTHORIZATION);
    const result = await make().request_code();
    expect(result.user_code).toBe("BDXW-KRTQ");
    expect(bodies[0]?.get("client_id")).toBe("nemu_cli");
  });

  test("requested scopes are built and sent", async () => {
    reset();
    device_handler = () => json(AUTHORIZATION);
    await make().request_code({ profile: "read", workspaces: "read" });
    expect(bodies[0]?.get("scope")).toBe("profile:read workspaces:read");
  });

  test("an invalid scope is refused before any request is made", async () => {
    reset();
    device_handler = () => json(AUTHORIZATION);
    await expect(make().request_code("nonsense")).rejects.toThrow(
      NemuValidationError,
    );
    expect(bodies.length).toBe(0);
  });

  test("a refusal carries the error code", async () => {
    reset();
    device_handler = () => json({ error: "unauthorized_client" }, 400);
    try {
      await make().request_code();
      throw new Error("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(NemuDeviceError);
      expect((error as NemuDeviceError).code).toBe("unauthorized_client");
    }
  });
});

describe("polling", () => {
  test("it sends the grant type the RFC names", async () => {
    reset();
    token_handler = () => json({ access_token: "at", expires_in: 60 });
    await make().poll(AUTHORIZATION);
    expect(bodies[0]?.get("grant_type")).toBe(DEVICE_GRANT_TYPE);
    expect(bodies[0]?.get("device_code")).toBe("dc_test");
  });

  test("no client secret is ever sent", async () => {
    reset();
    token_handler = () => json({ access_token: "at", expires_in: 60 });
    await make().poll(AUTHORIZATION);
    expect(bodies[0]?.has("client_secret")).toBe(false);
  });

  test("it waits while the user has not answered", async () => {
    reset();
    token_handler = () =>
      token_calls < 3
        ? json({ error: "authorization_pending" }, 400)
        : json({ access_token: "at", expires_in: 60 });
    await make().poll(AUTHORIZATION);
    expect(token_calls).toBe(3);
  });

  test("a rejection stops immediately", async () => {
    reset();
    token_handler = () => json({ error: "access_denied" }, 400);
    await expect(make().poll(AUTHORIZATION)).rejects.toBeInstanceOf(
      NemuDeviceError,
    );
    expect(token_calls).toBe(1);
  });

  test("slow down is obeyed rather than treated as failure", async () => {
    reset();
    token_handler = () =>
      token_calls < 2
        ? json({ error: "slow_down", interval: 0.01 }, 400)
        : json({ access_token: "at", expires_in: 60 });
    await make().poll(AUTHORIZATION);
    expect(token_calls).toBe(2);
  });

  test("it gives up when the authorization expires", async () => {
    reset();
    token_handler = () => json({ error: "authorization_pending" }, 400);
    await expect(
      make().poll({ ...AUTHORIZATION, expires_in: 0 }),
    ).rejects.toThrow("The code expired before it was approved.");
  });

  test("an abort signal cancels the wait", async () => {
    reset();
    token_handler = () => json({ error: "authorization_pending" }, 400);
    const controller = new AbortController();
    controller.abort();
    await expect(
      make().poll(AUTHORIZATION, { signal: controller.signal }),
    ).rejects.toThrow("Cancelled.");
  });

  test("a granted token produces a usable client carrying the tokens", async () => {
    reset();
    token_handler = () =>
      json({
        access_token: "at",
        refresh_token: "rt",
        expires_in: 60,
        scope: "profile:read",
      });
    const nemu = await make().poll(AUTHORIZATION);
    expect(nemu.mode).toBe("oauth");
    expect(nemu.tokens?.access_token).toBe("at");
    expect(nemu.tokens?.refresh_token).toBe("rt");
  });
});
