import { IncomingMessage, ServerResponse } from "http";
import formidable, { Files } from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

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
    // Parse multipart/form-data
    const form = formidable({ multiples: false });
    const [fields, files] = await new Promise<[any, Files]>(
      (resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve([fields, files]);
        });
      }
    );

    const file = Array.isArray((files as any).file)
      ? (files as any).file[0]
      : (files as any).file;

    if (!file) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({ success: false, error: "Nenhum arquivo enviado" })
      );
      return;
    }

    const fileBuffer = await fs.promises.readFile(file.filepath);
    if (!fileBuffer || fileBuffer.length === 0) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false, error: "Arquivo vazio" }));
      return;
    }

    // Converte buffer para Blob/Uint8Array (compatível com fetch Node 18+)
    const fileData = new Uint8Array(fileBuffer);
    const formData = new FormData();
    formData.append("file", new Blob([fileData]), file.originalFilename);

    // POST para file.io
    const response = await fetch("https://file.io/?expires=1w", {
      method: "POST",
      body: formData as any, // Node-fetch aceita FormData
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("file.io error:", text);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({ success: false, error: "Upload falhou no file.io" })
      );
      return;
    }

    const result = await response.json();

    if (!result.success || !result.link) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({ success: false, error: "file.io não retornou link" })
      );
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: true, url: result.link }));
  } catch (err: any) {
    console.error("Erro no upload file.io:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
}
