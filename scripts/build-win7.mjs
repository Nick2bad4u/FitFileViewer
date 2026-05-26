import { Arch, build, Platform } from "electron-builder";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const electronAppDir = path.join(repoRoot, "electron-app");
const outputDir = path.join(electronAppDir, "release", "win7");
const WIN7_ELECTRON_VERSION = "22.3.27";
const appPackageFiles = [
    "assets/**",
    "dist/**",
    "elevProfile.css",
    "icons/**",
    "index.html",
    "package.json",
    "style.css",
];

function assertInsideElectronApp(targetPath) {
    const relativePath = path.relative(electronAppDir, path.resolve(targetPath));

    if (
        relativePath === "" ||
        relativePath.startsWith("..") ||
        path.isAbsolute(relativePath)
    ) {
        throw new Error(`Refusing to operate outside electron-app: ${targetPath}`);
    }
}

function runNpmScript(scriptName) {
    const npmExecPath = process.env.npm_execpath;

    if (npmExecPath) {
        execFileSync(process.execPath, [npmExecPath, "run", scriptName], {
            cwd: repoRoot,
            stdio: "inherit",
        });
        return;
    }

    execFileSync(
        process.platform === "win32" ? "npm.cmd" : "npm",
        ["run", scriptName],
        {
            cwd: repoRoot,
            stdio: "inherit",
        }
    );
}

async function run() {
    console.log("[win7-build] Starting Windows 7 compatibility build...");
    try {
        assertInsideElectronApp(outputDir);
        fs.rmSync(outputDir, { force: true, recursive: true });
        runNpmScript("build:runtime-ts");

        await build({
            targets: Platform.WINDOWS.createTarget(["portable"], Arch.ia32),
            config: {
                electronVersion: WIN7_ELECTRON_VERSION,
                npmRebuild: false,
                publish: null,
                asar: false,
                files: appPackageFiles,
                directories: {
                    output: outputDir,
                },

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
        console.log(
            `🟢 [win7-build] Build finished. Artifacts available in ${outputDir}`
        );
    } catch (error) {
        console.error("🔴 [win7-build] Build failed:", error);
        // eslint-disable-next-line n/no-process-exit -- build script
        process.exit(1);
    }
}

run();
