export enum ApiVersion {
  V2026_07_14 = "2026-07-14",
  V2026_09_15 = "2026-09-15",
}

export const SUPPORTED_API_VERSIONS: readonly ApiVersion[] = [
  ApiVersion.V2026_07_14,
  ApiVersion.V2026_09_15,
];

export const LATEST_API_VERSION: ApiVersion =
  SUPPORTED_API_VERSIONS[SUPPORTED_API_VERSIONS.length - 1];

export const API_VERSION_HEADER = "Nemu-Api-Version";

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export enum Endpoint {
  Version = "/version",
  Health = "/health",
  Token = "/oauth/token",
  Authorize = "/oauth/authorize",
  User = "/user",
  Workspaces = "/workspaces",
  Workspace = "/workspaces/{id}",
  WorkspaceBudget = "/workspaces/{id}/budget",
  WorkspaceMembers = "/workspaces/{id}/members",
  WorkspaceMember = "/workspaces/{id}/members/{member_id}",
  Providers = "/providers",
  Provider = "/providers/{id}",
  Models = "/models",
  Model = "/models/{id}",
  Prompts = "/prompts",
  Prompt = "/prompts/{id}",
  Mappings = "/mappings",
  Mapping = "/mappings/{id}",
  Workflows = "/workflows",
  Workflow = "/workflows/{id}",
  Indexes = "/indexes",
  Index = "/indexes/{id}",
  Quotas = "/quotas",
  Quota = "/quotas/{id}",
  Metrics = "/metrics",
  Metric = "/metrics/{id}",
}

export interface EndpointSpec {
  path: Endpoint;
  methods: HttpMethod[];
  since: ApiVersion;
  versioned: boolean;
}

export const ENDPOINTS: Record<Endpoint, EndpointSpec> = {
  [Endpoint.Version]: {
    path: Endpoint.Version,
    methods: ["GET"],
    since: ApiVersion.V2026_07_14,
    versioned: false,
  },
  [Endpoint.Health]: {
    path: Endpoint.Health,
    methods: ["GET"],
    since: ApiVersion.V2026_07_14,
    versioned: false,
  },
  [Endpoint.Token]: {
    path: Endpoint.Token,
    methods: ["POST"],
    since: ApiVersion.V2026_07_14,
    versioned: false,
  },
  [Endpoint.Authorize]: {
    path: Endpoint.Authorize,
    methods: ["GET"],
    since: ApiVersion.V2026_07_14,
    versioned: false,
  },
  [Endpoint.User]: {
    path: Endpoint.User,
    methods: ["GET"],
    since: ApiVersion.V2026_07_14,
    versioned: true,
  },
  [Endpoint.Workspaces]: {
    path: Endpoint.Workspaces,
    methods: ["GET", "POST"],
    since: ApiVersion.V2026_07_14,
    versioned: true,
  },
  [Endpoint.Workspace]: {
    path: Endpoint.Workspace,
    methods: ["GET", "PATCH", "PUT", "DELETE"],
    since: ApiVersion.V2026_07_14,
    versioned: true,
  },
  [Endpoint.WorkspaceBudget]: {
    path: Endpoint.WorkspaceBudget,
    methods: ["GET", "PATCH", "PUT"],
    since: ApiVersion.V2026_07_14,
    versioned: true,
  },
  [Endpoint.WorkspaceMembers]: {
    path: Endpoint.WorkspaceMembers,
    methods: ["GET", "POST"],
    since: ApiVersion.V2026_07_14,
    versioned: true,
  },
  [Endpoint.WorkspaceMember]: {
    path: Endpoint.WorkspaceMember,
    methods: ["PATCH", "PUT", "DELETE"],
    since: ApiVersion.V2026_07_14,
    versioned: true,
  },
  [Endpoint.Providers]: {
    path: Endpoint.Providers,
    methods: ["GET", "POST"],
    since: ApiVersion.V2026_07_14,
    versioned: true,
  },
  [Endpoint.Provider]: {
    path: Endpoint.Provider,
    methods: ["GET", "PATCH", "PUT", "DELETE"],
    since: ApiVersion.V2026_07_14,
    versioned: true,
  },
  [Endpoint.Models]: {
    path: Endpoint.Models,
    methods: ["GET", "POST"],
    since: ApiVersion.V2026_07_14,
    versioned: true,
  },
  [Endpoint.Model]: {
    path: Endpoint.Model,
    methods: ["GET", "PATCH", "PUT", "DELETE"],
    since: ApiVersion.V2026_07_14,
    versioned: true,
  },
  [Endpoint.Prompts]: {
    path: Endpoint.Prompts,
    methods: ["GET", "POST"],
    since: ApiVersion.V2026_07_14,
    versioned: true,
  },
  [Endpoint.Prompt]: {
    path: Endpoint.Prompt,
    methods: ["GET", "PATCH", "PUT", "DELETE"],
    since: ApiVersion.V2026_07_14,
    versioned: true,
  },
  [Endpoint.Mappings]: {
    path: Endpoint.Mappings,
    methods: ["GET", "POST"],
    since: ApiVersion.V2026_07_14,
    versioned: true,
  },
  [Endpoint.Mapping]: {
    path: Endpoint.Mapping,
    methods: ["GET", "PATCH", "PUT", "DELETE"],
    since: ApiVersion.V2026_07_14,
    versioned: true,
  },
  [Endpoint.Workflows]: {
    path: Endpoint.Workflows,
    methods: ["GET"],
    since: ApiVersion.V2026_07_14,
    versioned: true,
  },
  [Endpoint.Workflow]: {
    path: Endpoint.Workflow,
    methods: ["GET"],
    since: ApiVersion.V2026_07_14,
    versioned: true,
  },
  [Endpoint.Indexes]: {
    path: Endpoint.Indexes,
    methods: ["GET", "POST"],
    since: ApiVersion.V2026_07_14,
    versioned: true,
  },
  [Endpoint.Index]: {
    path: Endpoint.Index,
    methods: ["GET", "DELETE"],
    since: ApiVersion.V2026_07_14,
    versioned: true,
  },
  [Endpoint.Quotas]: {
    path: Endpoint.Quotas,
    methods: ["GET"],
    since: ApiVersion.V2026_07_14,
    versioned: true,
  },
  [Endpoint.Quota]: {
    path: Endpoint.Quota,
    methods: ["GET", "PATCH", "PUT", "DELETE"],
    since: ApiVersion.V2026_07_14,
    versioned: true,
  },
  [Endpoint.Metrics]: {
    path: Endpoint.Metrics,
    methods: ["GET"],
    since: ApiVersion.V2026_07_14,
    versioned: true,
  },
  [Endpoint.Metric]: {
    path: Endpoint.Metric,
    methods: ["GET"],
    since: ApiVersion.V2026_07_14,
    versioned: true,
  },
};
