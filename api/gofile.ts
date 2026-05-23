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
          console.error("Gofile: formidable parse error:", err);
          reject(err);
        } else resolve([fields, files]);
      })
    );

    const file = Array.isArray((files as any).file)
      ? (files as any).file[0]
      : (files as any).file;

    if (!file) {
      console.error("Gofile: no file in request. Available fields:", Object.keys(files as any));
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false, error: "No file provided" }));
      return;
    }

    const buffer = await fs.promises.readFile(file.filepath);
    if (!buffer || buffer.length === 0) {
      console.error("Gofile: empty file buffer");
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false, error: "Empty file" }));
      return;
    }

    console.error(`Gofile: uploading "${file.originalFilename}" (${buffer.length} bytes)`);

    const uint8Array = new Uint8Array(buffer);
    const blob = new Blob([uint8Array]);
    const fileName = file.originalFilename || "upload.bin";

    const gofileForm = new FormData();
    gofileForm.append("file", blob, fileName);

    const response = await fetch("https://upload.gofile.io/uploadFile", {
      method: "POST",
      body: gofileForm,
    });

    const result = await response.json();

    if (!response.ok || result.status !== "ok" || !result.data?.downloadPage) {
      console.error(`Gofile: API returned ${response.status}:`, JSON.stringify(result));
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        success: false,
        error: "Gofile API error",
        detail: result.message || "Upload failed",
      }));
      return;
    }

    console.error(`Gofile: upload success → ${result.data.downloadPage}`);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: true, url: result.data.downloadPage }));
  } catch (err: any) {
    console.error("Gofile: unexpected error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
}
