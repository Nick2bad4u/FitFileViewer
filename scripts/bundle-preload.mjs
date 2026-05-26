import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const appDir = path.join(repositoryRoot, "electron-app");
const require = createRequire(import.meta.url);
const esbuild = require("esbuild");

await esbuild.build({
    bundle: true,
    entryPoints: [path.join(appDir, "preload.ts")],
    external: ["electron"],
    format: "cjs",
    legalComments: "none",
    logLevel: "info",
    outfile: path.join(appDir, "dist", "preload.js"),
    platform: "node",
    sourcemap: false,
    target: "node22",
});
