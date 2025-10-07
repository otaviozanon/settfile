import fetch from "node-fetch";
import FormData from "form-data";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    const chunks: Uint8Array[] = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const formData = new FormData();
    formData.append("file", buffer, {
      filename: "upload.bin",
      contentType: req.headers["content-type"] || "application/octet-stream",
    });

    const uploadResponse = await fetch("https://filebin.net", {
      method: "POST",
      body: formData as any,
    });

    const text = await uploadResponse.text();

    if (!uploadResponse.ok) {
      console.error("Filebin response:", text);
      return res.status(500).json({ success: false, error: "Upload failed" });
    }

    const url = uploadResponse.headers.get("location");
    return res.status(200).json({ success: true, url });
  } catch (error) {
    console.error("Erro no processo de upload Filebin:", error);
    return res
      .status(500)
      .json({ success: false, error: (error as Error).message });
  }
}
