import { NemuValidationError } from "./core/errors.js";

export const SCOPE_ACTIONS = {
  profile: ["read"],
  workspaces: ["read", "write", "delete"],
  budget: ["read", "write"],
  indexes: ["read", "write"],
  members: ["read", "write"],
  providers: ["read", "write"],
  models: ["read", "write"],
  prompts: ["read", "write"],
  mapping: ["read", "write"],
  keys: ["read", "write"],
  usage: ["read"],
  quotas: ["read", "write"],
  context: ["read", "write"],
} as const;

export const SCOPE_ALIASES = {
  user: "profile",
  account: "profile",
  mappings: "mapping",
  metrics: "usage",
  api_keys: "keys",
  budgets: "budget",
  index: "indexes",
} as const;

export type ScopeResource = keyof typeof SCOPE_ACTIONS;

export type ScopeResourceAlias = keyof typeof SCOPE_ALIASES;

export type ScopeResourceInput = ScopeResource | ScopeResourceAlias;

export type ScopeAction = "read" | "write" | "delete";

export type ResolveResource<R extends ScopeResourceInput> =
  R extends ScopeResource
    ? R
    : R extends ScopeResourceAlias
      ? (typeof SCOPE_ALIASES)[R]
      : never;

export type ResourceAction<R extends ScopeResource> =
  (typeof SCOPE_ACTIONS)[R][number];

export type Scope = {
  [R in ScopeResource]: `${R}:${ResourceAction<R>}`;
}[ScopeResource];

export type ScopeSelection<A extends ScopeAction = ScopeAction> =
  | boolean
  | A
  | readonly A[]
  | { [K in A]?: boolean };

export type ScopeMap = {
  [R in ScopeResource]?: ScopeSelection<ResourceAction<R>>;
} & {
  [A in ScopeResourceAlias]?: ScopeSelection<
    ResourceAction<(typeof SCOPE_ALIASES)[A]>
  >;
};

export type ScopeInput =
  | Scope
  | ScopeResourceInput
  | ScopeMap
  | readonly (Scope | ScopeResourceInput | ScopeMap)[];

export const ALL_SCOPES: readonly Scope[] = Object.entries(
  SCOPE_ACTIONS,
).flatMap(([resource, actions]) =>
  actions.map((action) => `${resource}:${action}` as Scope),
);

const SCOPE_ORDER = new Map(ALL_SCOPES.map((scope, index) => [scope, index]));

export function is_scope(value: string): value is Scope {
  return SCOPE_ORDER.has(value as Scope);
}

function resolve_resource(value: string): ScopeResource {
  if (value in SCOPE_ACTIONS) return value as ScopeResource;
  if (value in SCOPE_ALIASES) {
    return SCOPE_ALIASES[value as ScopeResourceAlias];
  }
  throw new NemuValidationError(
    `Unknown scope resource "${value}". Expected one of: ${Object.keys(SCOPE_ACTIONS).join(", ")}.`,
  );
}

const ACTIONS: readonly string[] = ["read", "write", "delete"];

function is_action(value: unknown): boolean {
  return typeof value === "string" && ACTIONS.includes(value);
}

function is_action_selection(value: unknown): boolean {
  if (typeof value === "boolean") return true;
  if (typeof value === "string") return is_action(value);
  if (Array.isArray(value)) return value.every(is_action);
  if (value !== null && typeof value === "object") {
    return Object.keys(value).every(is_action);
  }
  return false;
}

function add_action(
  target: Set<Scope>,
  resource: ScopeResource,
  action: string,
): void {
  const allowed = SCOPE_ACTIONS[resource] as readonly string[];
  if (!allowed.includes(action)) {
    throw new NemuValidationError(
      `Scope "${resource}:${action}" does not exist. "${resource}" supports: ${allowed.join(", ")}.`,
    );
  }
  target.add(`${resource}:${action}` as Scope);
}

function add_selection(
  target: Set<Scope>,
  resource_input: string,
  selection: unknown,
): void {
  const resource = resolve_resource(resource_input);

  if (selection === true || selection === undefined) {
    for (const action of SCOPE_ACTIONS[resource]) {
      add_action(target, resource, action);
    }
    return;
  }
  if (selection === false) return;

  if (typeof selection === "string") {
    add_action(target, resource, selection);
    return;
  }

  if (Array.isArray(selection)) {
    for (const action of selection) {
      add_action(target, resource, String(action));
    }
    return;
  }

  if (selection !== null && typeof selection === "object") {
    for (const [action, enabled] of Object.entries(selection)) {
      if (enabled === false) continue;
      add_action(target, resource, action);
    }
    return;
  }

  throw new NemuValidationError(
    `Invalid action selection for "${resource_input}". Expected a boolean, "read", "write", an array, or an object.`,
  );
}

function add_input(target: Set<Scope>, input: unknown): void {
  if (typeof input === "string") {
    if (input.includes(":")) {
      const [resource, action, ...rest] = input.split(":");
      if (rest.length > 0 || !resource || !action) {
        throw new NemuValidationError(
          `Invalid scope "${input}". Expected the form "resource:action".`,
        );
      }
      add_action(target, resolve_resource(resource), action);
      return;
    }
    add_selection(target, input, true);
    return;
  }

  if (Array.isArray(input)) {
    for (const item of input) add_input(target, item);
    return;
  }

  if (input !== null && typeof input === "object") {
    for (const [resource, selection] of Object.entries(input)) {
      add_selection(target, resource, selection);
    }
    return;
  }

  throw new NemuValidationError(
    `Invalid scope input "${String(input)}". Expected a scope string, a resource name, or a map.`,
  );
}

function sort_scopes(scopes: Set<Scope>): Scope[] {
  return Array.from(scopes).sort(
    (a, b) => (SCOPE_ORDER.get(a) ?? 0) - (SCOPE_ORDER.get(b) ?? 0),
  );
}

export function build_scopes<R extends ScopeResourceInput>(
  resource: R,
  action: ScopeSelection<ResourceAction<ResolveResource<R>>>,
  enabled?: boolean,
): Scope[];
export function build_scopes(...inputs: ScopeInput[]): Scope[];
export function build_scopes(...args: unknown[]): Scope[] {
  const collected = new Set<Scope>();

  const is_pair_call =
    (args.length === 2 || args.length === 3) &&
    typeof args[0] === "string" &&
    !args[0].includes(":") &&
    is_action_selection(args[1]) &&
    (args.length === 2 || typeof args[2] === "boolean");

  if (is_pair_call) {
    if (args[2] !== false) {
      add_selection(collected, args[0] as string, args[1]);
    }
    return sort_scopes(collected);
  }

  for (const input of args) add_input(collected, input);
  return sort_scopes(collected);
}

export function parse_scopes(value: string | null | undefined): Scope[] {
  if (!value) return [];
  const collected = new Set<Scope>();
  for (const entry of value.split(/\s+/)) {
    if (is_scope(entry)) collected.add(entry);
  }
  return sort_scopes(collected);
}

export function format_scopes(...inputs: ScopeInput[]): string {
  return build_scopes(...inputs).join(" ");
}
