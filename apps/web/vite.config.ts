import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    define: {
      __API_BASE_URL__: JSON.stringify(env.API_BASE_URL ?? "http://localhost:3000"),
      __FALLBACK_API_BASE_URL__: JSON.stringify(env.FALLBACK_API_BASE_URL),
      __DEV_MODE__: JSON.stringify((env.DEV_MODE ?? "true") === "true")
    },
    server: {
      port: 5173
    }
  };
});
