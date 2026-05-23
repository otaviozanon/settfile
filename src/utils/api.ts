/**
 * API utilities with standardized error handling and rate limiting
 */

import { AppError, ErrorCode, normalizeError } from '../types/errors';
import { ApiResponse, ApiErrorResponse, RateLimitInfo } from '../types/api';

export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * Enhanced fetch with timeout, retries, and standardized error handling
 */
export async function apiFetch<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    timeout = 30000,
    retries = 0,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check for rate limiting
      if (response.status === 429) {
        const rateLimitInfo = extractRateLimitInfo(response);
        throw new AppError(
          ErrorCode.RATE_LIMIT,
          `Rate limit exceeded. Retry after ${rateLimitInfo.retry_after || 60}s`,
          rateLimitInfo,
          429
        );
      }

      // Handle error responses
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new AppError(
          ErrorCode.NETWORK_ERROR,
          errorBody.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          errorBody,
          response.status
        );
      }

      // Parse success response
      const data = await response.json();
      return data as T;
    } catch (error) {
      lastError = error as Error;

      // Don't retry on abort
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AppError(ErrorCode.TIMEOUT_ERROR, 'Request timeout', error);
      }

      // Retry logic
      if (attempt < retries) {
        await sleep(retryDelay * (attempt + 1));
        continue;
      }

      throw normalizeError(error);
    }
  }

  throw normalizeError(lastError);
}

/**
 * Extract rate limit information from response headers
 */
function extractRateLimitInfo(response: Response): RateLimitInfo {
  return {
    limit: parseInt(response.headers.get('X-RateLimit-Limit') || '0', 10),
    remaining: parseInt(response.headers.get('X-RateLimit-Remaining') || '0', 10),
    reset: parseInt(response.headers.get('X-RateLimit-Reset') || '0', 10),
    retry_after: parseInt(response.headers.get('Retry-After') || '60', 10),
  };
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Build query string from object
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Standardized API error handler
 */
export function handleApiError(error: unknown): never {
  const normalizedError = normalizeError(error);
  
  // Log error in development
  if (import.meta.env.DEV) {
    console.error('API Error:', normalizedError);
  }

  throw normalizedError;
}

/**
 * Create API response wrapper
 */
export function createApiResponse<T>(data: T): ApiResponse<T> {
  return { data };
}

/**
 * Create API error response
 */
export function createApiError(
  code: string,
  message: string,
  details?: unknown
): ApiErrorResponse {
  return {
    error: {
      code,
      message,
      details,
    },
  };
}
