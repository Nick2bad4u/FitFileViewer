import { readFile } from "node:fs/promises";

import * as esbuild from "esbuild";

import {
    appPreloadBundleAbsolutePath,
    appPreloadSourceAbsolutePath,
} from "./lib/workspaces.mjs";

const preloadInjectedRequireBundlingPlugin = {
    name: "preload-injected-require-bundling",
    setup(build) {
        build.onLoad(
            { filter: /electron-app[\\/]+preload[\\/].*\.ts$/ },
            async (args) => {
                const source = await readFile(args.path, "utf8");
                const contents = source
                    .replace(/\brequireModule\s*\(/gu, "require(")
                    .replace(/(["'])\.\/preload\//gu, "$1./");

                return {
                    contents,
                    loader: "ts",
                };
            }
        );
    },
};

await esbuild.build({
    bundle: true,
    entryPoints: [appPreloadSourceAbsolutePath],
    external: ["electron"],
    format: "cjs",
    legalComments: "none",
    logLevel: "info",
    outfile: appPreloadBundleAbsolutePath,
    platform: "node",
    plugins: [preloadInjectedRequireBundlingPlugin],
    sourcemap: false,
    target: "node22",
});
