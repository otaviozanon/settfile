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
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error("Tmpfiles: formidable parse error:", err);
          reject(err);
        } else resolve([fields, files]);
      })
    );

    const file = Array.isArray((files as any).file)
      ? (files as any).file[0]
      : (files as any).file;

    if (!file) {
      console.error("Tmpfiles: no file in request. Available fields:", Object.keys(files as any));
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false, error: "No file provided" }));
      return;
    }

    const buffer = await fs.promises.readFile(file.filepath);
    if (!buffer || buffer.length === 0) {
      console.error("Tmpfiles: empty file buffer");
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false, error: "Empty file" }));
      return;
    }

    console.error(`Tmpfiles: uploading "${file.originalFilename}" (${buffer.length} bytes)`);

    const uint8Array = new Uint8Array(buffer);
    const blob = new Blob([uint8Array]);
    const fileName = file.originalFilename || "upload.bin";

    const tmpForm = new FormData();
    tmpForm.append("file", blob, fileName);

    const response = await fetch("https://tmpfiles.org/api/v1/upload", {
      method: "POST",
      body: tmpForm,
    });

    const result = await response.json();

    if (!response.ok || !result.status) {
      console.error(`Tmpfiles: API returned ${response.status}:`, JSON.stringify(result));
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        success: false,
        error: "Tmpfiles API error",
        detail: result.error || "Upload failed",
      }));
      return;
    }

    console.error(`Tmpfiles: upload success → ${result.data.url}`);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: true, url: result.data.url }));
  } catch (err: any) {
    console.error("Tmpfiles: unexpected error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
}
