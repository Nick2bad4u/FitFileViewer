import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const electronAppDir = fileURLToPath(new URL("..", import.meta.url));
const require = createRequire(import.meta.url);
const esbuild = require("esbuild");

await esbuild.build({
    bundle: true,
    entryPoints: [path.join(electronAppDir, "preload.ts")],
    external: ["electron"],
    format: "cjs",
    legalComments: "none",
    logLevel: "info",
    outfile: path.join(electronAppDir, "dist", "preload.js"),
    platform: "node",
    sourcemap: false,
    target: "node22",
});
