import { Arch, build, Platform } from "electron-builder";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
    repositoryPath,
    repositoryRoot,
    rootReleaseDistPath,
} from "./lib/workspaces.mjs";
import { resolveCommandForPlatform } from "./lib/child-process.mjs";

const require = createRequire(import.meta.url);
const electronBuilderConfig = require("../electron-builder.config.cjs");
export const outputDir = repositoryPath(rootReleaseDistPath, "win7");
const WIN7_ELECTRON_VERSION = "22.3.27";
export const appPackageFiles = readElectronBuilderFiles();

export function readElectronBuilderFiles(config = electronBuilderConfig) {
    return parseElectronBuilderFiles(config.files);
}

export function parseElectronBuilderFiles(parsed) {
    if (
        !Array.isArray(parsed) ||
        parsed.some((entry) => typeof entry !== "string")
    ) {
        throw new TypeError(
            "electron-builder config files must be an array of file pattern strings"
        );
    }

    return parsed;
}

function assertInsideRepository(targetPath) {
    const relativePath = path.relative(
        repositoryRoot,
        path.resolve(targetPath)
    );

    if (
        relativePath === "" ||
        relativePath.startsWith("..") ||
        path.isAbsolute(relativePath)
    ) {
        throw new Error(
            `Refusing to operate outside repository: ${targetPath}`
        );
    }
}

function runNpmScript(scriptName) {
    const npmCliPath = resolveNpmCliPath();

    if (npmCliPath) {
        execFileSync(
            process.execPath,
            [
                npmCliPath,
                "run",
                scriptName,
            ],
            {
                cwd: repositoryRoot,
                stdio: "inherit",
            }
        );
        return;
    }

    execFileSync(resolveCommandForPlatform("npm"), ["run", scriptName], {
        cwd: repositoryRoot,
        stdio: "inherit",
    });
}

function resolveNpmCliPath() {
    const npmExecPath = process.env.npm_execpath;
    if (npmExecPath) {
        return npmExecPath;
    }

    const nodeBinDir = path.dirname(process.execPath);
    const candidate = path.join(
        nodeBinDir,
        "node_modules",
        "npm",
        "bin",
        "npm-cli.js"
    );

    if (fs.existsSync(candidate)) {
        return candidate;
    }
}

async function run() {
    console.log("[win7-build] Starting Windows 7 compatibility build...");
    try {
        assertInsideRepository(outputDir);
        fs.rmSync(outputDir, { force: true, recursive: true });
        runNpmScript("build:runtime-ts");

        await build({
            projectDir: repositoryRoot,
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

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    run();
}
