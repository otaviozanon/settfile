import { createXHRUpload, createFileFormData } from "./base";
import { UploadError, ErrorCode } from "../types/errors";

export interface GofileResponse {
  status: string;
  data: {
    downloadPage: string;
    [key: string]: any;
  };
  message?: string;
}

export const uploadToGofile = async (
  file: File,
  signal?: AbortSignal,
  onProgress?: (percent: number) => void,
): Promise<string> => {
  const formData = createFileFormData(file, "file");

  const result = await createXHRUpload<GofileResponse>({
    url: "https://upload.gofile.io/uploadFile",
    formData,
    signal,
    onProgress,
    timeout: 60000, // 60s for large files
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

  if (response.status !== "ok") {
    throw new UploadError(
      ErrorCode.PROVIDER_ERROR,
      response.message || "Upload failed",
      "gofile.io",
    );
  }

  return response.data.downloadPage;
};
