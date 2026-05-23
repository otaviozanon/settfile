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
          console.error("Ufile: formidable parse error:", err);
          reject(err);
        } else resolve([fields, files]);
      })
    );

    const file = Array.isArray((files as any).file)
      ? (files as any).file[0]
      : (files as any).file;
    if (!file) {
      console.error("Ufile: no file in request. Available fields:", Object.keys(files as any));
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false, error: "Nenhum arquivo enviado" }));
      return;
    }

    const buffer = await fs.promises.readFile(file.filepath);
    if (!buffer || buffer.length === 0) {
      console.error("Ufile: empty file buffer");
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false, error: "Arquivo vazio" }));
      return;
    }

    const fileName = file.originalFilename || "upload.bin";
    const fileType = fileName.split(".").pop() || "bin";
    const fileData = new Uint8Array(buffer);

    console.error(`Ufile: uploading "${fileName}" (${fileData.byteLength} bytes)`);

    // 1. Create session
    console.error("Ufile: creating session...");
    const sessionResp = await fetch(
      "https://store-eu-hz-3.ufile.io/v1/upload/create_session",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `file_size=${fileData.byteLength}`,
      }
    );
    const sessionJson = await sessionResp.json();
    if (!sessionResp.ok || !sessionJson.fuid) {
      console.error("Ufile: session creation failed:", sessionResp.status, JSON.stringify(sessionJson));
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        success: false,
        error: "Falha ao criar sessao Ufile",
        detail: sessionJson.error || `HTTP ${sessionResp.status}`,
      }));
      return;
    }
    const fuid = sessionJson.fuid;
    console.error(`Ufile: session created (fuid=${fuid})`);

    // 2. Upload chunk
    console.error("Ufile: uploading chunk...");
    const formData = new FormData();
    formData.append("chunk_index", "1");
    formData.append("fuid", fuid);
    formData.append("file", new Blob([fileData]), fileName);

    const chunkResp = await fetch(
      "https://store-eu-hz-3.ufile.io/v1/upload/chunk",
      {
        method: "POST",
        body: formData,
      }
    );

    const chunkText = await chunkResp.text();
    if (!chunkResp.ok || !chunkText.includes("Uploaded successfully")) {
      console.error(`Ufile: chunk upload failed (${chunkResp.status}):`, chunkText);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        success: false,
        error: "Falha no upload do chunk",
        detail: `HTTP ${chunkResp.status}`,
      }));
      return;
    }
    console.error("Ufile: chunk uploaded");

    // 3. Finalize
    console.error("Ufile: finalizing...");
    const finalResp = await fetch(
      "https://store-eu-hz-3.ufile.io/v1/upload/finalise",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          fuid,
          file_name: fileName,
          file_type: fileType,
          total_chunks: "1",
        }),
      }
    );

    const finalJson = await finalResp.json();
    if (!finalResp.ok || !finalJson.url) {
      console.error("Ufile: finalize failed:", finalResp.status, JSON.stringify(finalJson));
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({
        success: false,
        error: "Falha ao finalizar upload",
        detail: finalJson.error || `HTTP ${finalResp.status}`,
      }));
      return;
    }

    console.error(`Ufile: upload success → ${finalJson.url}`);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: true, url: finalJson.url }));
  } catch (err: any) {
    console.error("Ufile: unexpected error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
}
