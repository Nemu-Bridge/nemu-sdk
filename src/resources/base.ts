import type { HttpClient } from "../core/http.js";
import type { ApiResponse } from "../types.js";

export interface ClientContext {
  http: HttpClient;
}

export type EntityFactory<TData, TEntity> = (
  ctx: ClientContext,
  data: TData,
) => TEntity;

export function to_query<T extends object>(
  options?: T,
): Record<string, string | undefined> {
  const query: Record<string, string | undefined> = {};
  if (!options) return query;
  for (const [key, value] of Object.entries(options)) {
    if (value === undefined) continue;
    query[key] = String(value);
  }
  return query;
}

export async function update_entity<TData>(
  ctx: ClientContext,
  path: string,
  id: string,
  data: unknown,
): Promise<TData> {
  await ctx.http.patch<ApiResponse<unknown>>(`${path}/${id}`, data);
  const res = await ctx.http.get<ApiResponse<TData>>(`${path}/${id}`);
  return res.data;
}

export abstract class BaseEntity<TData extends { id: string }> {
  protected readonly _ctx!: ClientContext;

  constructor(ctx: ClientContext, data: TData) {
    Object.defineProperty(this, "_ctx", { value: ctx, enumerable: false });
    Object.assign(this, data);
  }

  toJSON(): TData {
    return { ...this } as unknown as TData;
  }
}

export class WorkspaceScopedCrud<TData, TCreate, TEntity, TOptions extends object = Record<string, never>> {
  constructor(
    protected ctx: ClientContext,
    protected path: string,
    protected workspace_id: string,
    protected factory: EntityFactory<TData, TEntity>,
  ) {}

  async list(options?: TOptions): Promise<TEntity[]> {
    const res = await this.ctx.http.get<ApiResponse<TData[]>>(this.path, {
      ...to_query(options),
      workspace_id: this.workspace_id,
    });
    return (res.data ?? []).map((data) => this.factory(this.ctx, data));
  }

  async get(id: string): Promise<TEntity> {
    const res = await this.ctx.http.get<ApiResponse<TData>>(
      `${this.path}/${id}`,
      { workspace_id: this.workspace_id },
    );
    return this.factory(this.ctx, res.data);
  }

  async create(data: TCreate): Promise<TEntity> {
    const res = await this.ctx.http.post<ApiResponse<TData>>(this.path, data);
    return this.factory(this.ctx, res.data);
  }
}

export class ReadOnlyWorkspaceScoped<TData, TEntity, TOptions extends object = Record<string, never>> {
  constructor(
    protected ctx: ClientContext,
    protected path: string,
    protected workspace_id: string,
    protected factory: EntityFactory<TData, TEntity>,
  ) {}

  async list(options?: TOptions): Promise<TEntity[]> {
    const res = await this.ctx.http.get<ApiResponse<TData[]>>(this.path, {
      ...to_query(options),
      workspace_id: this.workspace_id,
    });
    return (res.data ?? []).map((data) => this.factory(this.ctx, data));
  }

  async get(id: string): Promise<TEntity> {
    const res = await this.ctx.http.get<ApiResponse<TData>>(
      `${this.path}/${id}`,
      { workspace_id: this.workspace_id },
    );
    return this.factory(this.ctx, res.data);
  }
}
