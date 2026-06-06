import path from "path";
import { fileURLToPath } from "url";

const webRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(webRoot, "../..");

/** Babel plugins that stamp JSX with repo-relative source hints for DevTools inspect (dev only). */
export function locateSourceBabelPlugins(mode: string): unknown[] {
  if (mode !== "development") return [];
  return [
    [
      path.resolve(webRoot, "babel-plugin-jsx-source-hints.cjs"),
      {
        enabled: true,
        rootDir: repoRoot,
      },
    ],
  ];
}

export { repoRoot, webRoot };
