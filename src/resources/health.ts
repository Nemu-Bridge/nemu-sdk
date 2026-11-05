import type { ClientContext } from "./base.js";
import type { HealthResponse } from "../types.js";

export class Health {
  constructor(private ctx: ClientContext) {}

  async check(): Promise<HealthResponse> {
    return this.ctx.http.get_unversioned<HealthResponse>("/api/health", {
      authenticated: true,
    });
  }
}
