import { createXHRUpload, createFileFormData } from "./base";
import { UploadError, ErrorCode } from "../types/errors";

export interface GofileResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadToGofile = async (
  file: File,
  signal?: AbortSignal,
  onProgress?: (percent: number) => void,
): Promise<string> => {
  const formData = createFileFormData(file, "file");

  const result = await createXHRUpload<GofileResponse>({
    url: "/api/gofile",
    formData,
    signal,
    onProgress,
    timeout: 60000,
    providerName: "gofile.io",
  });

  const response = result.responseJSON;

  if (!response) {
    throw new UploadError(
      ErrorCode.INVALID_RESPONSE,
      "Empty response from server",
      "gofile.io",
    );
  }

  if (!response.success || !response.url) {
    throw new UploadError(
      ErrorCode.PROVIDER_ERROR,
      response.error || "Upload failed",
      "gofile.io",
    );
  }

  return response.url;
};
