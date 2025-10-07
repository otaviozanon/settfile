export interface FreeimageResponse {
  status_code: number;
  success?: {
    message: string;
    code: number;
  };
  image?: {
    url: string;
    url_viewer: string;
    [key: string]: any;
  };
  status_txt?: string;
}

const API_KEY = "6d207e02198a847aa98d0a2a901485a5";

export const uploadToFreeimage = async (
  file: File,
  signal?: AbortSignal,
  onProgress?: (percent: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const formData = new FormData();
      formData.append("key", API_KEY);
      formData.append("action", "upload");
      formData.append("source", file);
      formData.append("format", "json");

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/freeimage");

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
            const result: FreeimageResponse = JSON.parse(xhr.responseText);
            if (!result.image || !result.image.url) {
              return reject(new Error("Falha no upload ou URL inválida"));
            }
            resolve(result.image.url);
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
      console.error("Erro no processo de upload Freeimage:", error);
      reject(error);
    }
  });
};
