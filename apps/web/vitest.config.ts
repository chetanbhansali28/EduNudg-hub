import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/vitest.setup.ts"],
    include: [
      "src/**/*.test.{ts,tsx}",
      "../../packages/ui/src/**/*.test.{ts,tsx}",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@edunudg/ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@edunudg/tenant": path.resolve(__dirname, "../../packages/tenant/src/index.ts"),
      "@edunudg/permissions": path.resolve(__dirname, "../../packages/permissions/src/index.ts"),
      "@edunudg/database": path.resolve(__dirname, "../../packages/database/src/index.ts"),
      // packages/ui tests are included here; resolve TL from the web app install
      "@testing-library/react": path.resolve(__dirname, "./node_modules/@testing-library/react"),
    },
  },
});
