import { FormData, File } from "formdata-node";
import { FormDataEncoder } from "form-data-encoder";
import fetch from "node-fetch";
import { Readable } from "stream";

export const config = {
  api: {
    bodyParser: false, // desativa o body parser
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

    // Cria o form-data
    const formData = new FormData();
    formData.set("file", new File([buffer], "upload.bin"));

    // Encoder para envio via node-fetch
    const encoder = new FormDataEncoder(formData);

    // Converte para stream compatível
    const stream = Readable.from(encoder.encode());

    const response = await fetch("https://filebin.net", {
      method: "POST",
      body: stream,
      headers: encoder.headers as any, // node-fetch aceita HeadersInit
    });

    const text = await response.text();

    if (!response.ok) {
      console.error("Filebin error:", text);
      return res
        .status(500)
        .json({ success: false, error: "Upload falhou no Filebin" });
    }

    // Pega o URL retornado no cabeçalho location
    const location = response.headers.get("location");
    if (!location) {
      console.error("Resposta sem cabeçalho location:", text);
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
