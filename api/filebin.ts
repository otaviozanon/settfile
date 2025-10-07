import fetch from "node-fetch";
import FormData from "form-data";

export const config = {
  api: {
    bodyParser: false, // Desativa o body parser para permitir upload binário
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    // Recebe o corpo cru (arquivo)
    const chunks: Uint8Array[] = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Monta o form-data
    const formData = new FormData();
    formData.append("file", buffer, "upload.bin");

    // Faz upload direto pro Filebin
    const response = await fetch("https://filebin.net", {
      method: "POST",
      body: formData as any,
    });

    const text = await response.text();

    if (!response.ok) {
      console.error("Filebin error:", text);
      return res
        .status(500)
        .json({ success: false, error: "Upload falhou no Filebin" });
    }

    // O Filebin retorna o URL no cabeçalho `location`
    const location = response.headers.get("location");
    if (!location) {
      console.error("Resposta sem cabeçalho location:", text);
      return res
        .status(500)
        .json({ success: false, error: "Sem link retornado" });
    }

    // Monta o link final
    const fileUrl = `https://filebin.net${location.split("filebin.net")[1]}`;

    return res.status(200).json({ success: true, url: fileUrl });
  } catch (err: any) {
    console.error("Erro no processo de upload Filebin:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
