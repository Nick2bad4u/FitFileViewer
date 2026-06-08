import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const repositoryRoot = process.cwd();
export const preloadDistPath = join(repositoryRoot, "dist", "preload.js");

let cachedPreloadCode: string | undefined;

export function readPreloadDistCode(): string {
    if (
        cachedPreloadCode !== undefined &&
        isBundledPreloadCode(cachedPreloadCode)
    ) {
        return cachedPreloadCode;
    }

    ensureBundledPreloadDist();
    cachedPreloadCode = readFileSync(preloadDistPath, "utf-8");
    if (!isBundledPreloadCode(cachedPreloadCode)) {
        throw new Error(
            `${preloadDistPath} exists but does not look like the bundled preload output.`
        );
    }
    return cachedPreloadCode;
}

function ensureBundledPreloadDist(): void {
    if (
        existsSync(preloadDistPath) &&
        isBundledPreloadCode(readFileSync(preloadDistPath, "utf-8"))
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

function isBundledPreloadCode(code: string): boolean {
    return (
        code.includes("var __commonJS =") &&
        !code.includes('require("./preload/')
    );
}
