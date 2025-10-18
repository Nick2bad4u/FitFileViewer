/**
 * Electron Builder Configuration
 * @see https://www.electron.build/configuration/configuration
 */

const fs = require("node:fs");
const path = require("node:path");

let rendererBundleVerified = false;

/**
 * Ensures the renderer bundle exists before packaging.
 * Invokes Vite's production build when dist assets are missing.
 * @returns {Promise<void>}
 */
async function ensureRendererBundle() {
    if (rendererBundleVerified) {
        return;
    }

    const harnessMode = process.env.FFV_SMOKE_HARNESS === "1" || process.env.SKIP_VITE_BUNDLE === "1";

    const distIndexPath = path.join(__dirname, "dist", "index.html");
    if (harnessMode) {
        const harnessHtmlPath = path.join(__dirname, "smoke-test.html");
        if (!fs.existsSync(harnessHtmlPath)) {
            throw new Error(`Smoke harness HTML missing. Expected file: ${harnessHtmlPath}`);
        }

        rendererBundleVerified = true;
        console.info("[electron-builder] Skipping Vite build because smoke harness mode is active.");
        return;
    }

    if (!fs.existsSync(distIndexPath)) {
        console.info("[electron-builder] Renderer dist assets missing; running Vite production build...");
        const vite = await import("vite");
        await vite.build({
            configFile: path.join(__dirname, "vite.config.js"),
            mode: "production",
        });
    }

    if (!fs.existsSync(distIndexPath)) {
        throw new Error(`Renderer bundle missing after Vite build. Expected file: ${distIndexPath}`);
    }

    rendererBundleVerified = true;
}

module.exports = {
    appId: "com.example.fitfileviewer",
    productName: "Fit File Viewer",
    artifactName: `Fit-File-Viewer-\${platform}-\${arch}-\${version}.\${ext}`,
    beforePack: ensureRendererBundle,

    directories: {
        output: "release",
        buildResources: "build-resources",
    },

    files: [
        "dist/**/*",
        "main.js",
        "preload.js",
        "fitParser.js",
        "windowStateUtils.js",
        "smoke-test.html",
        "smoke-test-runner.js",
        "utils/**/*",
        "icons/**/*",
        "package.json",
        "!**/*.ts",
        "!**/*.map",
        "!tests/**/*",
        "!coverage/**/*",
        "!.cache/**/*",
    ],

    asar: true,
    asarUnpack: ["preload.js"],

    publish: [
        {
            provider: "github",
            owner: "Nick2bad4u",
            repo: "FitFileViewer",
        },
    ],

    win: {
        icon: "icons/favicon-256x256.ico",
        target: ["portable", "squirrel", "msi", "tar.xz", "tar.gz", "tar.bz2"],
        legalTrademarks: "Fit File Viewer",
        requestedExecutionLevel: "asInvoker",
    },

    nsis: {
        oneClick: false,
        allowElevation: true,
        allowToChangeInstallationDirectory: true,
        createDesktopShortcut: true,
        createStartMenuShortcut: true,
        runAfterFinish: true,
        artifactName: `Fit-File-Viewer-nsis-\${arch}-\${version}.\${ext}`,
    },

    mac: {
        icon: "icons/favicon-512x512.icns",
        target: ["dmg", "zip", "pkg", "tar.xz", "tar.gz", "tar.bz2"],
        category: "public.app-category.productivity",
        hardenedRuntime: true,
        gatekeeperAssess: true,
    },

    linux: {
        icon: "icons/favicon-256x256.png",
        target: ["AppImage", "deb", "rpm", "snap", "tar.xz", "tar.gz", "tar.bz2"],
        category: "Utility",
        synopsis: "A cross-platform viewer for .fit activity files.",
    },

    fileAssociations: [
        {
            ext: "fit",
            name: "Flexible and Interoperable Data Transfer File",
            description: ".fit activity file",
            role: "Viewer",
        },
    ],
};
