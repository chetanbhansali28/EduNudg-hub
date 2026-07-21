import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";
import { locateSourceBabelPlugins } from "./viteLocateSource";

const appDist = path.resolve(__dirname, "dist");
const repoDist = path.resolve(__dirname, "../../dist");

/**
 * Vercel + Turbo builds from apps/web but may look for `dist` at the repo root.
 * Keep apps/web/dist and mirror to ../../dist when VERCEL=1 so either check passes.
 */
function mirrorDistToRepoRootOnVercel() {
  return {
    name: "mirror-dist-to-repo-root-on-vercel",
    closeBundle() {
      if (!process.env.VERCEL) return;
      if (!fs.existsSync(appDist)) return;
      fs.rmSync(repoDist, { recursive: true, force: true });
      fs.cpSync(appDist, repoDist, { recursive: true });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      babel: {
        plugins: locateSourceBabelPlugins(mode),
      },
    }),
    mirrorDistToRepoRootOnVercel(),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
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
}));
