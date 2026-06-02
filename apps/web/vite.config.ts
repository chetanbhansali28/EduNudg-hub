import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@edunudg/ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@edunudg/tenant": path.resolve(__dirname, "../../packages/tenant/src/index.ts"),
      "@edunudg/permissions": path.resolve(__dirname, "../../packages/permissions/src/index.ts"),
      "@edunudg/database": path.resolve(__dirname, "../../packages/database/src/index.ts"),
    },
  },
  server: {
    port: 9000,
    strictPort: true,
    host: true,
  },
  preview: {
    port: 9000,
    strictPort: true,
    host: true,
  },
});
