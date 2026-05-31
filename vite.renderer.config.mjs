import { defineConfig } from "vite";

import {
    appDistRendererRepositoryPath,
    appRendererVendorGlobalsEntryPath,
    rendererVendorGlobalsBundleName,
    rendererVendorGlobalsScriptFileName,
    rendererVendorGlobalsStyleFileName,
    repositoryRoot,
} from "./scripts/lib/workspaces.mjs";

export default defineConfig({
    build: {
        emptyOutDir: false,
        lib: {
            cssFileName: rendererVendorGlobalsBundleName,
            entry: appRendererVendorGlobalsEntryPath,
            fileName: () => rendererVendorGlobalsScriptFileName,
            formats: ["es"],
        },
        minify: false,
        outDir: appDistRendererRepositoryPath,
        rollupOptions: {
            output: {
                assetFileNames(assetInfo) {
                    return assetInfo.names.includes(
                        rendererVendorGlobalsStyleFileName
                    )
                        ? "[name][extname]"
                        : "assets/[name][extname]";
                },
                chunkFileNames: "chunks/[name]-[hash].js",
                entryFileNames: rendererVendorGlobalsScriptFileName,
            },
        },
        sourcemap: false,
        target: "es2024",
    },
    publicDir: false,
    root: repositoryRoot,
});
