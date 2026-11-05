# @nemu-ai/sdk

The official TypeScript SDK for the Nemu management API.

Server-side only, because it holds a secret: an API key or an OAuth client secret. That is a
security boundary, not a runtime one: the package has no Node specific imports and uses the
standard Web Crypto API, so it runs on Node, Bun, Deno, the Edge runtime and Workers alike.

Three clients:

- **`Nemu`** takes a workspace API key (`sk_…`), for automating **your own** workspace.
- **`NemuOAuth`** runs the "Login with Nemu" flow, for acting **on behalf of a user** who authorizes your app.
- **`NemuDevice`** runs the device grant, for a CLI or anything else with no safe place to keep a secret.

One API key works everywhere: inference on `api.nemu.cc`, and Context, vaults and workspace
management here. What it may do is chosen when the key is created on the Keys page:
inference, Context read and write, and workspace settings read and write.

## Install

```bash
bun add @nemu-ai/sdk
```

## API key (your own workspace)

```ts
import { Nemu } from "@nemu-ai/sdk";

const nemu = new Nemu({ api_key: process.env.NEMU_API_KEY! });

const ws = await nemu.workspaces.get(workspace_id);
await ws.update({ name: "renamed" });
await ws.providers.create({
  name: "my-provider",
  priority: 1,
  compatibility: "OPENAI_COMPATIBLE",
  base_url: "https://example.com/v1",
});
```

`base_url` defaults to `https://app.nemu.cc/api/v1`.

A key belongs to one workspace and only reaches that workspace. Listing every workspace, the
account profile and members are not available to a key; use `NemuOAuth` or `NemuDevice` for
those.

Returned values are **live entities**. `ws.name` is data, `ws.update()` and `ws.delete()` act on it, and workspace-scoped resources are bound sub-resources: `ws.providers`, `ws.models`, `ws.prompts`, `ws.mappings`, `ws.workflows`, `ws.members`.

### Budget

```ts
const { budget, current_spend, remaining } = await ws.get_budget();
await ws.set_budget(50);
```

## Login with Nemu (act on behalf of a user)

```ts
import { NemuOAuth, build_scopes } from "@nemu-ai/sdk";

const oauth = new NemuOAuth({
  client_id: process.env.NEMU_CLIENT_ID!,
  client_secret: process.env.NEMU_CLIENT_SECRET!,
  redirect_uri: "https://your.app/callback",
});

const { url, code_verifier, state } = await oauth.authorize_url({
  scopes: build_scopes({ profile: "read", workspaces: true, models: "read" }),
  state: crypto.randomUUID(),
});

const nemu = await oauth.exchange_code({ code, code_verifier });
const user = await nemu.user.get();

const tokens = nemu.tokens;
const restored = oauth.from_tokens(tokens, (rotated) => save(rotated));
```

PKCE (S256) is generated for you. Access tokens auto-refresh via the refresh token. Pass `on_refresh` to `exchange_code` or `from_tokens` to persist rotated tokens.

## Device grant (a CLI, or anything with no secret)

`NemuDevice` is the public client flow. It holds no secret, so it is the one to use in something you
distribute. Ask for a code, show it to the person, then poll until they approve it in a browser.

```ts
import { NemuDevice } from "@nemu-ai/sdk";

const device = new NemuDevice({ client_id: "nemu_cli" });

const request = await device.request_code({ workspaces: true, models: "read" });
console.log(`Open ${request.verification_uri} and enter ${request.user_code}`);

const nemu = await device.poll(request);
const workspaces = await nemu.workspaces.list();
```

`poll` respects the interval the server hands back, backs off when told to slow down, and resolves to
an authenticated `Nemu` the moment the person approves. It rejects with a `NemuDeviceError` carrying a
`code` of `access_denied`, `expired_token` or `cancelled`. Pass an `AbortSignal` to stop waiting.

Store `nemu.tokens` and rebuild the client later with `device.from_tokens(tokens, on_refresh)`. Access
tokens refresh on their own, and a public client refreshes without a secret.

## Scopes

`build_scopes` turns a resource, an action, or a map into the exact scope strings the authorize endpoint expects. It validates as it builds, so a typo throws immediately instead of failing as a `403` much later.

