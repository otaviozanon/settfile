export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Converte o corpo inteiro em ArrayBuffer (o arquivo enviado)
    const body = await req.arrayBuffer();

    // Pega o nome do arquivo a partir do header (se o fetch enviou com filename)
    const contentDisposition = req.headers.get("content-disposition");
    const fileNameMatch = contentDisposition?.match(/filename="(.+?)"/);
    const fileName = fileNameMatch?.[1] || "upload.bin";

    const binName = Math.random().toString(36).substring(2, 10);

    const uploadRes = await fetch(
      `https://filebin.net/${binName}/${fileName}`,
      {
        method: "POST",
        body: body,
        headers: {
          "Content-Type":
            req.headers.get("content-type") || "application/octet-stream",
        },
      }
    );

    if (!uploadRes.ok) {
      throw new Error(`Erro ao enviar para Filebin: ${uploadRes.statusText}`);
    }

    const fileUrl = `https://filebin.net/${binName}/${fileName}`;

    return new Response(JSON.stringify({ success: true, url: fileUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Erro no processo de upload Filebin:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
