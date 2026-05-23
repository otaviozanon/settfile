import { createXHRUpload, createFileFormData } from "./base";
import { UploadError, ErrorCode } from "../types/errors";

export interface PixeldrainResponse {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Pixeldrain - Free file hosting up to 10GB
 * Files expire after 90 days of inactivity
 * API: https://pixeldrain.com/api
 */
export const uploadToPixeldrain = async (
  file: File,
  signal?: AbortSignal,
  onProgress?: (percent: number) => void,
): Promise<string> => {
  const formData = createFileFormData(file, "file");

  const result = await createXHRUpload<PixeldrainResponse>({
    url: "https://pixeldrain.com/api/file",
    formData,
    signal,
    onProgress,
    timeout: 120000, // 2 minutes for large files
    providerName: "pixeldrain.com",
  });

  // Pixeldrain returns JSON with id
  const response = result.responseJSON;

  if (!response) {
    throw new UploadError(
      ErrorCode.INVALID_RESPONSE,
      "Empty response from server",
      "pixeldrain.com",
    );
  }

  if (!response.success || !response.id) {
    throw new UploadError(
      ErrorCode.PROVIDER_ERROR,
      response.error || "Upload failed",
      "pixeldrain.com",
    );
  }

  return `https://pixeldrain.com/u/${response.id}`;
};
