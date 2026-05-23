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
          console.error("Litterbox: formidable parse error:", err);
          reject(err);
        } else resolve([fields, files]);
      })
    );

    const file = Array.isArray((files as any).file)
      ? (files as any).file[0]
      : (files as any).file;

    if (!file) {
      console.error("Litterbox: no file in request. Available fields:", Object.keys(files as any));
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false, error: "No file provided" }));
      return;
    }

    const buffer = await fs.promises.readFile(file.filepath);
    if (!buffer || buffer.length === 0) {
      console.error("Litterbox: empty file buffer");
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false, error: "Empty file" }));
      return;
    }

    const time = (fields as any).time || "24h";

    console.error(`Litterbox: uploading "${file.originalFilename}" (${buffer.length} bytes, time=${time})`);

    const uint8Array = new Uint8Array(buffer);
    const blob = new Blob([uint8Array]);
    const fileName = file.originalFilename || "upload.bin";

    const litterForm = new FormData();
    litterForm.append("reqtype", "fileupload");
    litterForm.append("fileToUpload", blob, fileName);
    litterForm.append("time", time);

    const response = await fetch(
      "https://litterbox.catbox.moe/resources/internals/api.php",
      { method: "POST", body: litterForm }
    );

    const text = await response.text();
    const url = text.trim();

    if (!response.ok || !url.startsWith("https://")) {
      console.error(`Litterbox: API returned ${response.status}:`, text);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        success: false,
        error: "Litterbox API error",
        detail: url || `HTTP ${response.status}`,
      }));
      return;
    }

    console.error(`Litterbox: upload success → ${url}`);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: true, url }));
  } catch (err: any) {
    console.error("Litterbox: unexpected error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
}
