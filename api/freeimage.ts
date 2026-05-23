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
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error("FreeImage: formidable parse error:", err);
          reject(err);
        } else resolve([fields, files]);
      })
    );

    const file = Array.isArray((files as any).file)
      ? (files as any).file[0]
      : (files as any).file;

    if (!file) {
      console.error("FreeImage: no file in request. Available fields:", Object.keys(files as any));
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false, error: "Nenhum arquivo enviado" }));
      return;
    }

    const buffer = await fs.promises.readFile(file.filepath);
    if (!buffer || buffer.length === 0) {
      console.error("FreeImage: empty file buffer");
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false, error: "Arquivo vazio" }));
      return;
    }

    console.error(`FreeImage: uploading "${file.originalFilename}" (${buffer.length} bytes)`);

    const uint8Array = new Uint8Array(buffer);
    const blob = new Blob([uint8Array]);

    const freeimageForm = new FormData();
    freeimageForm.append("key", API_KEY);
    freeimageForm.append("action", "upload");
    freeimageForm.append("source", blob, file.originalFilename || "upload.bin");
    freeimageForm.append("format", "json");

    const response = await fetch("https://freeimage.host/api/1/upload", {
      method: "POST",
      body: freeimageForm,
    });

    const result = await response.json();

    if (!response.ok || !result.image?.url) {
      console.error(`FreeImage: API returned ${response.status}:`, JSON.stringify(result));
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        success: false,
        error: "FreeImage upload failed",
        detail: result.error?.message || `HTTP ${response.status}`,
      }));
      return;
    }

    console.error(`FreeImage: upload success → ${result.image.url}`);

    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, url: result.image.url }));
  } catch (err: any) {
    console.error("FreeImage: unexpected error:", err);
    res.statusCode = 500;
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
}
