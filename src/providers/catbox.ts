import { createXHRUpload, createFileFormData } from "./base";
import { UploadError, ErrorCode } from "../types/errors";

export interface CatboxResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadToCatbox = async (
  file: File,
  signal?: AbortSignal,
  onProgress?: (percent: number) => void,
): Promise<string> => {
  const formData = createFileFormData(file, "file", {
    reqtype: "fileupload",
    userhash: "",
  });

  const result = await createXHRUpload<CatboxResponse>({
    url: "/api/catbox",
    formData,
    signal,
    onProgress,
    timeout: 60000,
    providerName: "catbox.moe",
  });

  const response = result.responseJSON;

  if (!response) {
    throw new UploadError(
      ErrorCode.INVALID_RESPONSE,
      "Empty response from server",
      "catbox.moe",
    );
  }

  if (!response.success || !response.url) {
    throw new UploadError(
      ErrorCode.PROVIDER_ERROR,
      response.error || "Upload failed",
      "catbox.moe",
    );
  }

  return response.url;
};
