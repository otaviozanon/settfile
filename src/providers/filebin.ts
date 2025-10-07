export interface FilebinResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadToFilebin = async (
  file: File,
  signal?: AbortSignal
): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("file", file, file.name);

    const uploadRes = await fetch("/api/filebin", {
      method: "POST",
      body: formData,
      signal,
    });

    if (!uploadRes.ok) {
      throw new Error(`Erro ao realizar upload: ${uploadRes.statusText}`);
    }

    const result: FilebinResponse = await uploadRes.json();

    if (!result.success || !result.url) {
      throw new Error(result.error || "Falha no upload Filebin");
    }

    return result.url;
  } catch (error) {
    console.error("Erro no processo de upload Filebin:", error);
    throw error;
  }
};
