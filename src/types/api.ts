export interface ErrorResponse {
  timestamp: string;
  code: number;
  error: string;
  message: string;
  path: string;
  method: string;
  details?: Record<string, string>;
}

export class ApiError extends Error {
  code: number;
  error: string;
  path: string;
  method: string;
  details?: Record<string, string>;
  rateLimitSeconds?: number;

  constructor(response: ErrorResponse) {
    super(response.message);
    this.name = "ApiError";
    this.code = response.code;
    this.error = response.error;
    this.path = response.path;
    this.method = response.method;
    this.details = response.details;
  }
}

export class NetworkError extends Error {
  constructor() {
    super("NetworkError");
    this.name = "NetworkError";
  }
}
