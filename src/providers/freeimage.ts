export interface FreeimageResponse {
  status_code: number;
  success?: {
    message: string;
    code: number;
  };
  image?: {
    url: string;
    url_viewer: string;
    [key: string]: any;
  };
  status_txt?: string;
}

const API_KEY = "6d207e02198a847aa98d0a2a901485a5";

export const uploadToFreeimage = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("key", API_KEY);
    formData.append("action", "upload");
    formData.append("source", file);
    formData.append("format", "json");

    const uploadRes = await fetch("/api/freeimage", {
      method: "POST",
      body: formData,
    });

    if (!uploadRes.ok) {
      throw new Error(`Erro ao realizar upload: ${uploadRes.statusText}`);
    }

    const result: FreeimageResponse = await uploadRes.json();

    if (!result.image || !result.image.url) {
      throw new Error("Falha no upload ou URL inválida");
    }

    return result.image.url;
  } catch (error) {
    console.error("Erro no processo de upload Freeimage:", error);
    throw error;
  }
};
