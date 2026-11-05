import { HttpClient, DEFAULT_BASE_URL, to_origin } from "./core/http.js";
import { ApiKeyProvider, OAuthTokenProvider } from "./core/tokens.js";
import { NemuError } from "./core/errors.js";
import type { ClientContext } from "./resources/base.js";
import { Workspaces } from "./resources/workspaces.js";
import { Quotas } from "./resources/quotas.js";
import { Metrics } from "./resources/metrics.js";
import { Indexes } from "./resources/indexes.js";
import { Health } from "./resources/health.js";
import { Context } from "./resources/context.js";
import { UserResource } from "./resources/user.js";
import type {
  NemuConfig,
  NemuOptions,
  OAuthTokens,
  VersionInfo,
} from "./types.js";

const SDK_VERSION = "2025_A0_MIRA";

export function resolve_urls(options: NemuOptions): {
  base_url: string;
  token_url: string;
  origin: string;
  version_url: string;
} {
  const base_url = (options.base_url ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  const origin = to_origin(base_url);
  const token_url = options.token_url ?? `${origin}/api/oauth/token`;
  const version_url = `${origin}/api/version`;
  return { base_url, token_url, origin, version_url };
}

export class Nemu {
  mode!: "key" | "oauth";
  user!: UserResource;
  workspaces!: Workspaces;
  quotas!: Quotas;
  metrics!: Metrics;
  indexes!: Indexes;
  health!: Health;
  context!: Context;
  private _http!: HttpClient;
  private _oauth_provider?: OAuthTokenProvider;

  constructor(config: NemuConfig) {
    const http = new HttpClient(new ApiKeyProvider(config.api_key), config);
    this.mode = "key";
    this._init({ http });
  }

  private _init(ctx: ClientContext): void {
    this._http = ctx.http;
    this.user = new UserResource(ctx);
    this.workspaces = new Workspaces(ctx);
    this.quotas = new Quotas(ctx);
    this.metrics = new Metrics(ctx);
    this.indexes = new Indexes(ctx);
    this.health = new Health(ctx);
    this.context = new Context(ctx);
  }

  version(): Promise<VersionInfo> {
    return this._http.get_unversioned<VersionInfo>("/api/version");
  }

  static from_oauth_provider(
    provider: OAuthTokenProvider,
    options: NemuOptions,
  ): Nemu {
    const instance = Object.create(Nemu.prototype) as Nemu;
    const http = new HttpClient(provider, options);
    instance.mode = "oauth";
    instance._oauth_provider = provider;
    instance._init({ http });
    return instance;
  }

  get tokens(): OAuthTokens | undefined {
    return this._oauth_provider?.tokens;
  }

  refresh(): Promise<OAuthTokens> {
    if (!this._oauth_provider) {
      throw new NemuError(
        "refresh() is only available on a client created from OAuth tokens.",
      );
    }
    return this._oauth_provider.refresh();
  }
}
