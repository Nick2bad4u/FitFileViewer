import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    repositoryRoot as defaultRepositoryRoot,
    rootRuntimeTsconfigAbsolutePath,
    rootRuntimeTsconfigPath,
} from "./lib/workspaces.mjs";

export const runtimeTsconfigPath = rootRuntimeTsconfigAbsolutePath;

export function readRuntimeTsconfig({
    fileSystem = fs,
    tsconfigPath = runtimeTsconfigPath,
} = {}) {
    return JSON.parse(fileSystem.readFileSync(tsconfigPath, "utf8"));
}

export function validateRuntimeTsconfigFiles({
    fileSystem = fs,
    repositoryRoot = defaultRepositoryRoot,
    tsconfig = readRuntimeTsconfig({ fileSystem }),
} = {}) {
    if (!tsconfig || typeof tsconfig !== "object") {
        return [
            {
                file: rootRuntimeTsconfigPath,
                reason: "tsconfig.runtime.json must contain an object",
            },
        ];
    }

    if (!Array.isArray(tsconfig.files)) {
        return [
            {
                file: rootRuntimeTsconfigPath,
                reason: "tsconfig.runtime.json must contain a files array",
            },
        ];
    }

    const seenFiles = new Set();
    const issues = [];

    for (const file of tsconfig.files) {
        if (typeof file !== "string") {
            issues.push({
                file: String(file),
                reason: "runtime file entries must be strings",
            });
            continue;
        }

        if (path.isAbsolute(file)) {
            issues.push({
                file,
                reason: "runtime file entries must be repository-relative",
            });
            continue;
        }

        if (!file.endsWith(".ts")) {
            issues.push({
                file,
                reason: "runtime file entries must be TypeScript source files",
            });
        }

        if (seenFiles.has(file)) {
            issues.push({
                file,
                reason: "runtime file entry is duplicated",
            });
        }
        seenFiles.add(file);

        if (!fileSystem.existsSync(path.join(repositoryRoot, file))) {
            issues.push({
                file,
                reason: "runtime file entry does not exist",
            });
        }
    }

    const preloadSourcePath = path.join(
        repositoryRoot,
        "electron-app",
        "preload"
    );
    if (fileSystem.existsSync(preloadSourcePath)) {
        const preloadSourceFiles = fileSystem
            .readdirSync(preloadSourcePath)
            .filter((file) => file.endsWith(".ts"))
            .map((file) => path.posix.join("electron-app", "preload", file));

        for (const preloadSourceFile of preloadSourceFiles) {
            if (!seenFiles.has(preloadSourceFile)) {
                issues.push({
                    file: preloadSourceFile,
                    reason: "preload runtime source file is missing from tsconfig.runtime.json",
                });
            }
        }
    }

    return issues;
}

export function formatRuntimeTsconfigIssues(issues) {
    return issues.map((issue) => `- ${issue.file}: ${issue.reason}`).join("\n");
}

export function runValidateRuntimeTsconfig({
    fileSystem = fs,
    logger = console,
    repositoryRoot = defaultRepositoryRoot,
    tsconfigPath = runtimeTsconfigPath,
} = {}) {
    const tsconfig = readRuntimeTsconfig({ fileSystem, tsconfigPath });
    const issues = validateRuntimeTsconfigFiles({
        fileSystem,
        repositoryRoot,
        tsconfig,
    });

    if (issues.length === 0) {
        logger.log("[validate-runtime-tsconfig] Runtime file list is valid.");
        return 0;
    }

    logger.error(
        `[validate-runtime-tsconfig] Found ${issues.length} runtime file list issue(s):\n${formatRuntimeTsconfigIssues(issues)}`
    );
    return 1;
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    process.exitCode = runValidateRuntimeTsconfig();
}
