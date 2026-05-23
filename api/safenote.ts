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
    const form = formidable({ multiples: false });
    const [fields, files] = await new Promise<[any, Files]>(
      (resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) {
            console.error("SafeNote: formidable parse error:", err);
            reject(err);
          } else resolve([fields, files]);
        });
      }
    );

    const file = Array.isArray((files as any).file)
      ? (files as any).file[0]
      : (files as any).file;

    if (!file) {
      console.error("SafeNote: no file in request. Available fields:", Object.keys(files as any));
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false, error: "No file provided" }));
      return;
    }

    const fileBuffer = await fs.promises.readFile(file.filepath);
    if (!fileBuffer || fileBuffer.length === 0) {
      console.error("SafeNote: empty file buffer");
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false, error: "Empty file" }));
      return;
    }

    const lifetime = (fields as any).lifetime || 72;
    const read_count = (fields as any).read_count || 10;
    const password = (fields as any).password || "";

    console.error(`SafeNote: uploading "${file.originalFilename}" (${fileBuffer.length} bytes)`);

    const fileData = new Uint8Array(fileBuffer);
    const formData = new FormData();
    formData.append("file", new Blob([fileData]), file.originalFilename || "upload.bin");
    formData.append("lifetime", lifetime.toString());
    formData.append("read_count", read_count.toString());
    if (password) formData.append("password", password);

    const response = await fetch("https://safenote.co/api/file", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`SafeNote: API returned ${response.status}:`, text);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({ success: false, error: `Upload failed on SafeNote: HTTP ${response.status}` })
      );
      return;
    }

    const result = await response.json();
    const fileUrl = result?.link;

    if (!fileUrl) {
      console.error("SafeNote: no link in response:", JSON.stringify(result));
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          success: false,
          error: "SafeNote did not return a link",
        })
      );
      return;
    }

    console.error(`SafeNote: upload success → ${fileUrl}`);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: true, url: fileUrl }));
  } catch (err: any) {
    console.error("SafeNote: unexpected error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
}
