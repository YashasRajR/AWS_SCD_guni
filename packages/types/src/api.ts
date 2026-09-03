export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorBody;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationMeta;
}

/** GET /health — liveness only: the process is up and serving requests.
 * Deliberately has no external dependencies (no DB check) so a load
 * balancer/orchestrator doesn't restart a healthy process just because
 * the database is briefly slow or unreachable — that's what /ready is
 * for. Always responds 200 while the process is alive. */
export interface HealthCheckResponse {
  status: 'ok';
  environment: string;
  timestamp: string;
}

/** GET /ready — readiness: whether this instance should receive traffic.
 * Checks its actual dependencies (currently just the database). Responds
 * 200 when ready, 503 when not — callers should gate on the HTTP status,
 * not just the body. */
export interface ReadinessCheckResponse {
  status: 'ready' | 'not_ready';
  database: 'connected' | 'disconnected';
  environment: string;
  timestamp: string;
}
