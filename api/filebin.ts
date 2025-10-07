export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: "Nenhum arquivo enviado" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const binName = Math.random().toString(36).substring(2, 10);
    const uploadRes = await fetch(
      `https://filebin.net/${binName}/${file.name}`,
      {
        method: "POST",
        body: file.stream(),
        headers: { "Content-Type": file.type || "application/octet-stream" },
      }
    );

    if (!uploadRes.ok) {
      throw new Error(`Erro ao enviar para Filebin: ${uploadRes.statusText}`);
    }

    const fileUrl = `https://filebin.net/${binName}/${file.name}`;

    return new Response(JSON.stringify({ success: true, url: fileUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Erro no processo de upload Filebin:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
