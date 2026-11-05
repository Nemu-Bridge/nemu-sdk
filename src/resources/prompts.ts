import { BaseEntity, update_entity, type ClientContext } from "./base.js";
import type { PromptData, UpdatePromptData } from "../types.js";

export interface Prompt extends PromptData {}

export class Prompt extends BaseEntity<PromptData> {
  async update(data: UpdatePromptData): Promise<this> {
    const updated = await update_entity<PromptData>(
      this._ctx,
      "/prompts",
      this.id,
      data,
    );
    Object.assign(this, updated);
    return this;
  }

  async delete(): Promise<void> {
    await this._ctx.http.delete(`/prompts/${this.id}`);
  }
}

export const prompt_factory = (ctx: ClientContext, data: PromptData) =>
  new Prompt(ctx, data);
