import { createXHRUpload, createFileFormData } from "./base";
import { UploadError, ErrorCode } from "../types/errors";

/**
 * Litterbox - Temporary file hosting (same team as Catbox)
 * Up to 1GB per file
 * Configurable expiration: 1h, 12h, 24h, 72h
 * API: https://litterbox.catbox.moe
 */
export const uploadToLitterbox = async (
  file: File,
  signal?: AbortSignal,
  onProgress?: (percent: number) => void,
  expiration: "1h" | "12h" | "24h" | "72h" = "24h",
): Promise<string> => {
  const formData = createFileFormData(file, "fileToUpload", {
    reqtype: "fileupload",
    time: expiration,
  });

  const result = await createXHRUpload({
    url: "https://litterbox.catbox.moe/resources/internals/api.php",
    formData,
    signal,
    onProgress,
    timeout: 60000,
    providerName: "litterbox.catbox.moe",
  });

  // Litterbox returns plain text URL
  const url = result.responseText.trim();

  if (!url || !url.startsWith("https://")) {
    throw new UploadError(
      ErrorCode.INVALID_RESPONSE,
      "Invalid URL from server",
      "litterbox.catbox.moe",
    );
  }

  return url;
};
