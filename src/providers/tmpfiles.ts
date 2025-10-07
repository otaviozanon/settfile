export interface TmpfilesResponse {
  status: boolean;
  data: {
    url: string;
    [key: string]: any;
  };
  error?: string;
}

export const uploadToTmpfiles = async (
  file: File,
  signal?: AbortSignal,
  onProgress?: (percent: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const formData = new FormData();
      formData.append("file", file, file.name);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "https://tmpfiles.org/api/v1/upload");

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
            const result: TmpfilesResponse = JSON.parse(xhr.responseText);
            if (!result.status) {
              return reject(new Error(result.error || "Falha no upload"));
            }
            resolve(result.data.url);
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
      console.error("Erro no processo de upload Tmpfiles:", error);
      reject(error);
    }
  });
};
