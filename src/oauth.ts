import { Nemu, resolve_urls } from "./client.js";
import { OAuthTokenProvider, request_token } from "./core/tokens.js";
import { create_pkce } from "./core/pkce.js";
import { build_scopes, type Scope, type ScopeInput } from "./scopes.js";
import type { NemuOAuthConfig, OAuthTokens } from "./types.js";

export interface AuthorizeUrlParams {
  scopes: ScopeInput | ScopeInput[];
  state?: string;
}

export interface AuthorizeUrlResult {
  url: string;
  code_verifier: string;
  scopes: Scope[];
  state?: string;
}

export class NemuOAuth {
  private client_id: string;
  private client_secret: string;
  private redirect_uri: string;
  private options: NemuOAuthConfig;
  private token_url: string;
  private authorize_endpoint: string;
  private fetch_impl: typeof fetch;

  constructor(config: NemuOAuthConfig) {
    this.client_id = config.client_id;
    this.client_secret = config.client_secret;
    this.redirect_uri = config.redirect_uri;
    this.options = config;
    const { token_url, origin } = resolve_urls(config);
    this.token_url = token_url;
    this.authorize_endpoint = `${origin}/oauth/authorize`;
    this.fetch_impl = config.fetch ?? fetch;
  }

  async authorize_url(params: AuthorizeUrlParams): Promise<AuthorizeUrlResult> {
    const pkce = await create_pkce();
    const scopes = build_scopes(
      ...(Array.isArray(params.scopes) ? params.scopes : [params.scopes]),
    );
    const search = new URLSearchParams({
      response_type: "code",
      client_id: this.client_id,
      redirect_uri: this.redirect_uri,
      scope: scopes.join(" "),
      code_challenge: pkce.challenge,
      code_challenge_method: "S256",
    });
    if (params.state) search.set("state", params.state);
    return {
      url: `${this.authorize_endpoint}?${search.toString()}`,
      code_verifier: pkce.verifier,
      scopes,
      state: params.state,
    };
  }

  async exchange_code(params: {
    code: string;
    code_verifier: string;
    on_refresh?: (tokens: OAuthTokens) => void;
  }): Promise<Nemu> {
    const data = await request_token(this.fetch_impl, this.token_url, {
      grant_type: "authorization_code",
      code: params.code,
      redirect_uri: this.redirect_uri,
      code_verifier: params.code_verifier,
      client_id: this.client_id,
      client_secret: this.client_secret,
    });

    return this.from_tokens(
      {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + (data.expires_in ?? 3600) * 1000,
        scope: data.scope,
      },
      params.on_refresh,
    );
  }

  from_tokens(
    tokens: OAuthTokens,
    on_refresh?: (tokens: OAuthTokens) => void,
  ): Nemu {
    const provider = new OAuthTokenProvider(
      this.token_url,
      this.client_id,
      this.client_secret,
      tokens,
      this.fetch_impl,
      on_refresh,
    );
    return Nemu.from_oauth_provider(provider, this.options);
  }
}
