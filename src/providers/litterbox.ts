import { createXHRUpload, createFileFormData } from "./base";
import { UploadError, ErrorCode } from "../types/errors";

export interface LitterboxResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadToLitterbox = async (
  file: File,
  signal?: AbortSignal,
  onProgress?: (percent: number) => void,
  expiration: "1h" | "12h" | "24h" | "72h" = "24h",
): Promise<string> => {
  const formData = createFileFormData(file, "file", {
    reqtype: "fileupload",
    time: expiration,
  });

  const result = await createXHRUpload<LitterboxResponse>({
    url: "/api/litterbox",
    formData,
    signal,
    onProgress,
    timeout: 60000,
    providerName: "litterbox.catbox.moe",
  });

  const response = result.responseJSON;

  if (!response) {
    throw new UploadError(
      ErrorCode.INVALID_RESPONSE,
      "Empty response from server",
      "litterbox.catbox.moe",
    );
  }

  if (!response.success || !response.url) {
    throw new UploadError(
      ErrorCode.PROVIDER_ERROR,
      response.error || "Upload failed",
      "litterbox.catbox.moe",
    );
  }

  return response.url;
};
