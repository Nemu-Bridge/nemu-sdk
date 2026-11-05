import { BaseEntity, update_entity, type ClientContext } from "./base.js";
import type { MappingData, UpdateMappingData } from "../types.js";

export interface Mapping extends MappingData {}

export class Mapping extends BaseEntity<MappingData> {
  async update(data: UpdateMappingData): Promise<this> {
    const updated = await update_entity<MappingData>(
      this._ctx,
      "/mappings",
      this.id,
      data,
    );
    Object.assign(this, updated);
    return this;
  }

  async delete(): Promise<void> {
    await this._ctx.http.delete(`/mappings/${this.id}`);
  }
}

export const mapping_factory = (ctx: ClientContext, data: MappingData) =>
  new Mapping(ctx, data);
