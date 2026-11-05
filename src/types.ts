import type { ApiVersion } from "./versions.js";

export interface NemuOptions {
  base_url?: string;
  token_url?: string;
  api_version?: ApiVersion | string;
  timeout?: number;
  retries?: number;
  retry_delay?: number;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
}

export interface NemuConfig extends NemuOptions {
  api_key: string;
}

export interface NemuOAuthConfig extends NemuOptions {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
}

export interface OAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  scope?: string;
}

export interface ApiResponse<T> {
  data: T;
  total?: number;
  success?: boolean;
  message?: string;
}

export interface Pagination {
  page: number;
  pages: number;
  limit: number;
  total: number;
}

export type ProviderCompatibility =
  | "OPENAI_COMPATIBLE"
  | "ANTHROPIC"
  | "OPENAI_RESPONSES";

export type ProviderSource = "custom" | "automatic";

export interface ProviderData {
  id: string;
  user_id: string;
  workspace_id: string;
  name: string;
  enabled: boolean;
  base_url: string | null;
  user_agent: string | null;
  priority: number;
  compatibility: ProviderCompatibility;
  source: string | null;
  models_dev_id: string | null;
  has_api_key: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProviderData {
  name: string;
  priority: number;
  source?: ProviderSource;
  base_url?: string;
  api_key?: string;
  compatibility?: ProviderCompatibility;
  models_dev_id?: string;
  user_agent?: string;
}

export type UpdateProviderData = CreateProviderData;

export interface ListProvidersOptions {
  name?: string;
  compatibility?: ProviderCompatibility;
}

export type ModelType =
  | "chat"
  | "embedding"
  | "moderation"
  | "vision"
  | "audio"
  | "image";

export interface ModelProviderRef {
  id: string;
  name: string;
  user_id: string;
}

export interface ModelData {
  id: string;
  provider_id: string;
  workspace_id: string;
  enabled: boolean;
  type: string;
  name: string;
  display_name: string | null;
  api_name: string | null;
  gateway_name: string | null;
  context_window: number | null;
  max_output: number | null;
  input_cost: number | null;
  output_cost: number | null;
  cache_read_cost: number | null;
  cache_write_cost: number | null;
  input_cost_over: number | null;
  output_cost_over: number | null;
  cost_over_threshold: number | null;
  request_cost: number | null;
  per_image_cost: number | null;
  per_minute_cost: number | null;
  vision_input_cost: number | null;
  audio_input_cost_per_min: number | null;
  audio_output_cost_per_min: number | null;
  supports_vision: boolean;
  supports_audio_input: boolean;
  supports_audio_output: boolean;
  audio_formats: string | null;
  image_sizes: string | null;
  max_images_per_request: number | null;
  supports_thinking: boolean;
  supports_redacted_thinking: boolean;
  supports_tool_streaming: boolean;
  supports_computer_use: boolean;
  supports_citations: boolean;
  source: string | null;
  models_dev_id: string | null;
  attachment: boolean;
  reasoning: boolean;
  reasoning_style: string | null;
  speed_mode: string | null;
  tool_call: boolean;
  status: string | null;
  created_at: string;
  updated_at: string;
  provider?: ModelProviderRef;
}

export interface CreateModelData {
  name: string;
  display_name: string;
  provider_id: string;
  type: ModelType;
  input_cost: number;
  output_cost: number;
  context_window: number;
  api_name?: string;
  cache_read_cost?: number;
  cache_write_cost?: number;
  max_output?: number;
  per_image_cost?: number;
  per_minute_cost?: number;
  supports_vision?: boolean;
  supports_audio_input?: boolean;
  supports_audio_output?: boolean;
  audio_formats?: string;
  image_sizes?: string;
  max_images_per_request?: number;
}

export type UpdateModelData = CreateModelData;

export interface ListModelsOptions {
  provider_id?: string;
  type?: ModelType;
  name?: string;
}

export type QuotaRuleType =
  | "DAILY_INPUT_TOKENS"
  | "DAILY_OUTPUT_TOKENS"
  | "DAILY_CACHE_INPUT_TOKENS"
  | "DAILY_CACHE_OUTPUT_TOKENS"
  | "DAILY_TOTAL_TOKENS"
  | "DAILY_CACHE_TOTAL_TOKENS"
  | "DAILY_REQUESTS"
  | "DAILY_IMAGES"
  | "DAILY_AUDIO_SECONDS"
  | "MONTHLY_INPUT_TOKENS"
  | "MONTHLY_OUTPUT_TOKENS"
  | "MONTHLY_TOTAL_TOKENS"
  | "MONTHLY_CACHE_INPUT_TOKENS"
  | "MONTHLY_CACHE_OUTPUT_TOKENS"
  | "MONTHLY_CACHE_TOTAL_TOKENS"
  | "MONTHLY_REQUESTS"
  | "MONTHLY_IMAGES"
  | "MONTHLY_AUDIO_SECONDS"
  | "TOTAL_INPUT_TOKENS"
  | "TOTAL_OUTPUT_TOKENS"
  | "TOTAL_TOKENS"
  | "TOTAL_CACHE_INPUT_TOKENS"
  | "TOTAL_CACHE_OUTPUT_TOKENS"
  | "TOTAL_CACHE_TOKENS"
  | "TOTAL_REQUESTS"
  | "TOTAL_IMAGES"
  | "TOTAL_AUDIO_SECONDS"
  | "DAILY_SPENDING"
  | "MONTHLY_SPENDING"
  | "TOTAL_SPENDING"
  | "DAILY_SEARCHES"
  | "DAILY_DEEP_SEARCHES";

export type SystemQuotaType =
  | "RATE_LIMIT_PER_MINUTE"
  | "MAX_PROVIDERS"
  | "MAX_QUOTA_RULES"
  | "MAX_MODELS";

export type QuotaPeriod = "ROLLING" | "CALENDAR";

export interface QuotaModelRef {
  id: string;
  name: string;
  display_name: string | null;
}

export interface QuotaKeyRef {
  id: string;
  name: string;
  key_preview: string;
}

export interface QuotaMemberRef {
  id: string;
  username: string | null;
}

export interface QuotaProviderRef {
  id: string;
  name: string;
}

export interface QuotaData {
  id: string;
  user_id: string;
  name: string;
  type: QuotaRuleType | SystemQuotaType;
  limit: number;
  period: QuotaPeriod;
  enabled: boolean;
  model_id: string | null;
  model: QuotaModelRef | null;
  key_id?: string | null;
  api_key?: QuotaKeyRef | null;
  member_id?: string | null;
  member?: QuotaMemberRef | null;
  provider_id?: string | null;
  provider?: QuotaProviderRef | null;
  current_usage: number;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateQuotaData {
  name: string;
  type: QuotaRuleType;
  limit: number;
  model_id?: string | null;
  key_id?: string | null;
  member_id?: string | null;
  provider_id?: string | null;
  period?: QuotaPeriod;
  enabled?: boolean;
}

export type PromptType = "SYSTEM" | "USER" | "ASSISTANT";

export type PromptEnvironment =
  | "PRODUCTION"
  | "STAGING"
  | "EVALUATION"
  | "EXPERIMENTS";

export interface PromptModelRef {
  id: string;
  name: string;
  display_name: string | null;
}

export interface PromptData {
  id: string;
  workspace_id: string;
  model_id: string | null;
  name: string;
  content: string;
  type: PromptType;
  is_global: boolean;
  enabled: boolean;
  position: number;
  environment: PromptEnvironment | null;
  created_at: string;
  updated_at: string;
  model?: PromptModelRef | null;
}

export interface CreatePromptData {
  name: string;
  content: string;
  type?: PromptType;
  model_id?: string | null;
  is_global?: boolean;
  enabled?: boolean;
  position?: number;
  environment?: PromptEnvironment | null;
}

export type UpdatePromptData = CreatePromptData;

export interface ListPromptsOptions {
  name?: string;
  type?: PromptType;
  environment?: PromptEnvironment;
}

export interface MappingData {
  id: string;
  workspace_id: string;
  source_name: string;
  target_model: string;
  priority: number;
  enabled: boolean;
  is_pattern: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMappingData {
  source_name: string;
  target_model: string;
  priority?: number;
  enabled?: boolean;
  is_pattern?: boolean;
}

export type UpdateMappingData = CreateMappingData;

export interface ListMappingsOptions {
  source_name?: string;
  target_model?: string;
}

export interface WorkflowData {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  is_default: boolean;
  workflow?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ListWorkflowsOptions {
  name?: string;
}

export interface WorkspaceOwner {
  id: string;
  username: string | null;
  email: string;
}

export interface WorkspaceData {
  id: string;
  name: string;
  budget: number;
  owner_id: string | null;
  owner?: WorkspaceOwner | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceStats {
  member_count: number;
  prompt_count: number;
  config_count: number;
  mapping_count: number;
  provider_count: number;
}

export interface WorkspaceWithStatsData extends WorkspaceData {
  my_role: "OWNER" | "ADMIN" | "MEMBER";
  stats: WorkspaceStats;
}

export interface CreateWorkspaceData {
  name: string;
}

export interface UpdateWorkspaceData {
  name?: string;
}

export interface WorkspaceBudget {
  budget: number;
  current_spend: number;
  remaining: number;
}

export interface UpdateBudgetResponse {
  success: boolean;
  budget: number;
}

export interface MemberUser {
  id: string;
  username: string | null;
  email: string;
}

export interface MemberData {
  id: string;
  workspace_id: string;
  user_id: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  created_at: string;
  user: MemberUser;
}

export interface InviteMemberData {
  restricted_to?: string[];
  max_uses?: number;
  expires_in_days?: number;
}

export interface Invitation {
  id: string;
  code: string;
  link: string;
  expires_at: string | null;
  max_uses: number;
}

export type IndexStatus = "PENDING" | "INDEXING" | "INDEXED" | "FAILED";

export interface IndexData {
  id: string;
  workspace_id: string;
  base_url: string;
  title: string | null;
  page_count: number;
  status: IndexStatus;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateIndexData {
  url: string;
  title?: string;
  max_pages?: number;
}

export interface CreateIndexResult {
  id: string;
  status: IndexStatus;
}

export interface MetricSummary {
  id: string;
  method: string;
  endpoint: string;
  status_code: number;
  blocked_reason?: string | Record<string, unknown> | null;
}

export interface MetricDetail {
  id: string;
  user_id: string;
  key_id: string | null;
  method: string;
  endpoint: string;
  path: string | null;
  status_code: number;
  response_time: number | null;
  blocked: boolean;
  blocked_reason: string | Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface ListMetricsOptions {
  page?: number;
  limit?: number;
  key_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface ListMetricsResponse {
  data: MetricSummary[];
  pagination: Pagination;
}

export interface HealthResponse {
  success: boolean;
  version: string;
  timestamp: number;
  error?: string;
}

export interface UserData {
  id: string;
  email: string;
  username: string | null;
  role: string;
  account_type: string;
  plan: string | null;
  email_verified: boolean;
  created_at: string;
}

export interface VersionInfo {
  major: string;
  header: string;
  latest: string;
  supported: string[];
}
