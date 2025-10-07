export interface CatboxResponse {
  status: string; // "ok" ou "error"
  data?: string; // URL do arquivo enviado
  message?: string;
}

export const uploadToCatbox = async (
  file: File,
  signal?: AbortSignal
): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("reqtype", "fileupload"); // Necessário para Catbox
    formData.append("userhash", ""); // Usuário anônimo
    formData.append("fileToUpload", file, file.name);

    const uploadRes = await fetch("/api/catbox", {
      method: "POST",
      body: formData,
      signal,
    });

    if (!uploadRes.ok) {
      throw new Error(`Erro ao realizar upload: ${uploadRes.statusText}`);
    }

    const url = await uploadRes.text(); // Catbox retorna a URL em texto puro
    if (!url || !url.startsWith("https://")) {
      throw new Error("Falha no upload ou URL inválida");
    }

    const result: CatboxResponse = {
      status: "ok",
      data: url.trim(),
    };

    return result.data!;
  } catch (error) {
    console.error("Erro no processo de upload Catbox:", error);
    throw error;
  }
};
