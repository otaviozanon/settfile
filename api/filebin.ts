// api/filebin.ts
import { IncomingMessage, ServerResponse } from "http";
import formidable, { Files } from "formidable";
import fs from "fs";
import FormData from "form-data";
import fetch from "node-fetch";

// 🚫 O Vercel ignora isso fora do Next, mas não faz mal deixar:
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
    const form = formidable({ multiples: false });

    const [fields, files] = await new Promise<[any, Files]>(
      (resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve([fields, files]);
        });
      }
    );

    const file = (files as any).file?.[0] || (files as any).file;
    if (!file) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({ success: false, error: "Nenhum arquivo enviado" })
      );
      return;
    }

    const fileBuffer = await fs.promises.readFile(file.filepath);

    const formData = new FormData();
    formData.append("file", fileBuffer, file.originalFilename || "upload.bin");

    const response = await fetch("https://filebin.net/api/file", {
      method: "POST",
      body: formData as any,
      headers: formData.getHeaders(),
    });

    const text = await response.text();

    if (!response.ok) {
      console.error("Filebin error:", text);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({ success: false, error: "Upload falhou no Filebin" })
      );
      return;
    }

    const location = response.headers.get("location");
    if (!location) {
      console.error("Resposta sem location header:", text);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false, error: "Sem link retornado" }));
      return;
    }

    const fileUrl = `https://filebin.net${location.split("filebin.net")[1]}`;

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
