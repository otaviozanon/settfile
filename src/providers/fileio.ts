export interface FileioResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadToFileio = async (
  file: File,
  signal?: AbortSignal
): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("file", file, file.name);

    const response = await fetch("/api/fileio", {
      method: "POST",
      body: formData,
      signal,
    });

    if (!response.ok) {
      throw new Error(`Erro ao realizar upload: ${response.statusText}`);
    }

    let result: FileioResponse;
    try {
      result = await response.json();
    } catch (err) {
      const text = await response.text();
      console.error("Resposta inválida da API /api/fileio:", text);
      throw new Error("Resposta inválida da API /api/fileio");
    }

    if (!result.success || !result.url) {
      throw new Error(result.error || "Falha no upload file.io");
    }

    return result.url;
  } catch (err) {
    console.error("Erro no processo de upload file.io:", err);
    throw err;
  }
};
