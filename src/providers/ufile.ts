export interface UfileResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadToUfile = async (
  file: File,
  signal?: AbortSignal
): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("file", file, file.name);

    const resp = await fetch("/api/ufile", {
      method: "POST",
      body: formData,
      signal,
    });
    if (!resp.ok)
      throw new Error(`Erro ao realizar upload: ${resp.statusText}`);

    const data: UfileResponse = await resp.json();
    if (!data.success || !data.url)
      throw new Error(data.error || "Falha no upload Ufile");

    return data.url;
  } catch (err) {
    console.error("Erro no processo de upload Ufile:", err);
    throw err;
  }
};
