export interface GofileResponse {
  status: string; // "ok" ou "error"
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
            const result: GofileResponse = JSON.parse(xhr.responseText);
            if (result.status !== "ok") {
              return reject(new Error(result.message || "Falha no upload"));
            }
            resolve(result.data.downloadPage);
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
      console.error("Erro no processo de upload Gofile:", error);
      reject(error);
    }
  });
};
