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

const leafletRuntimePluginPrelude = [
    'import { resolveLeafletRuntime } from "/electron-app/utils/maps/core/leafletRuntime.ts";',
    'const L = resolveLeafletRuntime((value) => Boolean(value && (typeof value === "object" || typeof value === "function")));',
    'if (!L) throw new Error("Leaflet runtime is required before loading legacy Leaflet plugins.");',
    "",
].join("\n");

const minimapGlobalRegistrationSnippet =
    'if(typeof window!=="undefined"&&window.L){window.L.Control.MiniMap=factory(L);window.L.control.minimap=function(layer,options){return new window.L.Control.MiniMap(layer,options)}}';

/** @type {ReadonlyMap<string, (code: string) => string>} */
const legacyLeafletPluginTransforms = new Map([
    [
        "/node_modules/leaflet-draw/dist/leaflet.draw.js",
        (code) => `${leafletRuntimePluginPrelude}${code}`,
    ],
    [
        "/node_modules/leaflet-minimap/dist/Control.MiniMap.min.js",
        (code) => {
            if (!code.includes(minimapGlobalRegistrationSnippet)) {
                throw new Error(
                    "Unable to rewrite leaflet-minimap global registration"
                );
            }

            return `${leafletRuntimePluginPrelude}${code.replace(
                minimapGlobalRegistrationSnippet,
                "if(true){L.Control.MiniMap=factory(L);L.control.minimap=function(layer,options){return new L.Control.MiniMap(layer,options)}}"
            )}`;
        },
    ],
    [
        "/node_modules/leaflet.markercluster/dist/leaflet.markercluster-src.js",
        (code) => `${leafletRuntimePluginPrelude}${code}`,
    ],
]);

/** @returns {import("vite").Plugin} */
function leafletPluginRuntimeTransform() {
    return {
        enforce: "pre",
        name: "fitfileviewer-legacy-leaflet-plugin-runtime",
        /**
         * @param {string} code
         * @param {string} id
         *
         * @returns {import("vite").TransformResult}
         */
        transform(code, id) {
            const normalizedId = id.replaceAll("\\", "/");
            const transformLegacyPlugin = [
                ...legacyLeafletPluginTransforms.entries(),
            ].find(([pluginPath]) => normalizedId.includes(pluginPath))?.[1];

            if (!transformLegacyPlugin) {
                return null;
            }

            return {
                code: transformLegacyPlugin(code),
                map: null,
            };
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
    plugins: [leafletPluginRuntimeTransform()],
    publicDir: false,
    root: repositoryRoot,
});
