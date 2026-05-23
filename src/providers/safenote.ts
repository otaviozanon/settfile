import { createXHRUpload, createFileFormData } from "./base";
import { UploadError, ErrorCode } from "../types/errors";

export interface SafeNoteResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadToSafeNote = async (
  file: File,
  signal?: AbortSignal,
  onProgress?: (percent: number) => void,
  lifetime = 72,
  read_count = 10,
  password = "",
): Promise<string> => {
  const formData = createFileFormData(file, "file", {
    lifetime: lifetime.toString(),
    read_count: read_count.toString(),
    password,
  });

  const result = await createXHRUpload<SafeNoteResponse>({
    url: "/api/safenote",
    formData,
    signal,
    onProgress,
    timeout: 60000,
    providerName: "safenote.co",
  });

  const response = result.responseJSON;

  if (!response) {
    throw new UploadError(
      ErrorCode.INVALID_RESPONSE,
      "Empty response from server",
      "safenote.co",
    );
  }

  if (!response.success || !response.url) {
    throw new UploadError(
      ErrorCode.PROVIDER_ERROR,
      response.error || "Upload failed",
      "safenote.co",
    );
  }

  return response.url;
};
