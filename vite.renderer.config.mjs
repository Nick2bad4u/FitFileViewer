import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
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

const leafletDrawRuntimeModuleId = "fitfileviewer:leaflet-draw-runtime";
const resolvedLeafletDrawRuntimeModuleId = `\0${leafletDrawRuntimeModuleId}`;
const leafletDrawDistPath = fileURLToPath(import.meta.resolve("leaflet-draw"));

/** @returns {import("vite").Plugin} */
function leafletDrawRuntimeModule() {
    return {
        /** @param {string} id */
        async load(id) {
            if (id !== resolvedLeafletDrawRuntimeModuleId) {
                return null;
            }

            // eslint-disable-next-line security/detect-non-literal-fs-filename -- Resolved once from the installed leaflet-draw package entrypoint.
            const leafletDrawSource = await readFile(
                leafletDrawDistPath,
                "utf8"
            );

            return [
                'import Leaflet from "leaflet";',
                "const L = Leaflet;",
                leafletDrawSource,
                "export {};",
            ].join("\n");
        },
        name: "fitfileviewer-leaflet-draw-runtime-module",
        /**
         * @param {string} id
         *
         * @returns {string | null}
         */
        resolveId(id) {
            return id === leafletDrawRuntimeModuleId
                ? resolvedLeafletDrawRuntimeModuleId
                : null;
        },
    };
}

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
                    return Array.isArray(assetInfo.names) &&
                        assetInfo.names.includes(
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
    plugins: [leafletDrawRuntimeModule()],
    publicDir: false,
    root: repositoryRoot,
});
