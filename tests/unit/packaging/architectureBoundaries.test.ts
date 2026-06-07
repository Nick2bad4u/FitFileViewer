import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const sourceRoots = [
    "electron-app/main",
    "electron-app/main-ui.ts",
    "electron-app/preload",
    "electron-app/preload.ts",
    "electron-app/renderer",
    "electron-app/renderer.ts",
    "electron-app/shared",
    "electron-app/ui",
    "electron-app/utils",
    "electron-app/utils.ts",
] as const;

const rendererAdjacentRoots = [
    "electron-app/main-ui.ts",
    "electron-app/renderer",
    "electron-app/renderer.ts",
    "electron-app/ui",
] as const;

const preloadRoots = [
    "electron-app/preload",
    "electron-app/preload.ts",
] as const;

const sourceExtensions = new Set([
    ".cjs",
    ".js",
    ".mjs",
    ".ts",
]);

const allowedLegacyGlobalDataBridgeFiles = new Set([
    "electron-app/utils/state/core/globalDataStore.ts",
    "electron-app/utils/state/domain/appState.ts",
    "electron-app/utils/state/integration/stateIntegration.ts",
    "electron-app/utils/ui/mainUiGlobals.ts",
]);

const allowedLegacyUtilityFiles = new Set([
    "electron-app/utils/legacy/globalUtilityApp.ts",
    "electron-app/utils/legacy/globalUtilityData.ts",
    "electron-app/utils/legacy/globalUtilityFormatting.ts",
    "electron-app/utils/legacy/globalUtilityRegistry.ts",
    "electron-app/utils/legacy/globalUtilityRendering.ts",
    "electron-app/utils/legacy/globalUtilityTheming.ts",
    "electron-app/utils/legacy/globalUtilityUi.ts",
]);

const importSpecifierPattern =
    /\b(?:import\s+(?:[^'"]+\s+from\s+)?|export\s+[^'"]+\s+from\s+|require\()\s*["'](?<specifier>[^"']+)["']/gu;
const directGlobalDataWritePattern = /\b(?:window|globalThis)\.globalData\s*=/u;
const directRendererUtilsGlobalPattern =
    /\b(?:window|globalThis)\.rendererUtils\s*=/u;

function normalizeRepositoryPath(filePath: string): string {
    return filePath.replaceAll(path.sep, "/");
}

function collectSourceFiles(relativePath: string): string[] {
    const absolutePath = path.join(process.cwd(), relativePath);
    if (!existsSync(absolutePath)) {
        return [];
    }

    const stat = statSync(absolutePath);
    const normalizedRelativePath = normalizeRepositoryPath(relativePath);

    if (!stat.isDirectory()) {
        return sourceExtensions.has(path.extname(relativePath))
            ? [normalizedRelativePath]
            : [];
    }

    return readdirSync(absolutePath, { withFileTypes: true })
        .flatMap((entry) => {
            const entryPath = path.join(relativePath, entry.name);
            if (entry.isDirectory()) {
                return collectSourceFiles(entryPath);
            }
            return sourceExtensions.has(path.extname(entry.name))
                ? [normalizeRepositoryPath(entryPath)]
                : [];
        })
        .sort();
}

function readRepositoryFile(relativePath: string): string {
    return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function getImportSpecifiers(source: string): string[] {
    return [...source.matchAll(importSpecifierPattern)]
        .map((match) => match.groups?.specifier)
        .filter((specifier): specifier is string => Boolean(specifier));
}

function stripComments(source: string): string {
    return source
        .replaceAll(/\/\*[\S\s]*?\*\//gu, "")
        .replaceAll(/^\s*\/\/.*$/gmu, "");
}

function resolvesIntoMainProcessSource(
    importerPath: string,
    specifier: string
): boolean {
    if (specifier === "electron" || specifier.startsWith("node:")) {
        return true;
    }

    if (!specifier.startsWith(".")) {
        return false;
    }

    const importerDirectory = path.posix.dirname(importerPath);
    const resolvedPath = path.posix.normalize(
        path.posix.join(importerDirectory, specifier)
    );

    return (
        resolvedPath === "electron-app/main" ||
        resolvedPath.startsWith("electron-app/main/")
    );
}

function resolvesIntoRendererState(
    importerPath: string,
    specifier: string
): boolean {
    if (!specifier.startsWith(".")) {
        return false;
    }

    const importerDirectory = path.posix.dirname(importerPath);
    const resolvedPath = path.posix.normalize(
        path.posix.join(importerDirectory, specifier)
    );

    return (
        resolvedPath === "electron-app/renderer" ||
        resolvedPath.startsWith("electron-app/renderer/") ||
        resolvedPath === "electron-app/utils/state" ||
        resolvedPath.startsWith("electron-app/utils/state/")
    );
}

describe("architecture boundaries", () => {
    it("keeps the temporary compatibility ledger explicit", () => {
        expect.assertions(1);

        const ledger = readRepositoryFile("docs/DEPRECATION_LEDGER.md");

        expect(
            [
                "Renderer Global Data Bridge",
                "Legacy AppState Global",
                "Renderer Utility Globals",
                "Vendor Globals",
                "Runtime CommonJS Compatibility",
                "Exit criteria:",
            ].filter((requiredText) => !ledger.includes(requiredText))
        ).toStrictEqual([]);
    });

    it("keeps renderer-adjacent source out of main-process-only imports", () => {
        expect.assertions(1);

        const violations = rendererAdjacentRoots
            .flatMap(collectSourceFiles)
            .flatMap((relativeFile) =>
                getImportSpecifiers(readRepositoryFile(relativeFile))
                    .filter((specifier) =>
                        resolvesIntoMainProcessSource(relativeFile, specifier)
                    )
                    .map((specifier) => `${relativeFile}: ${specifier}`)
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps preload modules from reaching into renderer state internals", () => {
        expect.assertions(1);

        const violations = preloadRoots
            .flatMap(collectSourceFiles)
            .flatMap((relativeFile) =>
                getImportSpecifiers(readRepositoryFile(relativeFile))
                    .filter((specifier) =>
                        resolvesIntoRendererState(relativeFile, specifier)
                    )
                    .map((specifier) => `${relativeFile}: ${specifier}`)
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps legacy renderer globals behind named compatibility modules", () => {
        expect.assertions(3);

        const scannedFiles = sourceRoots.flatMap(collectSourceFiles);
        const directGlobalDataWrites = scannedFiles
            .filter(
                (relativeFile) =>
                    !allowedLegacyGlobalDataBridgeFiles.has(relativeFile) &&
                    directGlobalDataWritePattern.test(
                        stripComments(readRepositoryFile(relativeFile))
                    )
            )
            .sort();
        const directRendererUtilsGlobals = scannedFiles
            .filter((relativeFile) =>
                directRendererUtilsGlobalPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const unexpectedLegacyUtilityFiles = collectSourceFiles(
            "electron-app/utils/legacy"
        ).filter(
            (relativeFile) => !allowedLegacyUtilityFiles.has(relativeFile)
        );

        expect(directGlobalDataWrites).toStrictEqual([]);
        expect(directRendererUtilsGlobals).toStrictEqual([]);
        expect(unexpectedLegacyUtilityFiles).toStrictEqual([]);
    });
});
