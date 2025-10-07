import { IncomingMessage, ServerResponse } from "http";
import formidable, { Files } from "formidable";
import fs from "fs";
import FormData from "form-data";

export const config = { api: { bodyParser: false } };

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, error: "Method not allowed" }));
    return;
  }

  try {
    // Parse multipart/form-data do browser
    const form = formidable({ multiples: false });
    const [fields, files] = await new Promise<[any, Files]>((resolve, reject) =>
      form.parse(req, (err, fields, files) =>
        err ? reject(err) : resolve([fields, files])
      )
    );

    const file = Array.isArray((files as any).file)
      ? (files as any).file[0]
      : (files as any).file;

    if (!file) throw new Error("Nenhum arquivo enviado");

    const fileBuffer = await fs.promises.readFile(file.filepath);

    // Cria form-data compatível com Node
    const formData = new FormData();
    formData.append("file", fileBuffer, {
      filename: file.originalFilename || "upload.bin",
      contentType: "application/octet-stream",
    });

    // Faz o POST direto para file.io
    const response = await fetch("https://file.io", {
      method: "POST",
      body: formData as any,
      headers: formData.getHeaders(),
    });

    const data = await response.json();

    if (!data.success || !data.link) throw new Error("Falha no upload file.io");

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: true, url: data.link }));
  } catch (err: any) {
    console.error("Erro no upload file.io:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
}
