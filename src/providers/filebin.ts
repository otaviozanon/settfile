import { createXHRUpload, createFileFormData } from "./base";
import { UploadError, ErrorCode } from "../types/errors";

export interface FilebinResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadToFilebin = async (
  file: File,
  signal?: AbortSignal,
  onProgress?: (percent: number) => void,
): Promise<string> => {
  const formData = createFileFormData(file, "file");

  const result = await createXHRUpload<FilebinResponse>({
    url: "/api/filebin",
    formData,
    signal,
    onProgress,
    timeout: 60000,
    providerName: "filebin.net",
  });

  const response = result.responseJSON;

  if (!response) {
    throw new UploadError(
      ErrorCode.INVALID_RESPONSE,
      "Empty response from server",
      "filebin.net",
    );
  }

  if (!response.success || !response.url) {
    throw new UploadError(
      ErrorCode.PROVIDER_ERROR,
      response.error || "Upload failed",
      "filebin.net",
    );
  }

  return response.url;
};
