import * as esbuild from "esbuild";

import {
    appPreloadBundleAbsolutePath,
    appPreloadSourceAbsolutePath,
} from "./lib/workspaces.mjs";

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
