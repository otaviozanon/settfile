import { IncomingMessage, ServerResponse } from "http";
import formidable, { Files } from "formidable";
import fs from "fs";

export const config = { api: { bodyParser: false } };

const API_KEY = "6d207e02198a847aa98d0a2a901485a5";

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  if (req.method !== "POST") {
    res.statusCode = 405;
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

    const buffer = await fs.promises.readFile(file.filepath);
    const uint8Array = new Uint8Array(buffer);
    const blob = new Blob([uint8Array]);

    const freeimageForm = new FormData();
    freeimageForm.append("key", API_KEY);
    freeimageForm.append("action", "upload");
    freeimageForm.append("source", blob, file.originalFilename);
    freeimageForm.append("format", "json");

    const response = await fetch("https://freeimage.host/api/1/upload", {
      method: "POST",
      body: freeimageForm,
    });

    const result = await response.json();

    if (!result.image?.url) throw new Error("Upload falhou");

    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, url: result.image.url }));
  } catch (err: any) {
    console.error("Erro no upload FreeImage:", err);
    res.statusCode = 500;
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
}
