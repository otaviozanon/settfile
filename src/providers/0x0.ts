export interface ZeroXZeroResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadToZeroXZero = async (
  file: File,
  signal?: AbortSignal
): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("file", file, file.name);

    const uploadRes = await fetch("/api/zeroxzero", {
      method: "POST",
      body: formData,
      signal,
    });

    if (!uploadRes.ok) {
      throw new Error(`Erro ao realizar upload: ${uploadRes.statusText}`);
    }

    const result: ZeroXZeroResponse = await uploadRes.json();

    if (!result.success || !result.url) {
      throw new Error(result.error || "Falha no upload 0x0.st");
    }

    return result.url;
  } catch (error) {
    console.error("Erro no processo de upload 0x0.st:", error);
    throw error;
  }
};
