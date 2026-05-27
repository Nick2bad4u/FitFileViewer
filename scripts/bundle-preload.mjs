import { createRequire } from "node:module";
import path from "node:path";

import { appWorkspacePath } from "./lib/workspaces.mjs";

const require = createRequire(import.meta.url);
const esbuild = require("esbuild");

await esbuild.build({
    bundle: true,
    entryPoints: [path.join(appWorkspacePath, "preload.ts")],
    external: ["electron"],
    format: "cjs",
    legalComments: "none",
    logLevel: "info",
    outfile: path.join(appWorkspacePath, "dist", "preload.js"),
    platform: "node",
    sourcemap: false,
    target: "node22",
});
