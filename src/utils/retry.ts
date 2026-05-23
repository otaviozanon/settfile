/**
 * Retry utility with exponential backoff
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number; // milliseconds
  maxDelay?: number; // milliseconds
  backoffMultiplier?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry' | 'onRetry'>> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts,
    initialDelay,
    maxDelay,
    backoffMultiplier,
  } = { ...DEFAULT_OPTIONS, ...options };

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      const shouldRetry = options.shouldRetry?.(error, attempt) ?? true;
      
      // Don't retry if this was the last attempt or shouldn't retry
      if (attempt >= maxAttempts || !shouldRetry) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt - 1),
        maxDelay
      );

      // Call retry callback if provided
      options.onRetry?.(error, attempt, delay);

      // Wait before retrying
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable based on common patterns
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network errors are retryable
    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnreset') ||
      message.includes('econnrefused')
    ) {
      return true;
    }

    // Abort errors are NOT retryable (user canceled)
    if (error.name === 'AbortError') {
      return false;
    }
  }

  // Check for HTTP status codes (if available)
  if (typeof error === 'object' && error !== null) {
    const statusCode = (error as any).statusCode || (error as any).status;
    
    if (typeof statusCode === 'number') {
      // Retry on 5xx errors and 429 (rate limit)
      return statusCode >= 500 || statusCode === 429;
    }
  }

  return false;
}

/**
 * Retry wrapper specifically for uploads
 */
export async function retryUpload<T>(
  fn: () => Promise<T>,
  providerName: string,
  onLog?: (message: string) => void
): Promise<T> {
  return retry(fn, {
    maxAttempts: 3,
    initialDelay: 2000,
    maxDelay: 10000,
    shouldRetry: isRetryableError,
    onRetry: (error, attempt, delay) => {
      onLog?.(
        `Retry ${attempt}/3 for ${providerName} after ${delay}ms (${(error as Error).message})`
      );
    },
  });
}
