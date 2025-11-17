import { Arch, build, Platform } from "electron-builder";
import path from "node:path";
import { fileURLToPath } from "node:url";

// eslint-disable-next-line unicorn/prefer-import-meta-properties -- build script
const __filename = fileURLToPath(import.meta.url);
// eslint-disable-next-line unicorn/prefer-import-meta-properties -- build script
const __dirname = path.dirname(__filename);
const outputDir = path.resolve(__dirname, "..", "dist", "win7");
const WIN7_ELECTRON_VERSION = "22.3.27";

async function run() {
    console.log("[win7-build] Starting Windows 7 compatibility build...");
    try {
        await build({
            targets: Platform.WINDOWS.createTarget(["portable"], Arch.ia32),
            config: {
                electronVersion: WIN7_ELECTRON_VERSION,
                npmRebuild: false,
                publish: null,
                asar: false,
                directories: {
                    output: outputDir,
                },
                // eslint-disable-next-line no-template-curly-in-string -- electron-builder template
                artifactName: "Fit-File-Viewer-win7-${arch}-${version}.${ext}",
                extraMetadata: {
                    productName: "Fit File Viewer (Win7)",
                },
                win: {
                    target: ["portable"],
                    legalTrademarks: "Fit File Viewer",
                    requestedExecutionLevel: "asInvoker",
                },
            },
        });
        console.log(`🟢 [win7-build] Build finished. Artifacts available in ${outputDir}`);
    } catch (error) {
        console.error("🔴 [win7-build] Build failed:", error);
        // eslint-disable-next-line n/no-process-exit, unicorn/no-process-exit -- build script
        process.exit(1);
    }
}

run();
