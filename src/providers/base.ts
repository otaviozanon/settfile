/**
 * Base provider utilities - shared XHR upload logic
 * All providers can use these utilities to avoid code duplication
 *
 * USAGE EXAMPLE:
 *
 * ```typescript
 * import { createXHRUpload, createFileFormData } from "./base";
 *
 * export const uploadToProvider = async (
 *   file: File,
 *   signal?: AbortSignal,
 *   onProgress?: (percent: number) => void
 * ): Promise<string> => {
 *   const formData = createFileFormData(file, "file", {
 *     apiKey: "your-key",
 *     option: "value"
 *   });
 *
 *   const result = await createXHRUpload<ProviderResponse>({
 *     url: "https://provider.com/upload",
 *     formData,
 *     signal,
 *     onProgress,
 *     providerName: "provider.com",
 *   });
 *
 *   return result.responseJSON.downloadUrl;
 * };
 * ```
 *
 * BENEFITS:
 * ✅ Consistent error handling (rate limit, timeout, network errors)
 * ✅ Less code duplication
 * ✅ Easy to add features to all providers
 * ✅ Type-safe responses
 */

import { UploadError, ErrorCode } from "../types/errors";

export interface XHRUploadOptions {
  url: string;
  formData: FormData;
  signal?: AbortSignal;
  onProgress?: (percent: number) => void;
  timeout?: number;
  providerName: string;
  headers?: Record<string, string>;
}

export interface XHRUploadResult<T = any> {
  status: number;
  responseText: string;
  responseJSON?: T;
  isJSON: boolean; // Flag to check if response is JSON
}

/**
 * Generic XHR upload with error handling
 * Providers can use this instead of duplicating XHR logic
 */
export function createXHRUpload<TResponse = any>(
  options: XHRUploadOptions,
): Promise<XHRUploadResult<TResponse>> {
  const {
    url,
    formData,
    signal,
    onProgress,
    timeout = 30000,
    providerName,
    headers = {},
  } = options;

  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);

      // Set timeout
      xhr.timeout = timeout;

      // Set custom headers
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      // Cancellation support
      if (signal) {
        signal.addEventListener("abort", () => xhr.abort());
      }

      // Progress tracking
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = (event.loaded / event.total) * 100;
          onProgress(percent);
        }
      };

      // Success/Error handling
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const responseJSON = xhr.responseText
              ? JSON.parse(xhr.responseText)
              : undefined;

            resolve({
              status: xhr.status,
              responseText: xhr.responseText,
              responseJSON,
              isJSON: true,
            });
          } catch {
            // Not JSON, return as text (e.g., plain URL from catbox)
            resolve({
              status: xhr.status,
              responseText: xhr.responseText,
              isJSON: false,
            });
          }
        } else if (xhr.status === 429) {
          reject(
            new UploadError(
              ErrorCode.RATE_LIMIT,
              "Rate limit exceeded. Try again later.",
              providerName,
            ),
          );
        } else {
          reject(
            new UploadError(
              ErrorCode.NETWORK_ERROR,
              `HTTP ${xhr.status}: ${xhr.statusText}`,
              providerName,
            ),
          );
        }
      };

      xhr.onerror = () => {
        reject(
          new UploadError(
            ErrorCode.NETWORK_ERROR,
            "Network error occurred",
            providerName,
          ),
        );
      };

      xhr.onabort = () => {
        reject(
          new UploadError(
            ErrorCode.UPLOAD_CANCELED,
            "Upload was canceled",
            providerName,
          ),
        );
      };

      xhr.ontimeout = () => {
        reject(
          new UploadError(
            ErrorCode.TIMEOUT_ERROR,
            `Upload timeout (${timeout / 1000}s)`,
            providerName,
          ),
        );
      };

      xhr.send(formData);
    } catch (error) {
      reject(
        new UploadError(
          ErrorCode.UNKNOWN_ERROR,
          "Unexpected error during upload",
          providerName,
          error,
        ),
      );
    }
  });
}

/**
 * Helper to create standard FormData for file upload
 */
export function createFileFormData(
  file: File,
  fieldName: string = "file",
  additionalFields?: Record<string, string>,
): FormData {
  const formData = new FormData();
  formData.append(fieldName, file, file.name);

  if (additionalFields) {
    Object.entries(additionalFields).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  return formData;
}
