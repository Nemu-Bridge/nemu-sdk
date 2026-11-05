import { NemuAuthError } from "./errors.js";
import type { OAuthTokens } from "../types.js";

export interface TokenProvider {
  get_token(): Promise<string>;
  invalidate(): void;
}

interface TokenEndpointResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}

const EXPIRY_SKEW_MS = 30_000;

export async function request_token(
  fetch_impl: typeof fetch,
  token_url: string,
  body: Record<string, string>,
): Promise<TokenEndpointResponse> {
  const response = await fetch_impl(token_url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });

  const data = (await response.json().catch(() => null)) as
    | (TokenEndpointResponse & { error?: string; error_description?: string })
    | null;

  if (!response.ok || !data?.access_token) {
    throw new NemuAuthError(
      data?.error_description ?? data?.error ?? "Failed to obtain access token",
    );
  }

  return data;
}

export class ApiKeyProvider implements TokenProvider {
  constructor(private api_key: string) {
    if (!/^sk_[a-z]{5}-[a-z]{5}\.[A-Za-z0-9]{40}$/.test(api_key)) {
      throw new NemuAuthError(
        "That is not a Nemu API key. Create one on the Keys page of the console.",
      );
    }
  }

  async get_token(): Promise<string> {
    return this.api_key;
  }

  invalidate(): void {}
}

export class OAuthTokenProvider implements TokenProvider {
  private access_token: string;
  private refresh_token?: string;
  private expires_at: number;
  private scope?: string;

  constructor(
    private token_url: string,
    private client_id: string,
    private client_secret: string,
    tokens: OAuthTokens,
    private fetch_impl: typeof fetch,
    private on_refresh?: (tokens: OAuthTokens) => void,
  ) {
    this.access_token = tokens.access_token;
    this.refresh_token = tokens.refresh_token;
    this.expires_at = tokens.expires_at ?? 0;
    this.scope = tokens.scope;
  }

  async get_token(): Promise<string> {
    if (this.access_token && Date.now() < this.expires_at - EXPIRY_SKEW_MS) {
      return this.access_token;
    }
    if (!this.refresh_token) return this.access_token;

    const tokens = await this.refresh();
    return tokens.access_token;
  }

  async refresh(): Promise<OAuthTokens> {
    if (!this.refresh_token) {
      throw new NemuAuthError("No refresh token available");
    }

    const data = await request_token(this.fetch_impl, this.token_url, {
      grant_type: "refresh_token",
      refresh_token: this.refresh_token,
      client_id: this.client_id,
      client_secret: this.client_secret,
    });

    this.access_token = data.access_token;
    this.refresh_token = data.refresh_token ?? this.refresh_token;
    this.expires_at = Date.now() + (data.expires_in ?? 3600) * 1000;
    this.scope = data.scope ?? this.scope;
    this.on_refresh?.(this.tokens);
    return this.tokens;
  }

  get tokens(): OAuthTokens {
    return {
      access_token: this.access_token,
      refresh_token: this.refresh_token,
      expires_at: this.expires_at,
      scope: this.scope,
    };
  }

  invalidate(): void {
    this.expires_at = 0;
  }
}
