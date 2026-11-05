import { BaseEntity, update_entity, type ClientContext } from "./base.js";
import type { ApiResponse, QuotaData, UpdateQuotaData } from "../types.js";

export interface Quota extends QuotaData {}

export class Quota extends BaseEntity<QuotaData> {
  async update(data: UpdateQuotaData): Promise<this> {
    const updated = await update_entity<QuotaData>(
      this._ctx,
      "/quotas",
      this.id,
      data,
    );
    Object.assign(this, updated);
    return this;
  }

  async delete(): Promise<void> {
    await this._ctx.http.delete(`/quotas/${this.id}`);
  }
}

export class Quotas {
  constructor(private ctx: ClientContext) {}

  async list(): Promise<Quota[]> {
    const res = await this.ctx.http.get<ApiResponse<QuotaData[]>>("/quotas");
    return (res.data ?? []).map((data) => new Quota(this.ctx, data));
  }

  async get(id: string): Promise<Quota> {
    const res = await this.ctx.http.get<ApiResponse<QuotaData>>(
      `/quotas/${id}`,
    );
    return new Quota(this.ctx, res.data);
  }
}
