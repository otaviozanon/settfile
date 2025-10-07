import FormData from "form-data";
import fetch from "node-fetch";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    const chunks: Uint8Array[] = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const formData = new FormData();
    formData.append("file", buffer, { filename: "upload.bin" });

    const response = await fetch("https://filebin.net/api/file", {
      method: "POST",
      body: formData as any,
      headers: formData.getHeaders(),
    });

    const text = await response.text();

    if (!response.ok) {
      console.error("Filebin error:", text);
      return res
        .status(500)
        .json({ success: false, error: "Upload falhou no Filebin" });
    }

    // O Filebin retorna o URL no cabeçalho 'location'
    const location = response.headers.get("location");
    if (!location) {
      console.error("Resposta sem location header:", text);
      return res
        .status(500)
        .json({ success: false, error: "Sem link retornado" });
    }

    const fileUrl = `https://filebin.net${location.split("filebin.net")[1]}`;
    return res.status(200).json({ success: true, url: fileUrl });
  } catch (err: any) {
    console.error("Erro no processo de upload Filebin:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
