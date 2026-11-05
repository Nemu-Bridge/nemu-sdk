import { BaseEntity, update_entity, type ClientContext } from "./base.js";
import type { ProviderData, UpdateProviderData } from "../types.js";

export interface Provider extends ProviderData {}

export class Provider extends BaseEntity<ProviderData> {
  async update(data: UpdateProviderData): Promise<this> {
    const updated = await update_entity<ProviderData>(
      this._ctx,
      "/providers",
      this.id,
      data,
    );
    Object.assign(this, updated);
    return this;
  }

  async delete(): Promise<void> {
    await this._ctx.http.delete(`/providers/${this.id}`);
  }
}

export const provider_factory = (ctx: ClientContext, data: ProviderData) =>
  new Provider(ctx, data);
