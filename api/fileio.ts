import { IncomingMessage, ServerResponse } from "http";
import formidable, { Files } from "formidable";
import fs from "fs";

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

    // Converte Buffer para Uint8Array para TypeScript
    const uint8 = new Uint8Array(fileBuffer);

    const blob = new Blob([uint8], { type: "application/octet-stream" });

    const formData = new FormData();
    formData.append("file", blob, file.originalFilename || "upload.bin");

    const response = await fetch("https://file.io", {
      method: "POST",
      body: formData,
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
