import { createXHRUpload, createFileFormData } from "./base";
import { UploadError, ErrorCode } from "../types/errors";

export interface PixeldrainResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadToPixeldrain = async (
  file: File,
  signal?: AbortSignal,
  onProgress?: (percent: number) => void,
): Promise<string> => {
  const formData = createFileFormData(file, "file");

  const result = await createXHRUpload<PixeldrainResponse>({
    url: "/api/pixeldrain",
    formData,
    signal,
    onProgress,
    timeout: 120000,
    providerName: "pixeldrain.com",
  });

  const response = result.responseJSON;

  if (!response) {
    throw new UploadError(
      ErrorCode.INVALID_RESPONSE,
      "Empty response from server",
      "pixeldrain.com",
    );
  }

  if (!response.success || !response.url) {
    throw new UploadError(
      ErrorCode.PROVIDER_ERROR,
      response.error || "Upload failed",
      "pixeldrain.com",
    );
  }

  return response.url;
};
