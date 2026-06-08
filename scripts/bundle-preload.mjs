import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";

import {
    appPreloadBundleAbsolutePath,
    appPreloadSourceAbsolutePath,
} from "./lib/workspaces.mjs";

const require = createRequire(import.meta.url);
const esbuild = require("esbuild");

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
