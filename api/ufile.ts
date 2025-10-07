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
      form.parse(req, (err, fields, files) =>
        err ? reject(err) : resolve([fields, files])
      )
    );

    const file = Array.isArray((files as any).file)
      ? (files as any).file[0]
      : (files as any).file;
    if (!file) throw new Error("Nenhum arquivo enviado");

    const buffer = await fs.promises.readFile(file.filepath);
    if (!buffer || buffer.length === 0) throw new Error("Arquivo vazio");

    const fileName = file.originalFilename || "upload.bin";
    const fileType = fileName.split(".").pop() || "bin";
    const fileData = new Uint8Array(buffer);

    // 1. Criar sessão
    const sessionResp = await fetch(
      "https://store-eu-hz-3.ufile.io/v1/upload/create_session",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `file_size=${fileData.byteLength}`,
      }
    );
    const sessionJson = await sessionResp.json();
    const fuid = sessionJson.fuid;
    if (!fuid) throw new Error("Falha ao criar sessão Ufile");

    // 2. Upload do chunk (somos 1 chunk)
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
    if (!chunkText.includes("Uploaded successfully"))
      throw new Error("Falha no upload do chunk");

    // 3. Finalizar upload
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
    if (!finalJson.url) throw new Error("Falha ao finalizar upload");

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: true, url: finalJson.url }));
  } catch (err: any) {
    console.error("Erro no upload Ufile:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
}
