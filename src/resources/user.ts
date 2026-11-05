import { BaseEntity, type ClientContext } from "./base.js";
import type { ApiResponse, UserData } from "../types.js";

export interface User extends UserData {}

export class User extends BaseEntity<UserData> {}

export class UserResource {
  constructor(private ctx: ClientContext) {}

  async get(): Promise<User> {
    const res = await this.ctx.http.get<ApiResponse<UserData>>("/user");
    return new User(this.ctx, res.data);
  }

  me(): Promise<User> {
    return this.get();
  }
}
