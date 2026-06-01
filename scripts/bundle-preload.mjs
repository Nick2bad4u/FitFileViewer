import { createRequire } from "node:module";

import {
    appPreloadBundleAbsolutePath,
    appPreloadSourceAbsolutePath,
} from "./lib/workspaces.mjs";

const require = createRequire(import.meta.url);
const esbuild = require("esbuild");

await esbuild.build({
    bundle: true,
    entryPoints: [appPreloadSourceAbsolutePath],
    external: ["electron"],
    format: "cjs",
    legalComments: "none",
    logLevel: "info",
    outfile: appPreloadBundleAbsolutePath,
    platform: "node",
    sourcemap: false,
    target: "node22",
});