```ts
import { build_scopes } from "@nemu-ai/sdk";

build_scopes("user", "read", true);
build_scopes({ user: { read: true } });
build_scopes({ workspaces: true, models: "read", quotas: ["read", "write"] });
build_scopes("profile:read", "mapping:write");
```

All four forms are accepted, results are deduplicated and returned in canonical order.

| Form | Meaning |
| --- | --- |
| `build_scopes(resource, action, enabled?)` | One resource. `enabled: false` yields `[]`, which makes conditional scopes easy |
| `build_scopes(map)` | `true` means every action the resource supports, or pass `"read"`, `["read", "write"]`, or `{ read: true, write: false }` |
| `build_scopes("resource:action", …)` | Validate scope strings you already have |
| `build_scopes("workspaces", "models")` | Bare resource names expand to every action they support |

`authorize_url` accepts any of these directly, so `build_scopes` is optional:

```ts
await oauth.authorize_url({ scopes: { workspaces: true, usage: "read" } });
```

Aliases are accepted for the names that differ from the resource they guard: `user` and `account` map to `profile`, `mappings` maps to `mapping`, `metrics` maps to `usage`, `api_keys` maps to `keys`, `budgets` maps to `budget`, and `index` maps to `indexes`.

Companions: `format_scopes(...)` returns the space-separated string, `parse_scopes(str)` reads a scope string back into a validated list, `is_scope(str)` narrows a string, and `ALL_SCOPES` is the canonical list of all 23.

The full set, in canonical order:

| Resource | Actions |
| --- | --- |
| `profile` | `read` |
| `workspaces` | `read` `write` `delete` |
| `budget` | `read` `write` |
| `indexes` | `read` `write` |
| `members` | `read` `write` |
| `providers` | `read` `write` |
| `models` | `read` `write` |
| `prompts` | `read` `write` |
| `mapping` | `read` `write` |
| `keys` | `read` `write` |
| `usage` | `read` |
| `quotas` | `read` `write` |

`profile` and `usage` are read-only, and `workspaces` is the only resource with a separate
`delete`. `build_scopes("profile", "write")` throws.

Three of these guard calls that are easy to miss. `Workspace.delete()` needs `workspaces:delete`,
`get_budget()` and `set_budget()` need `budget:read` and `budget:write`, and `nemu.indexes` needs
`indexes:read` and `indexes:write`. Requesting only `workspaces` will not cover any of them.

## Resources and verbs

| Resource | Access | Verbs |
| --- | --- | --- |
| `nemu.user` | account | `get` `me` |
| `nemu.workspaces` | account | `list` `get` `create` · entity `update` `delete` `get_budget` `set_budget` |
| `ws.members` | workspace | `list` `invite` · entity `update_role` `remove` |
| `ws.providers` / `ws.models` / `ws.prompts` / `ws.mappings` | workspace | `list` `get` `create` · entity `update` `delete` |
| `ws.workflows` | workspace | `list` `get` (read-only) |
| `nemu.indexes` | account | `list` `get` `create` `delete` |
| `nemu.quotas` | account | `list` `get` · entity `update` `delete` |
| `nemu.metrics` | account | `list` `get` (read-only) |
| `nemu.health` | none | `check` |
| `nemu.version()` | none | supported API versions |

`list()` on providers, models, prompts, mappings, and workflows accepts server-side filters, for example `ws.models.list({ type: "chat", provider_id })`.

### Things the API does that the types cannot express

- Creates always land in the account's **default workspace**. Scoping a create through `ws.providers.create(...)` does not override that.
- `list` and `get` are genuinely workspace-scoped, so reads and writes can disagree if the workspace is not the default one.
- Indexes are resolved from the default workspace and are exposed on the client as `nemu.indexes`, not per workspace.
- `update()` re-reads the entity after the write, because the API returns no body on `PATCH`.

## Options

```ts
new Nemu({
  client_id,
  client_secret,
  base_url,
  token_url,
  api_version,
  timeout,
  retries,
  retry_delay,
  headers,
  fetch,
});
```

## Errors

All failures throw a subclass of `NemuError`: `NemuAuthError` (401), `NemuPermissionError` (403), `NemuNotFoundError` (404), `NemuValidationError` (400, with `.details`), `NemuRateLimitError` (429, with `.retry_after`), `NemuServerError` (5xx), `NemuNetworkError`.

`build_scopes` throws `NemuValidationError` for an unknown resource, an unsupported action, or a malformed scope string.
