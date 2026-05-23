/**
 * Standard API Response Format
 * Following REST API best practices
 */

/**
 * Success response envelope
 */
export interface ApiResponse<T> {
  data: T;
  meta?: {
    [key: string]: unknown;
  };
}

/**
 * Error response envelope
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  links?: {
    self?: string;
    next?: string;
    prev?: string;
    first?: string;
    last?: string;
  };
}

/**
 * Upload response
 */
export interface UploadResponse {
  id: string;
  url: string;
  filename: string;
  file_size: number;
  file_type: string | null;
  provider: string;
  expires_at: string | null;
  created_at: string;
}

/**
 * Provider status
 */
export interface ProviderStatus {
  id: string;
  name: string;
  available: boolean;
  max_file_size_mb: number;
  retention_period: string;
  last_checked: string | null;
  error_rate: number;
}

/**
 * Rate limit information
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
  retry_after?: number; // Seconds
}
