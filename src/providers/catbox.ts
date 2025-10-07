export interface CatboxResponse {
  status: string; // "ok" ou "error"
  data?: string; // URL do arquivo enviado
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
      formData.append("reqtype", "fileupload"); // Necessário para Catbox
      formData.append("userhash", ""); // Usuário anônimo
      formData.append("fileToUpload", file, file.name);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/catbox");

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
          const url = xhr.responseText.trim();
          if (!url || !url.startsWith("https://")) {
            return reject(new Error("Falha no upload ou URL inválida"));
          }

          const result: CatboxResponse = {
            status: "ok",
            data: url,
          };
          resolve(result.data!);
        } else {
          reject(new Error(`Erro ao realizar upload: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error("Erro no upload"));
      xhr.onabort = () => reject(new Error("Upload cancelado"));

      xhr.send(formData);
    } catch (error) {
      console.error("Erro no processo de upload Catbox:", error);
      reject(error);
    }
  });
};
