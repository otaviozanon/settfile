export interface Provider {
  id: string;
  name: string;
  maxMB: number;
  expire: string;
  upload?: (file: File, signal?: AbortSignal) => Promise<string>;
}

export const uploadToUfile = async (
  file: File,
  signal?: AbortSignal
): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("file", file, file.name);

    const response = await fetch("/api/ufile", {
      method: "POST",
      body: formData,
      signal,
    });

    const text = await response.text();
    let result: { success: boolean; url?: string; error?: string };

    try {
      result = JSON.parse(text);
    } catch {
      console.error("Resposta inválida da API /api/ufile:", text);
      throw new Error("Resposta inválida da API /api/ufile");
    }

    if (!result.success || !result.url) {
      throw new Error(result.error || "Falha no upload ufile");
    }

    return result.url;
  } catch (err) {
    console.error("Erro no upload ufile:", err);
    throw err;
  }
};

export const UFILE_PROVIDER: Provider = {
  id: "ufile",
  name: "Ufile.io",
  maxMB: 200, // exemplo
  expire: "Indefinite",
  upload: uploadToUfile,
};
