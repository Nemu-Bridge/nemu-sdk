import { BaseEntity, type ClientContext } from "./base.js";
import type { WorkflowData } from "../types.js";

export interface Workflow extends WorkflowData {}

export class Workflow extends BaseEntity<WorkflowData> {}

export const workflow_factory = (ctx: ClientContext, data: WorkflowData) =>
  new Workflow(ctx, data);
