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
  password = ""
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const formData = new FormData();
      formData.append("file", file, file.name);
      formData.append("lifetime", lifetime.toString());
      formData.append("read_count", read_count.toString());
      formData.append("password", password);

      const xhr = new XMLHttpRequest();
      // ✅ Usa o seu endpoint local para evitar CORS
      xhr.open("POST", "/api/safenote");

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
          try {
            const result: SafeNoteResponse = JSON.parse(xhr.responseText);
            if (!result.success || !result.url) {
              return reject(
                new Error(result.error || "SafeNote upload failed")
              );
            }
            resolve(result.url);
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
    } catch (err) {
      reject(err);
    }
  });
};
