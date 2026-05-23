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
    const form = formidable({ multiples: false });
    const [fields, files] = await new Promise<[any, Files]>(
      (resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) {
            console.error("Filebin: formidable parse error:", err);
            reject(err);
          } else resolve([fields, files]);
        });
      }
    );

    const file = Array.isArray((files as any).file)
      ? (files as any).file[0]
      : (files as any).file;

    if (!file) {
      console.error("Filebin: no file in request. Available fields:", Object.keys(files as any));
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({ success: false, error: "Nenhum arquivo enviado" })
      );
      return;
    }

    const fileBuffer = await fs.promises.readFile(file.filepath);

    if (!fileBuffer || fileBuffer.length === 0) {
      console.error("Filebin: empty file buffer. Filepath:", file.filepath);
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false, error: "Arquivo vazio" }));
      return;
    }

    console.error(`Filebin: uploading "${file.originalFilename}" (${fileBuffer.length} bytes)`);

    const binId = crypto.randomBytes(8).toString("hex");
    const fileName = encodeURIComponent(file.originalFilename || "upload.bin");
    const fileData = new Uint8Array(fileBuffer);

    const response = await fetch(
      `https://filebin.net/${binId}/${fileName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
        },
        body: fileData,
      }
    );

    if (response.status !== 201) {
      const text = await response.text();
      console.error(`Filebin: API returned ${response.status}:`, text);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({ success: false, error: `Upload falhou no Filebin: HTTP ${response.status}` })
      );
      return;
    }

    const fileUrl = `https://filebin.net/${binId}/${fileName}`;

    console.error(`Filebin: upload success → ${fileUrl}`);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: true, url: fileUrl }));
  } catch (err: any) {
    console.error("Filebin: unexpected error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
}
