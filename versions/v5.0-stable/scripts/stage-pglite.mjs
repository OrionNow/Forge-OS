#!/usr/bin/env node
/**
 * Nitro bundles PGLite's JS but not the wasm/data files it loads beside itself.
 * `npm run preview` dies without them. Copy them next to the bundled module.
 */
import { copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export function stagePgliteAssets(root = ROOT) {
  const destDir = join(root, ".vercel/output/functions/__server.func/_libs");
  const bundled = join(destDir, "electric-sql__pglite.mjs");
  if (!existsSync(bundled)) {
    console.warn("[preview] no production bundle yet. Run npm run build first.");
    return false;
  }
  const srcDir = join(root, "node_modules/@electric-sql/pglite/dist");
  let copied = 0;
  for (const name of ["pglite.data", "pglite.wasm", "initdb.wasm"]) {
    const from = join(srcDir, name);
    const to = join(destDir, name);
    if (!existsSync(from)) {
      console.warn("[preview] missing " + from);
      continue;
    }
    if (existsSync(to)) continue;
    copyFileSync(from, to);
    copied += 1;
  }
  if (copied) console.log("[preview] staged " + copied + " PGLite file" + (copied === 1 ? "" : "s"));
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  stagePgliteAssets();
}
