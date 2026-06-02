import { Arch, build, Platform } from "electron-builder";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { repositoryRoot, rootWin7ReleaseDistPath } from "./lib/workspaces.mjs";
import { resolveCommandForPlatform } from "./lib/child-process.mjs";

const require = createRequire(import.meta.url);
const electronBuilderConfig = require("../electron-builder.config.cjs");
export const outputDir = rootWin7ReleaseDistPath;
export const win7ElectronVersion = "22.3.27";
export const rootPackageFiles = readElectronBuilderFiles();

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

export function assertInsideRepository(targetPath, root = repositoryRoot) {
    const relativePath = path.relative(root, path.resolve(targetPath));

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

export function runNpmScript(scriptName, options = {}) {
    const commandRunner = options.commandRunner ?? execFileSync;
    const executablePath = options.executablePath ?? process.execPath;
    const npmCliPath = resolveNpmCliPath(options);
    const root = path.resolve(options.repositoryRoot ?? repositoryRoot);

    if (npmCliPath) {
        commandRunner(
            executablePath,
            [
                npmCliPath,
                "run",
                scriptName,
            ],
            {
                cwd: root,
                stdio: "inherit",
            }
        );
        return;
    }

    commandRunner(
        resolveCommandForPlatform("npm", options.platform ?? process.platform),
        ["run", scriptName],
        {
            cwd: root,
            stdio: "inherit",
        }
    );
}

export function resolveNpmCliPath(options = {}) {
    const environment = options.environment ?? process.env;
    const executablePath = options.executablePath ?? process.execPath;
    const fileSystem = options.fileSystem ?? fs;
    const npmExecPath = environment.npm_execpath;
    if (npmExecPath) {
        return npmExecPath;
    }

    const nodeBinDir = path.dirname(executablePath);
    const candidate = path.join(
        nodeBinDir,
        "node_modules",
        "npm",
        "bin",
        "npm-cli.js"
    );

    if (fileSystem.existsSync(candidate)) {
        return candidate;
    }
}

export function createWin7BuildConfig({
    files = rootPackageFiles,
    output = outputDir,
    projectDir = repositoryRoot,
} = {}) {
    return {
        projectDir,
        targets: Platform.WINDOWS.createTarget(["portable"], Arch.ia32),
        config: {
            electronVersion: win7ElectronVersion,
            npmRebuild: false,
            publish: null,
            asar: false,
            files,
            directories: {
                output,
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
    };
}

export async function runWin7Build(options = {}) {
    const builder = options.builder ?? build;
    const commandRunner = options.commandRunner ?? execFileSync;
    const errorLogger = options.errorLogger ?? console.error;
    const executablePath = options.executablePath ?? process.execPath;
    const fileSystem = options.fileSystem ?? fs;
    const logger = options.logger ?? console.log;
    const root = path.resolve(options.repositoryRoot ?? repositoryRoot);
    const targetOutputDir = options.outputDir ?? outputDir;

    logger("[win7-build] Starting Windows 7 compatibility build...");
    try {
        assertInsideRepository(targetOutputDir, root);
        fileSystem.rmSync(targetOutputDir, { force: true, recursive: true });
        runNpmScript("build:runtime-ts", {
            commandRunner,
            environment: options.environment,
            executablePath,
            fileSystem,
            platform: options.platform,
            repositoryRoot: root,
        });

        await builder(
            createWin7BuildConfig({
                files: options.files ?? rootPackageFiles,
                output: targetOutputDir,
                projectDir: root,
            })
        );
        logger(
            `🟢 [win7-build] Build finished. Artifacts available in ${targetOutputDir}`
        );
        return 0;
    } catch (error) {
        errorLogger("🔴 [win7-build] Build failed:", error);
        return 1;
    }
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    process.exitCode = await runWin7Build();
}
