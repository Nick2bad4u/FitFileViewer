import * as esbuild from "esbuild";

import {
    appMainBundleAbsolutePath,
    appMainSourceAbsolutePath,
} from "./lib/workspaces.mjs";

await esbuild.build({
    bundle: true,
    entryPoints: [appMainSourceAbsolutePath],
    external: ["electron"],
    format: "cjs",
    legalComments: "none",
    logLevel: "info",
    outfile: appMainBundleAbsolutePath,
    packages: "external",
    platform: "node",
    sourcemap: false,
    target: "node22",
});
