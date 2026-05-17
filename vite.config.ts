import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const sameOrigin =
    env.VITE_MEDIHUB_SAME_ORIGIN === "true" || env.VITE_MEDIHUB_SAME_ORIGIN === "1";
  const apiOrigin = (env.VITE_MEDIHUB_SERVER ?? "").trim().replace(/\/+$/, "");
  const useProxy = sameOrigin && Boolean(apiOrigin);

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 3000,
      ...(useProxy
        ? {
            proxy: {
              "/api": {
                target: apiOrigin,
                changeOrigin: true,
                secure: true,
              },
              "/socket.io": {
                target: apiOrigin,
                changeOrigin: true,
                secure: apiOrigin.startsWith("https"),
                ws: true,
              },
            },
          }
        : {}),
    },
  };
});
