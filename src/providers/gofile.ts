export interface GofileResponse {
  status: string; // "ok" or "error"
  data: {
    downloadPage: string;
    [key: string]: any;
  };
  message?: string;
}

export const uploadToGofile = async (
  file: File,
  signal?: AbortSignal,
  onProgress?: (percent: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const formData = new FormData();
      formData.append("file", file, file.name);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "https://upload.gofile.io/uploadFile");

      // Support for cancellation
      if (signal) {
        signal.addEventListener("abort", () => xhr.abort());
      }

      // Update progress bar
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = (event.loaded / event.total) * 100;
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result: GofileResponse = JSON.parse(xhr.responseText);
            if (result.status !== "ok") {
              return reject(new Error(result.message || "Upload failed"));
            }
            resolve(result.data.downloadPage);
          } catch (err) {
            reject(err);
          }
        } else {
          reject(new Error(`Error performing upload: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error("Upload error"));
      xhr.onabort = () => reject(new Error("Upload canceled"));

      xhr.send(formData);
    } catch (error) {
      console.error("Error during Gofile upload process:", error);
      reject(error);
    }
  });
};
