export interface FreeimageResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadToFreeimage = async (
  file: File,
  signal?: AbortSignal,
  onProgress?: (percent: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const formData = new FormData();
      formData.append("file", file, file.name);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/freeimage");

      if (signal) signal.addEventListener("abort", () => xhr.abort());

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress((event.loaded / event.total) * 100);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result: FreeimageResponse = JSON.parse(xhr.responseText);
            if (!result.success || !result.url) {
              return reject(new Error(result.error || "Upload failed"));
            }
            resolve(result.url);
          } catch (err) {
            reject(err);
          }
        } else {
          reject(new Error(`Erro no upload: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error("Erro na requisição"));
      xhr.onabort = () => reject(new Error("Upload cancelado"));

      xhr.send(formData);
    } catch (err) {
      console.error("Erro no upload FreeImage:", err);
      reject(err);
    }
  });
};
