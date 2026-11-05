export class NemuError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "NemuError";
  }
}

export class NemuAuthError extends NemuError {
  constructor(message = "Authentication failed") {
    super(message, 401);
    this.name = "NemuAuthError";
  }
}

export class NemuPermissionError extends NemuError {
  constructor(message = "Insufficient permissions") {
    super(message, 403);
    this.name = "NemuPermissionError";
  }
}

export class NemuNotFoundError extends NemuError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404);
    this.name = "NemuNotFoundError";
  }
}

export class NemuRateLimitError extends NemuError {
  constructor(
    message = "Rate limit exceeded",
    public retry_after?: number,
  ) {
    super(message, 429);
    this.name = "NemuRateLimitError";
  }
}

export class NemuValidationError extends NemuError {
  constructor(
    message = "Invalid request",
    public details?: Record<string, string[]>,
  ) {
    super(message, 400);
    this.name = "NemuValidationError";
  }
}

export class NemuServerError extends NemuError {
  constructor(message = "Server error") {
    super(message, 500);
    this.name = "NemuServerError";
  }
}

export class NemuNetworkError extends NemuError {
  constructor(message = "Network error") {
    super(message);
    this.name = "NemuNetworkError";
  }
}
