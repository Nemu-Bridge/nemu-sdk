import { to_query, type ClientContext } from "./base.js";
import type {
  ApiResponse,
  MetricDetail,
  ListMetricsOptions,
  ListMetricsResponse,
} from "../types.js";

export class Metrics {
  constructor(private ctx: ClientContext) {}

  async list(options?: ListMetricsOptions): Promise<ListMetricsResponse> {
    return this.ctx.http.get<ListMetricsResponse>(
      "/metrics",
      to_query(options),
    );
  }

  async get(id: string): Promise<MetricDetail> {
    const res = await this.ctx.http.get<ApiResponse<MetricDetail>>(
      `/metrics/${id}`,
    );
    return res.data;
  }
}
