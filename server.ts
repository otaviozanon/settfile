import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = !process.argv.includes("--prod");
const PORT = parseInt(process.env.PORT || "3000", 10);

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

function serveStatic(res: http.ServerResponse, filePath: string) {
  try {
    const ext = path.extname(filePath);
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  } catch {
    return false;
  }
  return true;
}

async function handleApi(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = req.url || "";
  const route = url.split("?")[0];

  const routeMap: Record<string, string> = {
    "/api/catbox": "./api/catbox.ts",
    "/api/filebin": "./api/filebin.ts",
    "/api/freeimage": "./api/freeimage.ts",
    "/api/gofile": "./api/gofile.ts",
    "/api/litterbox": "./api/litterbox.ts",
    "/api/pixeldrain": "./api/pixeldrain.ts",
    "/api/safenote": "./api/safenote.ts",
    "/api/tmpfiles": "./api/tmpfiles.ts",
    "/api/ufile": "./api/ufile.ts",
  };

  const handlerPath = routeMap[route];
  if (!handlerPath) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: false, error: "API route not found" }));
    return;
  }

  try {
    const mod = await import(handlerPath);
    const handler = mod.default;
    await handler(req, res);
  } catch (err: any) {
    console.error(`[server] API ${route} error:`, err);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }
}

function serveSPA(dir: string, res: http.ServerResponse, reqUrl: string) {
  const ext = path.extname(reqUrl);
  if (ext && MIME[ext]) {
    if (serveStatic(res, path.join(dir, reqUrl))) return;
  }

  if (serveStatic(res, path.join(dir, reqUrl, "index.html"))) return;
  serveStatic(res, path.join(dir, "index.html"));
}

async function start() {
  if (isDev) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    http.createServer((req, res) => {
      const url = req.url || "";
      if (url.startsWith("/api/")) {
        handleApi(req, res);
      } else {
        vite.middlewares(req, res, () => {
          if (!res.headersSent) {
            res.writeHead(404);
            res.end("Not found");
          }
        });
      }
    }).listen(PORT, () => {
      console.log(`[server] dev mode → http://localhost:${PORT}`);
    });
  } else {
    const distDir = path.join(__dirname, "dist");

    if (!fs.existsSync(distDir)) {
      console.error("[server] dist/ not found. Run `npm run build` first.");
      process.exit(1);
    }

    http.createServer((req, res) => {
      const url = req.url || "";
      if (url.startsWith("/api/")) {
        handleApi(req, res);
      } else {
        serveSPA(distDir, res, url === "/" ? "index.html" : url);
      }
    }).listen(PORT, () => {
      console.log(`[server] production → http://localhost:${PORT}`);
    });
  }
}

start().catch((err) => {
  console.error("[server] failed to start:", err);
  process.exit(1);
});
