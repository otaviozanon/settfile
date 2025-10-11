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
      res.end(JSON.stringify({ success: false, error: "No file provided" }));
      return;
    }

    const fileBuffer = await fs.promises.readFile(file.filepath);
    if (!fileBuffer || fileBuffer.length === 0) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false, error: "Empty file" }));
      return;
    }

    // Convert Buffer → Uint8Array (resolves Blob type errors in Node)
    const fileUint8 = new Uint8Array(fileBuffer);

    // SafeNote uses standard multipart/form-data upload
    const formData = new FormData();
    formData.append("file", new Blob([fileUint8]), file.originalFilename);
    formData.append("expire", "1d"); // expires in 1 day

    // Perform upload to SafeNote
    const response = await fetch("https://safenote.co/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("SafeNote error:", text);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({ success: false, error: "Upload failed on SafeNote" })
      );
      return;
    }

    const result = await response.json();
    const fileUrl = result?.data?.url || result?.url;

    if (!fileUrl) {
      res.statusCode = 500;
      res.end(
        JSON.stringify({
          success: false,
          error: "SafeNote did not return a URL",
        })
      );
      return;
    }

    // Success
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: true, url: fileUrl }));
  } catch (err: any) {
    console.error("SafeNote upload error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
}
