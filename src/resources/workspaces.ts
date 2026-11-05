import {
  BaseEntity,
  ReadOnlyWorkspaceScoped,
  WorkspaceScopedCrud,
  type ClientContext,
} from "./base.js";
import { provider_factory, type Provider } from "./providers.js";
import { model_factory, type Model } from "./models.js";
import { prompt_factory, type Prompt } from "./prompts.js";
import { mapping_factory, type Mapping } from "./mappings.js";
import { workflow_factory, type Workflow } from "./workflows.js";
import type {
  ApiResponse,
  WorkspaceData,
  WorkspaceWithStatsData,
  WorkspaceStats,
  WorkspaceOwner,
  WorkspaceBudget,
  UpdateBudgetResponse,
  CreateWorkspaceData,
  UpdateWorkspaceData,
  ProviderData,
  ModelData,
  PromptData,
  MappingData,
  WorkflowData,
  CreateProviderData,
  CreateModelData,
  CreatePromptData,
  CreateMappingData,
  ListProvidersOptions,
  ListModelsOptions,
  ListPromptsOptions,
  ListMappingsOptions,
  ListWorkflowsOptions,
  MemberData,
  InviteMemberData,
  Invitation,
} from "../types.js";

export interface Member extends MemberData {}

export class Member extends BaseEntity<MemberData> {
  async update_role(role: "ADMIN" | "MEMBER"): Promise<this> {
    const res = await this._ctx.http.patch<ApiResponse<MemberData>>(
      `/workspaces/${this.workspace_id}/members/${this.id}`,
      { role },
    );
    Object.assign(this, res.data);
    return this;
  }

  async remove(): Promise<void> {
    await this._ctx.http.delete(
      `/workspaces/${this.workspace_id}/members/${this.id}`,
    );
  }
}

export class WorkspaceMembers {
  constructor(
    private ctx: ClientContext,
    private workspace_id: string,
  ) {}

  async list(): Promise<Member[]> {
    const res = await this.ctx.http.get<ApiResponse<MemberData[]>>(
      `/workspaces/${this.workspace_id}/members`,
    );
    return (res.data ?? []).map((data) => new Member(this.ctx, data));
  }

  async invite(data?: InviteMemberData): Promise<Invitation> {
    const res = await this.ctx.http.post<ApiResponse<Invitation>>(
      `/workspaces/${this.workspace_id}/members`,
      data ?? {},
    );
    return res.data;
  }
}

export interface Workspace extends WorkspaceData {
  my_role?: "OWNER" | "ADMIN" | "MEMBER";
  stats?: WorkspaceStats;
  owner?: WorkspaceOwner | null;
}

export class Workspace extends BaseEntity<WorkspaceData> {
  async update(data: UpdateWorkspaceData): Promise<this> {
    const res = await this._ctx.http.patch<ApiResponse<WorkspaceData>>(
      `/workspaces/${this.id}`,
      data,
    );
    Object.assign(this, res.data);
    return this;
  }

  async delete(): Promise<void> {
    await this._ctx.http.delete(`/workspaces/${this.id}`);
  }

  get_budget(): Promise<WorkspaceBudget> {
    return this._ctx.http.get<WorkspaceBudget>(
      `/workspaces/${this.id}/budget`,
    );
  }

  async set_budget(budget: number): Promise<number> {
    const res = await this._ctx.http.patch<UpdateBudgetResponse>(
      `/workspaces/${this.id}/budget`,
      { budget },
    );
    Object.assign(this, { budget: res.budget });
    return res.budget;
  }

  get members(): WorkspaceMembers {
    return new WorkspaceMembers(this._ctx, this.id);
  }

  get providers(): WorkspaceScopedCrud<
    ProviderData,
    CreateProviderData,
    Provider,
    ListProvidersOptions
  > {
    return new WorkspaceScopedCrud(
      this._ctx,
      "/providers",
      this.id,
      provider_factory,
    );
  }

  get models(): WorkspaceScopedCrud<
    ModelData,
    CreateModelData,
    Model,
    ListModelsOptions
  > {
    return new WorkspaceScopedCrud(
      this._ctx,
      "/models",
      this.id,
      model_factory,
    );
  }

  get prompts(): WorkspaceScopedCrud<
    PromptData,
    CreatePromptData,
    Prompt,
    ListPromptsOptions
  > {
    return new WorkspaceScopedCrud(
      this._ctx,
      "/prompts",
      this.id,
      prompt_factory,
    );
  }

  get mappings(): WorkspaceScopedCrud<
    MappingData,
    CreateMappingData,
    Mapping,
    ListMappingsOptions
  > {
    return new WorkspaceScopedCrud(
      this._ctx,
      "/mappings",
      this.id,
      mapping_factory,
    );
  }

  get workflows(): ReadOnlyWorkspaceScoped<
    WorkflowData,
    Workflow,
    ListWorkflowsOptions
  > {
    return new ReadOnlyWorkspaceScoped(
      this._ctx,
      "/workflows",
      this.id,
      workflow_factory,
    );
  }
}

export class Workspaces {
  constructor(private ctx: ClientContext) {}

  async list(): Promise<Workspace[]> {
    const res =
      await this.ctx.http.get<ApiResponse<WorkspaceWithStatsData[]>>(
        "/workspaces",
      );
    return (res.data ?? []).map((data) => new Workspace(this.ctx, data));
  }

  async get(id: string): Promise<Workspace> {
    const res = await this.ctx.http.get<ApiResponse<WorkspaceWithStatsData>>(
      `/workspaces/${id}`,
    );
    return new Workspace(this.ctx, res.data);
  }

  async create(data: CreateWorkspaceData): Promise<Workspace> {
    const res = await this.ctx.http.post<ApiResponse<WorkspaceData>>(
      "/workspaces",
      data,
    );
    return new Workspace(this.ctx, res.data);
  }
}
