import type { ClientContext } from "./base.js";
import { to_query } from "./base.js";

export interface ContextProject {
  id: string;
  kind: "local" | "computer";
  name: string;
  root_commit: string | null;
  remote_url: string | null;
  linked_computer_project_id: string | null;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
  entry_count?: number;
}

export interface ContextEntry {
  id: string;
  project_id: string;
  name: string;
  tag: string;
  subject: string;
  body: string;
  state: "current" | "superseded";
  refs: string[];
  branch: string | null;
  commit: string | null;
  origin: { kind: "computer" | "device" | "dashboard"; id: string | null };
  client: string | null;
  pinned: boolean;
  stale: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContextEntryInput {
  name: string;
  subject: string;
  body: string;
  refs?: string[];
  state?: "current" | "superseded";
  branch?: string;
  commit?: string;
  pinned?: boolean;
}

export interface ContextEntryPatch {
  subject?: string;
  body?: string;
  refs?: string[];
  state?: "current" | "superseded";
  pinned?: boolean;
}

export interface ContextLoad {
  project: { id: string; name: string };
  branch: string | null;
  handoff: ContextEntry | null;
  pinned: ContextEntry[];
  index: { name: string; subject: string; stale: boolean; refs: string[]; commit: string | null; updated_at: string }[];
  truncated: boolean;
  text: string;
}

export interface ContextBatchResult {
  name: string;
  status: "created" | "updated" | "skipped";
  reason?: string;
  redacted?: boolean;
}

export interface ContextListOptions {
  tag?: string;
  device?: string;
  cursor?: string;
  limit?: number;
}

export interface ContextSearchOptions {
  tag?: string;
  device?: string;
  limit?: number;
}

interface Wrapped<T> {
  data: T;
}

function project_path(project_id: string): string {
  return `/projects/${encodeURIComponent(project_id)}`;
}

export class Context {
  constructor(private ctx: ClientContext) {}

  async projects(): Promise<ContextProject[]> {
    const result = await this.ctx.http.get<Wrapped<ContextProject[]>>("/projects");
    return result.data;
  }

  async open(identity: { name: string; root_commit?: string; remote_url?: string }): Promise<ContextProject> {
    const result = await this.ctx.http.post<Wrapped<ContextProject>>("/projects", identity);
    return result.data;
  }

  async project(project_id: string): Promise<ContextProject> {
    const result = await this.ctx.http.get<Wrapped<ContextProject>>(project_path(project_id));
    return result.data;
  }

  async rename(project_id: string, name: string): Promise<ContextProject> {
    const result = await this.ctx.http.patch<Wrapped<ContextProject>>(project_path(project_id), { name });
    return result.data;
  }

  async delete_project(project_id: string): Promise<void> {
    await this.ctx.http.delete(project_path(project_id));
  }

  async entries(
    project_id: string,
    options?: ContextListOptions,
  ): Promise<{ data: ContextEntry[]; next_cursor: string | null }> {
    return this.ctx.http.get<{ data: ContextEntry[]; next_cursor: string | null }>(
      `${project_path(project_id)}/entries`,
      to_query(options),
    );
  }

  async write(project_id: string, entry: ContextEntryInput): Promise<ContextEntry & { redacted: boolean }> {
    const result = await this.ctx.http.post<{ data: ContextEntry; redacted: boolean }>(
      `${project_path(project_id)}/entries`,
      entry,
    );
    return { ...result.data, redacted: result.redacted };
  }

  async write_many(project_id: string, entries: ContextEntryInput[]): Promise<ContextBatchResult[]> {
    const result = await this.ctx.http.post<Wrapped<ContextBatchResult[]>>(
      `${project_path(project_id)}/entries/batch`,
      { entries },
    );
    return result.data;
  }

  async entry(entry_id: string): Promise<ContextEntry> {
    const result = await this.ctx.http.get<Wrapped<ContextEntry>>(`/entries/${encodeURIComponent(entry_id)}`);
    return result.data;
  }

  async update(entry_id: string, patch: ContextEntryPatch): Promise<ContextEntry> {
    const result = await this.ctx.http.patch<Wrapped<ContextEntry>>(
      `/entries/${encodeURIComponent(entry_id)}`,
      patch,
    );
    return result.data;
  }

  async forget(entry_id: string): Promise<void> {
    await this.ctx.http.delete(`/entries/${encodeURIComponent(entry_id)}`);
  }

  async load(project_id: string, branch?: string): Promise<ContextLoad> {
    const result = await this.ctx.http.get<Wrapped<ContextLoad>>(
      `${project_path(project_id)}/load`,
      to_query({ branch }),
    );
    return result.data;
  }

  async search(project_id: string, query: string, options?: ContextSearchOptions): Promise<ContextEntry[]> {
    const result = await this.ctx.http.get<Wrapped<ContextEntry[]>>(
      `${project_path(project_id)}/search`,
      to_query({ q: query, ...options }),
    );
    return result.data;
  }

  async export(): Promise<unknown> {
    const result = await this.ctx.http.get<Wrapped<unknown>>("/projects/export");
    return result.data;
  }
}
