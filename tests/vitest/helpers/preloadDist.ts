import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const repositoryRoot = process.cwd();
export const preloadDistPath = join(repositoryRoot, "dist", "preload.js");

let cachedPreloadCode: string | undefined;

export function readPreloadDistCode(): string {
    if (cachedPreloadCode !== undefined) {
        return cachedPreloadCode;
    }

    ensurePreloadDistExists();
    cachedPreloadCode = readFileSync(preloadDistPath, "utf-8");
    return cachedPreloadCode;
}

function ensurePreloadDistExists(): void {
    if (existsSync(preloadDistPath)) {
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
