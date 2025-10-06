import { resolve } from "node:path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
    root: "./",
    base: "./",

    // Build configuration
    build: {
        outDir: "dist",
        emptyOutDir: true,
        sourcemap: true,
        minify: process.env.NODE_ENV === "production",
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
            },
            output: {
                format: "es",
                entryFileNames: "[name].js",
                chunkFileNames: "chunks/[name]-[hash].js",
                assetFileNames: "assets/[name]-[hash][extname]",
            },
        },
    },

    // Dev server configuration
    server: {
        host: 'localhost',
        port: 5273,
        strictPort: true,
        hmr: {
            protocol: "ws",
            host: "localhost",
            port: 5273,
            overlay: true,
        },
        // Watch options for better file change detection
        watch: {
            usePolling: false,
            interval: 100,
            // Ignore build directories
            ignored: ["**/ffv/**", "**/dist/**", "**/node_modules/**", "**/coverage/**"],
        },
        // Cors for electron
        cors: true,
        // Serve static files
        fs: {
            strict: false,
            allow: [".."],
        },
    },

    // Resolve configuration
    resolve: {
        alias: {
            "@": resolve(__dirname, "./"),
            "@utils": resolve(__dirname, "./utils"),
            "@types": resolve(__dirname, "./types"),
        },
    },

    // Plugin configuration
    plugins: [],

    // Optimization
    optimizeDeps: {
        include: ["chart.js", "leaflet", "jquery", "date-fns", "arquero"],
        // Force exclude electron
        exclude: ["electron"],
    },

    // CSS configuration
    css: {
        devSourcemap: true,
    },

    // Public directory
    publicDir: "assets",

    // Clear screen on dev server start
    clearScreen: false,
});
