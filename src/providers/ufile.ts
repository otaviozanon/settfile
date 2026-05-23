import { createXHRUpload, createFileFormData } from "./base";
import { UploadError, ErrorCode } from "../types/errors";

export interface UfileResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadToUfile = async (
  file: File,
  signal?: AbortSignal,
  onProgress?: (percent: number) => void,
): Promise<string> => {
  const formData = createFileFormData(file, "file");

  const result = await createXHRUpload<UfileResponse>({
    url: "/api/ufile",
    formData,
    signal,
    onProgress,
    timeout: 120000, // 2 minutes for large files (up to 5GB)
    providerName: "ufile.io",
  });

  const response = result.responseJSON;

  if (!response) {
    throw new UploadError(
      ErrorCode.INVALID_RESPONSE,
      "Empty response from server",
      "ufile.io",
    );
  }

  if (!response.success || !response.url) {
    throw new UploadError(
      ErrorCode.PROVIDER_ERROR,
      response.error || "Upload failed",
      "ufile.io",
    );
  }

  return response.url;
};
