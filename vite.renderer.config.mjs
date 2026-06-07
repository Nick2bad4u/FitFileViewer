import { defineConfig } from "vite";

import {
    appRendererVendorGlobalsChartDataEntryPath,
    appRendererVendorGlobalsCoreEntryPath,
    appRendererVendorGlobalsMapEntryPath,
    rendererVendorGlobalsBundleName,
    rendererVendorGlobalsChartDataBundleName,
    rendererVendorGlobalsCoreBundleName,
    rendererVendorGlobalsMapBundleName,
    rendererVendorGlobalsStyleFileName,
    repositoryRoot,
    rootRuntimeRendererRepositoryPath,
} from "./scripts/lib/workspaces.mjs";

const vendorEntryNames = new Set([
    rendererVendorGlobalsChartDataBundleName,
    rendererVendorGlobalsCoreBundleName,
    rendererVendorGlobalsMapBundleName,
]);

export default defineConfig({
    build: {
        cssCodeSplit: false,
        emptyOutDir: false,
        lib: {
            cssFileName: rendererVendorGlobalsBundleName,
            entry: {
                [rendererVendorGlobalsChartDataBundleName]:
                    appRendererVendorGlobalsChartDataEntryPath,
                [rendererVendorGlobalsCoreBundleName]:
                    appRendererVendorGlobalsCoreEntryPath,
                [rendererVendorGlobalsMapBundleName]:
                    appRendererVendorGlobalsMapEntryPath,
            },
            fileName: (_format, entryName) => `${entryName}.js`,
            formats: ["es"],
        },
        minify: false,
        outDir: rootRuntimeRendererRepositoryPath,
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
                entryFileNames(chunkInfo) {
                    return vendorEntryNames.has(chunkInfo.name)
                        ? "[name].js"
                        : "chunks/[name]-[hash].js";
                },
            },
        },
        sourcemap: false,
        target: "es2024",
    },
    publicDir: false,
    root: repositoryRoot,
});
