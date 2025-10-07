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
    // Lê o FormData enviado pelo frontend
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: "Nenhum arquivo enviado" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Envia o arquivo para o Filebin
    const uploadRes = await fetch("https://filebin.net/", {
      method: "POST",
      body: formData,
    });

    if (!uploadRes.ok) {
      throw new Error(`Erro ao realizar upload: ${uploadRes.statusText}`);
    }

    // Filebin retorna o bin gerado no cabeçalho Location
    const location = uploadRes.headers.get("location");
    if (!location) {
      throw new Error("Falha ao obter link de upload do Filebin");
    }

    const fileUrl = `https://filebin.net${location}`;

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
