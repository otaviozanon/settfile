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
  signal?: AbortSignal
): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("file", file, file.name);

    const uploadRes = await fetch("https://tmpfiles.org/api/v1/upload", {
      method: "POST",
      body: formData,
      signal,
    });

    if (!uploadRes.ok) {
      throw new Error(`Erro ao realizar upload: ${uploadRes.statusText}`);
    }

    const result: TmpfilesResponse = await uploadRes.json();

    if (!result.status) {
      throw new Error(result.error || "Falha no upload");
    }
    return result.data.url;
  } catch (error) {
    console.error("Erro no processo de upload:", error);
    throw error;
  }
};
