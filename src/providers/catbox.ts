export interface CatboxResponse {
  status: string;
  data?: string;
  message?: string;
}

export const uploadToCatbox = async (
  file: File,
  signal?: AbortSignal,
  onProgress?: (percent: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const formData = new FormData();
      formData.append("reqtype", "fileupload");
      formData.append("userhash", "");
      formData.append("fileToUpload", file, file.name);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/catbox");

      if (signal) {
        signal.addEventListener("abort", () => xhr.abort());
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = (event.loaded / event.total) * 100;
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const url = xhr.responseText.trim();
          if (!url || !url.startsWith("https://")) {
            return reject(new Error("Upload failed or invalid URL"));
          }

          const result: CatboxResponse = {
            status: "ok",
            data: url,
          };
          resolve(result.data!);
        } else {
          reject(new Error(`Error performing upload: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error("Upload error"));
      xhr.onabort = () => reject(new Error("Upload canceled"));

      xhr.send(formData);
    } catch (error) {
      console.error("Error during Catbox upload process:", error);
      reject(error);
    }
  });
};
