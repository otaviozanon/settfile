import { IncomingMessage, ServerResponse } from "http";
import formidable, { Files } from "formidable";
import fs from "fs";
import FormData from "form-data"; // pacote do Node

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

    const fileBuffer = await fs.promises.readFile(file.filepath);

    const formData = new FormData();
    formData.append("file", fileBuffer, { filename: file.originalFilename });

    const response = await fetch(
      "https://up.ufile.io/v1/upload/create_session",
      {
        method: "POST",
        body: formData as any, // FormData do Node precisa desse cast para fetch do Node
      }
    );

    const data = await response.json();

    // Aqui você processa o fuid e continua upload de chunks conforme a API do Ufile

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: true, data }));
  } catch (err: any) {
    console.error("Erro no upload Ufile:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
}
