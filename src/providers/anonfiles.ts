import { createXHRUpload, createFileFormData } from "./base";
import { UploadError, ErrorCode } from "../types/errors";

export interface AnonfilesResponse {
  status: boolean;
  data?: {
    file: {
      url: {
        full: string;
        short: string;
      };
      metadata: {
        id: string;
        name: string;
        size: {
          bytes: number;
          readable: string;
        };
      };
    };
  };
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

/**
 * AnonFiles - Free anonymous file upload
 * Up to 20GB per file
 * Files stored indefinitely
 * API: https://anonfiles.com/docs/api
 */
export const uploadToAnonfiles = async (
  file: File,
  signal?: AbortSignal,
  onProgress?: (percent: number) => void,
): Promise<string> => {
  const formData = createFileFormData(file, "file");

  const result = await createXHRUpload<AnonfilesResponse>({
    url: "https://api.anonfiles.com/upload",
    formData,
    signal,
    onProgress,
    timeout: 180000, // 3 minutes for large files (up to 20GB)
    providerName: "anonfiles.com",
  });

  const response = result.responseJSON;

  if (!response) {
    throw new UploadError(
      ErrorCode.INVALID_RESPONSE,
      "Empty response from server",
      "anonfiles.com",
    );
  }

  if (!response.status || !response.data?.file?.url?.full) {
    throw new UploadError(
      ErrorCode.PROVIDER_ERROR,
      response.error?.message || "Upload failed",
      "anonfiles.com",
    );
  }

  return response.data.file.url.full;
};
