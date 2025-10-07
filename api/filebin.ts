import { IncomingMessage, ServerResponse } from "http";
import formidable, { Files } from "formidable";
import fs from "fs";
import crypto from "crypto";

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

    // Gera um bin aleatório
    const binId = crypto.randomBytes(8).toString("hex");

    // Converte Buffer para Uint8Array (compatível com fetch do Node 18+)
    const fileData = new Uint8Array(fileBuffer);

    // Faz o upload para o Filebin
    const response = await fetch(
      `https://filebin.net/${binId}/${encodeURIComponent(
        file.originalFilename
      )}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
        },
        body: fileData, // ✅ Uint8Array funciona como BodyInit
      }
    );

    if (response.status !== 201) {
      const text = await response.text();
      console.error("Filebin error:", text);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({ success: false, error: "Upload falhou no Filebin" })
      );
      return;
    }

    const fileUrl = `https://filebin.net/${binId}/${encodeURIComponent(
      file.originalFilename
    )}`;

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: true, url: fileUrl }));
  } catch (err: any) {
    console.error("Erro no processo de upload Filebin:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
}
