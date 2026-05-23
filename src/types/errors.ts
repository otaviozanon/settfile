/**
 * Standard error codes for the application
 */
export enum ErrorCode {
  // Upload errors
  UPLOAD_FAILED = 'upload_failed',
  UPLOAD_CANCELED = 'upload_canceled',
  NO_PROVIDERS = 'no_providers',
  ALL_PROVIDERS_FAILED = 'all_providers_failed',
  FILE_TOO_LARGE = 'file_too_large',
  INVALID_FILE_TYPE = 'invalid_file_type',
  
  // Network errors
  NETWORK_ERROR = 'network_error',
  TIMEOUT_ERROR = 'timeout_error',
  RATE_LIMIT = 'rate_limit_exceeded',
  
  // Provider errors
  PROVIDER_NOT_IMPLEMENTED = 'provider_not_implemented',
  PROVIDER_ERROR = 'provider_error',
  INVALID_RESPONSE = 'invalid_response',
  
  // Validation errors
  VALIDATION_ERROR = 'validation_error',
  
  // Unknown
  UNKNOWN_ERROR = 'unknown_error',
}

/**
 * Base application error with structured format
 */
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: unknown,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Convert to API error response format
   */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return [
      ErrorCode.NETWORK_ERROR,
      ErrorCode.TIMEOUT_ERROR,
      ErrorCode.PROVIDER_ERROR,
    ].includes(this.code);
  }
}

/**
 * Upload-specific error
 */
export class UploadError extends AppError {
  constructor(
    code: ErrorCode,
    message: string,
    public provider?: string,
    details?: unknown
  ) {
    super(code, message, details);
    this.name = 'UploadError';
    Object.setPrototypeOf(this, UploadError.prototype);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        provider: this.provider,
        details: this.details,
      },
    };
  }
}

/**
 * Network error with retry information
 */
export class NetworkError extends AppError {
  constructor(
    message: string,
    public retryAfter?: number,
    details?: unknown
  ) {
    super(ErrorCode.NETWORK_ERROR, message, details);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Validation error with field-level details
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public validationDetails: ValidationErrorDetail[]
  ) {
    super(ErrorCode.VALIDATION_ERROR, message, validationDetails, 422);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.validationDetails,
      },
    };
  }
}

/**
 * Helper to convert unknown errors to AppError
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.name === 'AbortError') {
      return new AppError(
        ErrorCode.UPLOAD_CANCELED,
        'Upload was canceled',
        error
      );
    }

    if (error.message.includes('network') || error.message.includes('fetch')) {
      return new NetworkError(error.message, undefined, error);
    }

    return new AppError(ErrorCode.UNKNOWN_ERROR, error.message, error);
  }

  return new AppError(
    ErrorCode.UNKNOWN_ERROR,
    'An unknown error occurred',
    error
  );
}
