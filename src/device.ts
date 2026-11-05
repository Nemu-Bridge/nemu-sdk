import { Nemu, resolve_urls } from "./client.js";
import { OAuthTokenProvider } from "./core/tokens.js";
import { NemuError, NemuValidationError } from "./core/errors.js";
import { build_scopes, type ScopeInput } from "./scopes.js";
import type { NemuOptions, OAuthTokens } from "./types.js";

export const DEVICE_GRANT_TYPE =
  "urn:ietf:params:oauth:grant-type:device_code";

const DEFAULT_INTERVAL_SECONDS = 5;
const SLOW_DOWN_INCREMENT_SECONDS = 5;

export interface DeviceAuthorization {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
}

export interface DeviceConfig extends NemuOptions {
  client_id: string;
}

export interface PollOptions {
  signal?: AbortSignal;
  on_refresh?: (tokens: OAuthTokens) => void;
}

export class NemuDeviceError extends NemuError {
  readonly code: string;

  constructor(code: string, message: string, status?: number) {
    super(message, status);
    this.name = "NemuDeviceError";
    this.code = code;
  }
}

function wait(seconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", on_abort);
      resolve();
    }, seconds * 1000);

    function on_abort(): void {
      clearTimeout(timer);
      reject(new NemuDeviceError("cancelled", "Cancelled."));
    }

    signal?.addEventListener("abort", on_abort, { once: true });
  });
}

export class NemuDevice {
  private client_id: string;
  private base_url: string;
  private token_url: string;
  private device_url: string;
  private fetch_impl: typeof fetch;
  private options: NemuOptions;

  constructor(config: DeviceConfig) {
    if (!config.client_id) {
      throw new NemuValidationError("client_id is required");
    }
    const { base_url, token_url } = resolve_urls(config);
    this.client_id = config.client_id;
    this.base_url = base_url;
    this.token_url = token_url;
    this.device_url = token_url.replace(
      /\/oauth\/token$/,
      "/oauth/device_authorization",
    );
    this.fetch_impl = config.fetch ?? fetch;
    this.options = config;
  }

  async request_code(scopes?: ScopeInput): Promise<DeviceAuthorization> {
    const body = new URLSearchParams({ client_id: this.client_id });
    if (scopes !== undefined) {
      const resolved = build_scopes(scopes).join(" ");
      if (resolved !== "") body.set("scope", resolved);
    }

    const response = await this.fetch_impl(this.device_url, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });

    const data = (await response.json().catch(() => null)) as
      | (DeviceAuthorization & { error?: string; error_description?: string })
      | null;

    if (!response.ok || !data || data.error !== undefined) {
      throw new NemuDeviceError(
        data?.error ?? `http_${response.status}`,
        data?.error_description ?? "Could not start the device flow.",
        response.status,
      );
    }
    return data;
  }

  async poll(
    authorization: DeviceAuthorization,
    options?: PollOptions,
  ): Promise<Nemu> {
    let interval =
      authorization.interval > 0
        ? authorization.interval
        : DEFAULT_INTERVAL_SECONDS;
    const deadline = Date.now() + authorization.expires_in * 1000;

    while (Date.now() < deadline) {
      if (options?.signal?.aborted === true) {
        throw new NemuDeviceError("cancelled", "Cancelled.");
      }
      await wait(interval, options?.signal);

      const response = await this.fetch_impl(this.token_url, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: DEVICE_GRANT_TYPE,
          client_id: this.client_id,
          device_code: authorization.device_code,
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
        scope?: string;
        error?: string;
        error_description?: string;
        interval?: number;
      } | null;

      if (response.ok && data?.access_token !== undefined) {
        return this.from_tokens(
          {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: Date.now() + (data.expires_in ?? 3600) * 1000,
            scope: data.scope,
          },
          options?.on_refresh,
        );
      }

      const code = data?.error ?? `http_${response.status}`;
      if (code === "authorization_pending") continue;
      if (code === "slow_down") {
        interval =
          data?.interval !== undefined
            ? data.interval
            : interval + SLOW_DOWN_INCREMENT_SECONDS;
        continue;
      }

      throw new NemuDeviceError(
        code,
        data?.error_description ?? "The sign in was refused.",
        response.status,
      );
    }

    throw new NemuDeviceError(
      "expired_token",
      "The code expired before it was approved.",
    );
  }

  from_tokens(
    tokens: OAuthTokens,
    on_refresh?: (tokens: OAuthTokens) => void,
  ): Nemu {
    const provider = new OAuthTokenProvider(
      this.token_url,
      this.client_id,
      "",
      tokens,
      this.fetch_impl,
      on_refresh,
    );
    return Nemu.from_oauth_provider(provider, this.options);
  }

  get urls(): { base_url: string; token_url: string; device_url: string } {
    return {
      base_url: this.base_url,
      token_url: this.token_url,
      device_url: this.device_url,
    };
  }
}
