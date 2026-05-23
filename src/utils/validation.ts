import { ValidationError, ValidationErrorDetail, ErrorCode } from '../types/errors';

/**
 * File validation utilities
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024; // 10 GB
const MIN_FILE_SIZE = 1; // 1 byte

// Common MIME types for uploads
const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  
  // Text
  'text/plain',
  'text/csv',
  'application/json',
  
  // Video
  'video/mp4',
  'video/webm',
  'video/ogg',
  
  // Audio
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
]);

export interface FileValidationOptions {
  maxSize?: number;
  minSize?: number;
  allowedTypes?: string[] | Set<string>;
  allowedExtensions?: string[];
  strictTypeChecking?: boolean;
}

export interface FileValidationResult {
  valid: boolean;
  errors: ValidationErrorDetail[];
}

/**
 * Validate a file before upload
 */
export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): FileValidationResult {
  const {
    maxSize = MAX_FILE_SIZE,
    minSize = MIN_FILE_SIZE,
    allowedTypes,
    allowedExtensions,
    strictTypeChecking = false,
  } = options;

  const errors: ValidationErrorDetail[] = [];

  // Validate file size
  if (file.size > maxSize) {
    errors.push({
      field: 'file_size',
      message: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(maxSize)})`,
      code: 'file_too_large',
    });
  }

  if (file.size < minSize) {
    errors.push({
      field: 'file_size',
      message: `File size must be at least ${minSize} bytes`,
      code: 'file_too_small',
    });
  }

  // Validate MIME type
  if (allowedTypes) {
    const allowedSet = allowedTypes instanceof Set
      ? allowedTypes
      : new Set(allowedTypes);

    if (!allowedSet.has(file.type) && strictTypeChecking) {
      errors.push({
        field: 'file_type',
        message: `File type "${file.type}" is not allowed`,
        code: 'invalid_file_type',
      });
    }
  }

  // Validate file extension
  if (allowedExtensions) {
    const extension = getFileExtension(file.name);
    if (extension && !allowedExtensions.includes(extension)) {
      errors.push({
        field: 'file_name',
        message: `File extension ".${extension}" is not allowed`,
        code: 'invalid_extension',
      });
    }
  }

  // Validate filename
  if (!file.name || file.name.trim() === '') {
    errors.push({
      field: 'file_name',
      message: 'File name is required',
      code: 'missing_filename',
    });
  }

  // Check for suspicious filenames
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    errors.push({
      field: 'file_name',
      message: 'File name contains invalid characters',
      code: 'invalid_filename',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string | null {
  const parts = filename.split('.');
  if (parts.length < 2) return null;
  return parts.pop()!.toLowerCase();
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Check if file size is compatible with a provider
 */
export function isFileSizeCompatible(fileSizeBytes: number, maxSizeMB: number): boolean {
  const fileSizeMB = fileSizeBytes / (1024 * 1024);
  return fileSizeMB <= maxSizeMB;
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe chars
    .replace(/_{2,}/g, '_') // Remove duplicate underscores
    .substring(0, 255); // Limit length
}
