import {
  NemuError,
  NemuAuthError,
  NemuPermissionError,
  NemuNotFoundError,
  NemuRateLimitError,
  NemuValidationError,
  NemuServerError,
  NemuNetworkError,
} from "./errors.js";
import type { TokenProvider } from "./tokens.js";
import type { NemuOptions } from "../types.js";
import {
  API_VERSION_HEADER,
  LATEST_API_VERSION,
} from "../versions.js";

interface ErrorBody {
  error?: string | { message?: string };
  error_description?: string;
  details?: Record<string, string[]>;
  retry_after?: number;
}

export const DEFAULT_BASE_URL = "https://app.nemu.cc/api/v1";

export function to_origin(base_url: string): string {
  return base_url
    .replace(/\/+$/, "")
    .replace(/\/api\/v\d+$/, "")
    .replace(/\/api$/, "");
}

export class HttpClient {
  private base_url: string;
  private origin: string;
  private api_version: string;
  private timeout: number;
  private retries: number;
  private retry_delay: number;
  private headers: Record<string, string>;
  private fetch_impl: typeof fetch;

  constructor(
    private tokens: TokenProvider,
    options: NemuOptions,
  ) {
    this.base_url = (options.base_url ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.origin = to_origin(this.base_url);
    this.api_version = options.api_version ?? LATEST_API_VERSION;
    this.timeout = options.timeout ?? 30_000;
    this.retries = options.retries ?? 2;
    this.retry_delay = options.retry_delay ?? 500;
    this.headers = options.headers ?? {};
    this.fetch_impl = options.fetch ?? fetch;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private raise(status: number, body: ErrorBody | null): never {
    const field = body?.error;
    const message =
      body?.error_description ??
      (typeof field === "string" ? field : field?.message) ??
      "Request failed";

    switch (status) {
      case 400:
        throw new NemuValidationError(message, body?.details);
      case 401:
        throw new NemuAuthError(message);
      case 403:
        throw new NemuPermissionError(message);
      case 404:
        throw new NemuNotFoundError("Resource");
      case 429:
        throw new NemuRateLimitError(message, body?.retry_after);
      default:
        if (status >= 500) throw new NemuServerError(message);
        throw new NemuError(message, status);
    }
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.base_url}${path}`;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeout);

      try {
        const token = await this.tokens.get_token();
        const response = await this.fetch_impl(url, {
          method,
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
            [API_VERSION_HEADER]: this.api_version,
            ...this.headers,
          },
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timer);

        const content_type = response.headers.get("content-type");
        const parsed: any = content_type?.includes("application/json")
          ? await response.json().catch(() => null)
          : null;

        if (response.ok) return parsed as T;

        if (response.status === 401 && attempt === 0) {
          this.tokens.invalidate();
          continue;
        }

        if (response.status === 429 && attempt < this.retries) {
          const retry_after =
            parsed?.retry_after ??
            parseInt(response.headers.get("retry-after") ?? "1", 10);
          await this.sleep(retry_after * 1000);
          continue;
        }

        if (response.status >= 500 && attempt < this.retries) {
          await this.sleep(this.retry_delay * Math.pow(2, attempt));
          continue;
        }

        this.raise(response.status, parsed);
      } catch (err) {
        clearTimeout(timer);
        if (err instanceof NemuError) throw err;

        const is_network =
          err instanceof Error &&
          (err.name === "TypeError" ||
            err.name === "AbortError" ||
            err.message.includes("fetch"));

        if (is_network && attempt < this.retries) {
          await this.sleep(this.retry_delay * Math.pow(2, attempt));
          continue;
        }
        if (is_network) throw new NemuNetworkError();
        throw err;
      }
    }

    throw new NemuNetworkError("Max retries exceeded");
  }

  async get_unversioned<T>(
    path: string,
    opts?: { authenticated?: boolean },
  ): Promise<T> {
    const url = `${this.origin}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    const headers: Record<string, string> = { ...this.headers };
    if (opts?.authenticated) {
      headers.authorization = `Bearer ${await this.tokens.get_token()}`;
    }

    try {
      const response = await this.fetch_impl(url, {
        method: "GET",
        headers,
        signal: controller.signal,
      });
      clearTimeout(timer);

      const parsed: any = response.headers
        .get("content-type")
        ?.includes("application/json")
        ? await response.json().catch(() => null)
        : null;

      if (response.ok) return parsed as T;
      this.raise(response.status, parsed);
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof NemuError) throw err;
      throw new NemuNetworkError();
    }
  }

  get<T>(
    path: string,
    params?: Record<string, string | undefined>,
  ): Promise<T> {
    if (params) {
      const search = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) search.set(key, value);
      }
      const query = search.toString();
      if (query) path = `${path}?${query}`;
    }
    return this.request<T>("GET", path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }
}
