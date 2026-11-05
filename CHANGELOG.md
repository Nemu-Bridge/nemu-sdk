# Changelog

## 2.0.0

Breaking: client credentials (`client_id` and `client_secret`) are gone. Create the client with an
API key, `new Nemu({ api_key })`, the same `sk_` key that calls the gateway, or with an OAuth
token. A key acts inside its own workspace. `nemu.context` uses the unified routes under `/api/v1`
and works per workspace. Earlier versions call routes that no longer exist and need this update.

## 1.3.0

`nemu.context` reads and writes Nemu Context, the project memory coding agents share: `projects()`,
`open()`, `project()`, `rename()`, `delete_project()`, `entries()`, `write()`, `write_many()`,
`entry()`, `update()`, `forget()`, `load()`, `search()` and `export()`. The scope table gains
`context:read` and `context:write`.

## 1.2.0

Added API version `2026-09-15`, now the default. Quota rules can target an API
key, a member or a provider as well as a model, so `Quota` carries `key_id`,
`member_id` and `provider_id` with their `api_key`, `member` and `provider`
summaries, and `Quota.update()` accepts those targets. `model_id` is now
nullable, since a rule can target something other than a model. Pin
`api_version: ApiVersion.V2026_07_14` to keep the old model-only shape.

## 1.1.0

Added `NemuDevice` for the OAuth device grant, so a CLI or anything else with no
safe place to keep a secret can sign in.

Fixed the scope table. It was missing `workspaces:delete`, `budget:read`,
`budget:write`, `indexes:read` and `indexes:write`, so you could call
`Workspace.delete()`, the budget methods and `nemu.indexes` but could never ask
for permission to use them. `build_scopes("indexes")` threw outright.

The ESM build was CommonJS. With `module: NodeNext` and no `type` field in
package.json, TypeScript emits CJS for both targets, so `import` resolved to the
CommonJS bundle and nothing tree shook. Each build now ships its own `type`
manifest.

Replaced the last `Buffer` call with `btoa`, so the package really does run on
Workers and the Edge runtime the way the README claims.

`ProviderCompatibility` was missing `OPENAI_RESPONSES`, which the API has
accepted for a while.

`Nemu.tokens` dropped the granted scope. It survives a refresh now, so callers
can see what they were actually given.

## 1.0.0

First release.
