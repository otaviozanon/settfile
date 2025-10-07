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
  signal?: AbortSignal
): Promise<string> => {
  try {
    // Prepara o FormData
    const formData = new FormData();
    formData.append("file", file, file.name);

    // Faz o upload para o endpoint global
    const uploadRes = await fetch("https://upload.gofile.io/uploadFile", {
      method: "POST",
      body: formData,
      signal,
    });

    if (!uploadRes.ok) {
      throw new Error(`Erro ao realizar upload: ${uploadRes.statusText}`);
    }

    const result: GofileResponse = await uploadRes.json();

    if (result.status !== "ok") {
      throw new Error(result.message || "Falha no upload");
    }
    return result.data.downloadPage;
  } catch (error) {
    console.error("Erro no processo de upload:", error);
    throw error;
  }
};
