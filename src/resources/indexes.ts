import { BaseEntity, type ClientContext } from "./base.js";
import type {
  IndexData,
  CreateIndexData,
  CreateIndexResult,
} from "../types.js";

export interface Index extends IndexData {}

export class Index extends BaseEntity<IndexData> {
  async delete(): Promise<void> {
    await this._ctx.http.delete(`/indexes/${this.id}`);
  }
}

export const index_factory = (ctx: ClientContext, data: IndexData) =>
  new Index(ctx, data);

export class Indexes {
  constructor(private ctx: ClientContext) {}

  async list(): Promise<Index[]> {
    const data = await this.ctx.http.get<IndexData[]>("/indexes");
    return (data ?? []).map((entry) => new Index(this.ctx, entry));
  }

  async get(id: string): Promise<Index> {
    const data = await this.ctx.http.get<IndexData>(`/indexes/${id}`);
    return new Index(this.ctx, data);
  }

  async create(data: CreateIndexData): Promise<CreateIndexResult> {
    return this.ctx.http.post<CreateIndexResult>("/indexes", data);
  }

  async delete(id: string): Promise<void> {
    await this.ctx.http.delete(`/indexes/${id}`);
  }
}
