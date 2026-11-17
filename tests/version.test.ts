import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SDK_VERSION } from "../src/versions.js";

describe("sdk version", () => {
  test("the version sent to nemu matches the published package", () => {
    const manifest = JSON.parse(
      readFileSync(join(import.meta.dir, "..", "package.json"), "utf8"),
    ) as { version: string };
    expect(SDK_VERSION).toBe(manifest.version);
  });
});
