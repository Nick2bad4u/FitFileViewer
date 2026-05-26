import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// Keep fileURLToPath until package engines allow import.meta.dirname.
// eslint-disable-next-line unicorn/prefer-import-meta-properties
const electronAppDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
    build: {
        emptyOutDir: false,
        lib: {
            cssFileName: "vendor-globals",
            entry: "renderer/vendorGlobals.ts",
            fileName: () => "vendor-globals.js",
            formats: ["es"],
        },
        minify: false,
        outDir: "dist/renderer",
        rollupOptions: {
            output: {
                assetFileNames(assetInfo) {
                    return assetInfo.names?.includes("vendor-globals.css")
                        ? "[name][extname]"
                        : "assets/[name][extname]";
                },
                chunkFileNames: "chunks/[name]-[hash].js",
                entryFileNames: "vendor-globals.js",
            },
        },
        sourcemap: false,
        target: "es2024",
    },
    publicDir: false,
    root: electronAppDir,
});
