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

    const uploadRes = await fetch("/api/fileio", {
      method: "POST",
      body: formData,
      signal,
    });

    if (!uploadRes.ok) {
      throw new Error(`Erro ao realizar upload: ${uploadRes.statusText}`);
    }

    const result: FileioResponse = await uploadRes.json();

    if (!result.success || !result.url) {
      throw new Error(result.error || "Falha no upload file.io");
    }

    return result.url;
  } catch (error) {
    console.error("Erro no processo de upload file.io:", error);
    throw error;
  }
};
