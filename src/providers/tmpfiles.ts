import { createXHRUpload, createFileFormData } from "./base";
import { UploadError, ErrorCode } from "../types/errors";

export interface TmpfilesResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadToTmpfiles = async (
  file: File,
  signal?: AbortSignal,
  onProgress?: (percent: number) => void,
): Promise<string> => {
  const formData = createFileFormData(file, "file");

  const result = await createXHRUpload<TmpfilesResponse>({
    url: "/api/tmpfiles",
    formData,
    signal,
    onProgress,
    timeout: 30000,
    providerName: "tmpfiles.org",
  });

  const response = result.responseJSON;

  if (!response) {
    throw new UploadError(
      ErrorCode.INVALID_RESPONSE,
      "Empty response from server",
      "tmpfiles.org",
    );
  }

  if (!response.success || !response.url) {
    throw new UploadError(
      ErrorCode.PROVIDER_ERROR,
      response.error || "Upload failed",
      "tmpfiles.org",
    );
  }

  return response.url;
};
