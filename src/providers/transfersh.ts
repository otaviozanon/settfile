import { createXHRUpload, createFileFormData } from "./base";
import { UploadError, ErrorCode } from "../types/errors";

/**
 * Transfer.sh - Easy file sharing from command line
 * Up to 10GB per file
 * Files stored for 14 days
 * API: https://transfer.sh
 */
export const uploadToTransfersh = async (
  file: File,
  signal?: AbortSignal,
  onProgress?: (percent: number) => void,
): Promise<string> => {
  const formData = createFileFormData(file, file.name);

  const result = await createXHRUpload({
    url: "https://transfer.sh",
    formData,
    signal,
    onProgress,
    timeout: 120000, // 2 minutes
    providerName: "transfer.sh",
  });

  // Transfer.sh returns plain text URL
  const url = result.responseText.trim();

  if (!url || !url.startsWith("https://")) {
    throw new UploadError(
      ErrorCode.INVALID_RESPONSE,
      "Invalid URL from server",
      "transfer.sh",
    );
  }

  return url;
};
