export interface FilebinResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadToFilebin = async (
  file: File,
  signal?: AbortSignal,
  onProgress?: (percent: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const formData = new FormData();
      formData.append("file", file, file.name);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/filebin");

      // Suporte ao cancelamento
      if (signal) {
        signal.addEventListener("abort", () => xhr.abort());
      }

      // Atualiza a barra de progresso
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = (event.loaded / event.total) * 100;
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result: FilebinResponse = JSON.parse(xhr.responseText);
            if (!result.success || !result.url) {
              return reject(
                new Error(result.error || "Falha no upload Filebin")
              );
            }
            resolve(result.url);
          } catch (err) {
            reject(err);
          }
        } else {
          reject(new Error(`Erro ao realizar upload: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error("Erro no upload"));
      xhr.onabort = () => reject(new Error("Upload cancelado"));

      xhr.send(formData);
    } catch (error) {
      console.error("Erro no processo de upload Filebin:", error);
      reject(error);
    }
  });
};
