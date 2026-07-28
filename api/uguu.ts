import { IncomingMessage, ServerResponse } from "http";
import formidable, { Files } from "formidable";
import fs from "fs";

export const config = { api: { bodyParser: false } };

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
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
          console.error("Uguu: formidable parse error:", err);
          reject(err);
        } else resolve([fields, files]);
      }),
    );

    const file = Array.isArray((files as any).file)
      ? (files as any).file[0]
      : (files as any).file;

    if (!file) {
      console.error(
        "Uguu: no file in request. Available fields:",
        Object.keys(files as any),
      );
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false, error: "No file provided" }));
      return;
    }

    const buffer = await fs.promises.readFile(file.filepath);
    if (!buffer || buffer.length === 0) {
      console.error("Uguu: empty file buffer");
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false, error: "Empty file" }));
      return;
    }

    console.log(
      `Uguu: uploading "${file.originalFilename}" (${buffer.length} bytes)`,
    );

    const uint8Array = new Uint8Array(buffer);
    const blob = new Blob([uint8Array]);
    const fileName = file.originalFilename || "upload.bin";

    // Uguu uses "files[]" field name
    const formData = new FormData();
    formData.append("files[]", blob, fileName);

    const response = await fetch("https://uguu.se/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    // Uguu returns: { success: true, files: [{ url: "..." }] }
    if (!response.ok || !result.success || !result.files?.[0]?.url) {
      console.error(
        `Uguu: API returned ${response.status}:`,
        JSON.stringify(result),
      );
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          success: false,
          error: "Uguu API error",
          detail: result.description || "Upload failed",
        }),
      );
      return;
    }

    const fileUrl = result.files[0].url;
    console.log(`Uguu: upload success → ${fileUrl}`);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: true, url: fileUrl }));
  } catch (err: any) {
    console.error("Uguu: unexpected error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
}
