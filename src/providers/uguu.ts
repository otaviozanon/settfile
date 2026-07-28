import { createXHRUpload, createFileFormData } from "./base";
import { UploadError, ErrorCode } from "../types/errors";

export interface UguuResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadToUguu = async (
  file: File,
  signal?: AbortSignal,
  onProgress?: (percent: number) => void,
): Promise<string> => {
  const formData = createFileFormData(file, "files[]"); // Uguu uses "files[]"

  const result = await createXHRUpload<UguuResponse>({
    url: "/api/uguu",
    formData,
    signal,
    onProgress,
    timeout: 60000,
    providerName: "uguu.se",
  });

  const response = result.responseJSON;

  if (!response) {
    throw new UploadError(
      ErrorCode.INVALID_RESPONSE,
      "Empty response from server",
      "uguu.se",
    );
  }

  if (!response.success || !response.url) {
    throw new UploadError(
      ErrorCode.PROVIDER_ERROR,
      response.error || "Upload failed",
      "uguu.se",
    );
  }

  return response.url;
};
