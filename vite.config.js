import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const devPort = Number(env.DEV_SERVER_PORT || 3000);
  const apiProxyTarget = env.DEV_API_PROXY_TARGET || "http://127.0.0.1:5234";

  return {
    plugins: [react()],
    server: {
      host: "127.0.0.1",
      port: devPort,
      strictPort: true,
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      host: "127.0.0.1",
      port: devPort,
      strictPort: true,
    },
    test: {
      environment: "jsdom",
      globals: false,
      setupFiles: "./src/test/setup.js",
      include: ["src/**/*.test.{js,jsx}"],
    },
  };
});
