import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  server: {
    proxy: {
      // Proxy para Catbox
      "/api/catbox": {
        target: "https://catbox.moe/user/api.php",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/catbox/, ""),
      },
      // Proxy para FreeImage
      "/api/freeimage": {
        target: "https://freeimage.host/api/1/upload",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/freeimage/, ""),
      },
    },
  },
});
