import { describe, test, expect } from "bun:test";
import {
  ALL_SCOPES,
  SCOPE_ACTIONS,
  build_scopes,
  format_scopes,
  parse_scopes,
  is_scope,
} from "../src/scopes.js";
import { NemuValidationError } from "../src/core/errors.js";

const PLATFORM_SCOPES = [
  "profile:read",
  "workspaces:read",
  "workspaces:write",
  "workspaces:delete",
  "budget:read",
  "budget:write",
  "indexes:read",
  "indexes:write",
  "members:read",
  "members:write",
  "providers:read",
  "providers:write",
  "models:read",
  "models:write",
  "prompts:read",
  "prompts:write",
  "mapping:read",
  "mapping:write",
  "keys:read",
  "keys:write",
  "usage:read",
  "quotas:read",
  "quotas:write",
  "context:read",
  "context:write",
];

describe("the scope table matches the platform", () => {
  test("every scope the platform grants can be expressed here", () => {
    for (const scope of PLATFORM_SCOPES) {
      expect(is_scope(scope)).toBe(true);
    }
  });

  test("no scope is offered that the platform would reject", () => {
    for (const scope of ALL_SCOPES) {
      expect(PLATFORM_SCOPES).toContain(scope);
    }
  });

  test("the two lists are the same length, so neither has drifted", () => {
    expect(ALL_SCOPES.length).toBe(PLATFORM_SCOPES.length);
  });

  test("the order matches, because it is what sorting is keyed on", () => {
    expect([...ALL_SCOPES]).toEqual(PLATFORM_SCOPES);
  });
});

describe("the scopes the calls in this SDK actually need", () => {
  test("workspace delete is grantable, since Workspace.delete exists", () => {
    expect(build_scopes("workspaces", "delete")).toEqual(["workspaces:delete"]);
  });

  test("budget is grantable, since get_budget and set_budget exist", () => {
    expect(build_scopes("budget")).toEqual(["budget:read", "budget:write"]);
  });

  test("indexes is grantable, since the Indexes resource exists", () => {
    expect(build_scopes("indexes")).toEqual(["indexes:read", "indexes:write"]);
  });
});

describe("building and parsing", () => {
  test("a bare resource expands to all of its actions", () => {
    expect(build_scopes("workspaces")).toEqual([
      "workspaces:read",
      "workspaces:write",
      "workspaces:delete",
    ]);
  });

  test("an action this resource does not have is refused", () => {
    expect(() => build_scopes("profile", "delete")).toThrow(
      NemuValidationError,
    );
    expect(() => build_scopes("usage", "write")).toThrow(NemuValidationError);
  });

  test("an unknown resource is refused rather than silently dropped", () => {
    expect(() => build_scopes("nonsense")).toThrow(NemuValidationError);
  });

  test("aliases resolve to the resource the platform names", () => {
    expect(build_scopes("mappings", "read")).toEqual(["mapping:read"]);
    expect(build_scopes("metrics")).toEqual(["usage:read"]);
    expect(build_scopes("budgets", "read")).toEqual(["budget:read"]);
    expect(build_scopes("index", "read")).toEqual(["indexes:read"]);
  });

  test("a map selects actions per resource", () => {
    expect(
      build_scopes({ workspaces: ["read", "delete"], budget: "read" }),
    ).toEqual(["workspaces:read", "workspaces:delete", "budget:read"]);
  });

  test("false excludes a resource entirely", () => {
    expect(build_scopes({ profile: true, budget: false })).toEqual([
      "profile:read",
    ]);
  });

  test("duplicates collapse", () => {
    expect(build_scopes("profile:read", "profile", { profile: "read" })).toEqual(
      ["profile:read"],
    );
  });

  test("output is ordered by the table, not by input order", () => {
    expect(build_scopes("quotas:read", "profile:read")).toEqual([
      "profile:read",
      "quotas:read",
    ]);
  });

  test("parsing ignores anything the platform would not accept", () => {
    expect(parse_scopes("profile:read nonsense:read budget:write")).toEqual([
      "profile:read",
      "budget:write",
    ]);
  });

  test("parsing nothing yields nothing", () => {
    expect(parse_scopes(null)).toEqual([]);
    expect(parse_scopes("")).toEqual([]);
  });

  test("formatting round trips through parsing", () => {
    const formatted = format_scopes("workspaces", "budget");
    expect(formatted).toBe(
      "workspaces:read workspaces:write workspaces:delete budget:read budget:write",
    );
    expect(parse_scopes(formatted)).toEqual(build_scopes("workspaces", "budget"));
  });

  test("every declared action is reachable from its resource", () => {
    for (const [resource, actions] of Object.entries(SCOPE_ACTIONS)) {
      for (const action of actions) {
        expect(build_scopes(resource, action)).toEqual([
          `${resource}:${action}`,
        ]);
      }
    }
  });
});
