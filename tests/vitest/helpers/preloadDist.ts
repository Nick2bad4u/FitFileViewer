import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const repositoryRoot = process.cwd();
export const preloadDistPath = join(repositoryRoot, "dist", "preload.js");
const preloadDistModuleDirectory = join(repositoryRoot, "dist", "preload");
const requiredDelegatedPreloadModules = [
    "preloadBootstrap.js",
    "preloadRuntime.js",
    "preloadRuntimeEnvironment.js",
    "preloadModuleLoader.js",
] as const;

let cachedPreloadCode: string | undefined;

export function readPreloadDistCode(): string {
    if (
        cachedPreloadCode !== undefined &&
        isValidPreloadDistCode(cachedPreloadCode)
    ) {
        return cachedPreloadCode;
    }

    ensurePreloadDist();
    cachedPreloadCode = readFileSync(preloadDistPath, "utf-8");
    if (!isValidPreloadDistCode(cachedPreloadCode)) {
        throw new Error(
            `${preloadDistPath} exists but does not look like valid preload output.`
        );
    }
    return cachedPreloadCode;
}

function ensurePreloadDist(): void {
    if (
        existsSync(preloadDistPath) &&
        isValidPreloadDistCode(readFileSync(preloadDistPath, "utf-8"))
    ) {
        return;
    }

    const result = spawnSync(process.execPath, ["scripts/build-runtime.mjs"], {
        cwd: repositoryRoot,
        encoding: "utf-8",
        stdio: "pipe",
    });

    if (result.error) {
        throw result.error;
    }

    if (result.status !== 0) {
        throw new Error(
            [
                `Failed to build runtime preload dist before reading ${preloadDistPath}.`,
                result.stdout,
                result.stderr,
            ]
                .filter(Boolean)
                .join("\n")
        );
    }

    if (!existsSync(preloadDistPath)) {
        throw new Error(
            `Runtime build completed but ${preloadDistPath} was not created.`
        );
    }
}

function hasDelegatedPreloadModules(): boolean {
    return requiredDelegatedPreloadModules.every((moduleFileName) =>
        existsSync(join(preloadDistModuleDirectory, moduleFileName))
    );
}

function isBundledPreloadCode(code: string): boolean {
    return (
        code.includes("// electron-app/preload.ts") &&
        code.includes("startDefaultPreloadEntrypoint();") &&
        code.includes("function startPreloadEntrypoint(") &&
        !code.includes('require("./preload/')
    );
}

function isDelegatedPreloadCode(code: string): boolean {
    return (
        code.includes("startPreloadEntrypoint();") &&
        code.includes('"./preload/preloadBootstrap.js"') &&
        hasDelegatedPreloadModules()
    );
}

function isValidPreloadDistCode(code: string): boolean {
    return isBundledPreloadCode(code) || isDelegatedPreloadCode(code);
}
