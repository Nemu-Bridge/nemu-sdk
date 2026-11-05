import { BaseEntity, update_entity, type ClientContext } from "./base.js";
import type { ModelData, UpdateModelData } from "../types.js";

export interface Model extends ModelData {}

export class Model extends BaseEntity<ModelData> {
  async update(data: UpdateModelData): Promise<this> {
    const updated = await update_entity<ModelData>(
      this._ctx,
      "/models",
      this.id,
      data,
    );
    Object.assign(this, updated);
    return this;
  }

  async delete(): Promise<void> {
    await this._ctx.http.delete(`/models/${this.id}`);
  }
}

export const model_factory = (ctx: ClientContext, data: ModelData) =>
  new Model(ctx, data);
