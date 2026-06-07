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

const stateDomainRoots = ["electron-app/utils/state/domain"] as const;
const stateCoreRoots = ["electron-app/utils/state/core"] as const;
const rendererEntrypointFiles = ["electron-app/renderer.ts"] as const;

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
    "electron-app/utils/legacy/globalUtilityRegistry.ts",
    "electron-app/utils/legacy/globalUtilityRendering.ts",
    "electron-app/utils/legacy/globalUtilityTheming.ts",
    "electron-app/utils/legacy/globalUtilityUi.ts",
]);
const allowedLegacyUtilityImporterFiles = new Set(["electron-app/utils.ts"]);

const migratedGlobalDataReaderFiles = [
    "electron-app/utils/rendering/helpers/renderSummaryHelpers.ts",
    "electron-app/utils/rendering/helpers/summaryColModal.ts",
    "electron-app/utils/rendering/components/createUserDeviceInfoBox.ts",
    "electron-app/utils/ui/components/createFieldTogglesSection.ts",
    "electron-app/utils/ui/controls/dataPointFilterControl/stateHelpers.ts",
    "electron-app/utils/charts/rendering/renderEventMessagesChart.ts",
    "electron-app/utils/charts/rendering/renderLapZoneCharts.ts",
    "electron-app/utils/charts/core/getChartCounts.ts",
    "electron-app/utils/charts/components/chartStatusIndicator.ts",
    "electron-app/utils/app/initialization/chartSettingsRender.ts",
    "electron-app/utils/app/lifecycle/listeners.ts",
    "electron-app/utils/state/core/unifiedStateManager.ts",
    "electron-app/utils/maps/controls/mapLapSelector.ts",
    "electron-app/utils/maps/layers/mapDrawLaps.ts",
    "electron-app/utils/maps/core/renderMap.ts",
    "electron-app/utils/debug/debugSensorInfo.ts",
    "electron-app/utils/ui/controls/createElevationProfileButton.ts",
] as const;
const rendererUtilsFreeFiles = [
    "electron-app/utils/app/index.ts",
    "electron-app/utils/app/initialization/index.ts",
    "electron-app/utils/state/integration/stateIntegration.ts",
] as const;
const migratedRendererUtilityCallerFiles = [
    "electron-app/utils/files/import/loadOverlayFiles.ts",
    "electron-app/utils/maps/controls/mapActionButtons.ts",
    "electron-app/utils/maps/core/renderMap.ts",
    "electron-app/utils/rendering/components/shownFilesListItemHandlers.ts",
    "electron-app/utils/rendering/core/showFitData.ts",
    "electron-app/utils/ui/tabs/tabStateManagerHandlers.ts",
] as const;

const importSpecifierPattern =
    /\b(?:import\s+(?:[^'"]+\s+from\s+)?|export\s+[^'"]+\s+from\s+|require\()\s*["'](?<specifier>[^"']+)["']/gu;
const directGlobalDataWritePattern =
    /(?:\b(?:window|globalThis)\.globalData|\(\s*(?:window|globalThis)\s+as\b[^\n]*?\)\.globalData)\s*=/u;
const directGlobalDataReadPattern =
    /\b(?:window|globalThis)\.globalData\b|\.globalData\b/u;
const legacyAppStateGlobalDataPattern = /\bAppState\.globalData\b/u;
const directRendererUtilsGlobalPattern =
    /\b(?:window|globalThis)\.rendererUtils\s*=/u;
const rendererUtilsUsagePattern = /\brendererUtils\b/u;
const migratedRendererUtilityGlobalLookupPattern =
    /\b(?:appGlobal|window|globalThis|showFitGlobal|windowExt)\.(?:createTables|invalidateChartRenderCache|renderChartJS|renderMap|renderSummary|setTabButtonsEnabled|setupActiveFileNameMapActions|setupOverlayFileNameMapActions|updateActiveTab|updateOverlayHighlights|updateShownFilesList|updateTabVisibility)\b/u;

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

function getSourceImportTarget(
    importerPath: string,
    specifier: string,
    knownSourceFiles: ReadonlySet<string>
): null | string {
    if (specifier === "electron" || specifier.startsWith("node:")) {
        return specifier;
    }

    if (!specifier.startsWith(".")) {
        return null;
    }

    const importerDirectory = path.posix.dirname(importerPath);
    const resolvedPath = path.posix.normalize(
        path.posix.join(importerDirectory, specifier)
    );
    const candidates = [
        resolvedPath,
        ...[...sourceExtensions].map(
            (extension) => `${resolvedPath}${extension}`
        ),
        ...[...sourceExtensions].map(
            (extension) => `${resolvedPath}/index${extension}`
        ),
    ];

    return (
        candidates.find((candidate) => knownSourceFiles.has(candidate)) ?? null
    );
}

function isMainProcessImportTarget(importTarget: string): boolean {
    return (
        importTarget === "electron" ||
        importTarget.startsWith("node:") ||
        importTarget === "electron-app/main" ||
        importTarget.startsWith("electron-app/main/")
    );
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

function resolvesIntoRendererUtils(
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
        resolvedPath ===
            "electron-app/utils/app/initialization/rendererUtils" ||
        resolvedPath ===
            "electron-app/utils/app/initialization/rendererUtils.js"
    );
}

function resolvesIntoLegacyUtilities(
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
        resolvedPath === "electron-app/utils/legacy" ||
        resolvedPath.startsWith("electron-app/utils/legacy/")
    );
}

function hasRepositoryFile(relativePath: string): boolean {
    return existsSync(path.join(process.cwd(), relativePath));
}

function collectTransitiveMainProcessImportViolations(
    startFiles: readonly string[]
): string[] {
    const knownSourceFiles = new Set(collectSourceFiles("electron-app"));
    const importGraph = new Map(
        [...knownSourceFiles].map((relativeFile) => [
            relativeFile,
            getImportSpecifiers(readRepositoryFile(relativeFile))
                .map((specifier) => ({
                    specifier,
                    target: getSourceImportTarget(
                        relativeFile,
                        specifier,
                        knownSourceFiles
                    ),
                }))
                .filter(
                    (
                        edge
                    ): edge is {
                        specifier: string;
                        target: string;
                    } => edge.target !== null
                ),
        ])
    );
    const violations: string[] = [];

    for (const startFile of startFiles) {
        const visitedFiles = new Set<string>();
        const stack = [{ chain: [startFile], file: startFile }];

        while (stack.length > 0) {
            const current = stack.pop();
            if (!current || visitedFiles.has(current.file)) {
                continue;
            }
            visitedFiles.add(current.file);

            for (const edge of importGraph.get(current.file) ?? []) {
                if (isMainProcessImportTarget(edge.target)) {
                    violations.push(
                        [
                            ...current.chain,
                            `${edge.specifier} -> ${edge.target}`,
                        ].join(" => ")
                    );
                    continue;
                }

                if (
                    edge.target.startsWith("electron-app/") &&
                    knownSourceFiles.has(edge.target)
                ) {
                    stack.push({
                        chain: [...current.chain, edge.target],
                        file: edge.target,
                    });
                }
            }
        }
    }

    return violations.sort();
}

describe("architecture boundaries", () => {
    it("keeps the temporary compatibility ledger explicit", () => {
        expect.assertions(2);

        const ledger = readRepositoryFile("docs/DEPRECATION_LEDGER.md");
        const requiredSections = [
            "Renderer Global Data Bridge",
            "Legacy AppState Global",
            "Renderer Utility Globals",
            "Vendor Globals",
            "Runtime CommonJS Compatibility",
        ];
        const requiredSectionFields = [
            "Current owner",
            "Compatibility callers:",
            "Current status:",
            "Next removal step:",
            "Verification gates:",
            "Exit criteria:",
        ];

        expect(
            [...requiredSections, ...requiredSectionFields].filter(
                (requiredText) => !ledger.includes(requiredText)
            )
        ).toStrictEqual([]);
        expect(
            requiredSections.flatMap((sectionName) => {
                const sectionStart = ledger.indexOf(`## ${sectionName}`);
                if (sectionStart === -1) {
                    return [`${sectionName}: missing section`];
                }

                const nextSectionStart = ledger.indexOf(
                    "\n## ",
                    sectionStart + 1
                );
                const section =
                    nextSectionStart === -1
                        ? ledger.slice(sectionStart)
                        : ledger.slice(sectionStart, nextSectionStart);

                return requiredSectionFields
                    .filter((requiredField) => !section.includes(requiredField))
                    .map(
                        (requiredField) =>
                            `${sectionName}: missing ${requiredField}`
                    );
            })
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

    it("keeps renderer-adjacent import graphs out of main-process-only modules", () => {
        expect.assertions(1);

        const violations = collectTransitiveMainProcessImportViolations(
            rendererAdjacentRoots.flatMap(collectSourceFiles)
        );

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

    it("keeps state domain modules out of broad renderer utilities", () => {
        expect.assertions(1);

        const violations = stateDomainRoots
            .flatMap(collectSourceFiles)
            .flatMap((relativeFile) =>
                getImportSpecifiers(readRepositoryFile(relativeFile))
                    .filter((specifier) =>
                        resolvesIntoRendererUtils(relativeFile, specifier)
                    )
                    .map((specifier) => `${relativeFile}: ${specifier}`)
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps state core modules out of broad renderer utilities", () => {
        expect.assertions(1);

        const violations = stateCoreRoots
            .flatMap(collectSourceFiles)
            .flatMap((relativeFile) =>
                getImportSpecifiers(readRepositoryFile(relativeFile))
                    .filter((specifier) =>
                        resolvesIntoRendererUtils(relativeFile, specifier)
                    )
                    .map((specifier) => `${relativeFile}: ${specifier}`)
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps renderer entrypoints on focused bootstrap helpers", () => {
        expect.assertions(1);

        const violations = rendererEntrypointFiles
            .flatMap((relativeFile) =>
                getImportSpecifiers(readRepositoryFile(relativeFile))
                    .filter((specifier) =>
                        resolvesIntoRendererUtils(relativeFile, specifier)
                    )
                    .map((specifier) => `${relativeFile}: ${specifier}`)
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps legacy utility imports quarantined to compatibility bridges", () => {
        expect.assertions(1);

        const violations = sourceRoots
            .flatMap(collectSourceFiles)
            .filter(
                (relativeFile) =>
                    !relativeFile.startsWith("electron-app/utils/legacy/") &&
                    !allowedLegacyUtilityImporterFiles.has(relativeFile)
            )
            .flatMap((relativeFile) =>
                getImportSpecifiers(readRepositoryFile(relativeFile))
                    .filter((specifier) =>
                        resolvesIntoLegacyUtilities(relativeFile, specifier)
                    )
                    .map((specifier) => `${relativeFile}: ${specifier}`)
            )
            .sort();

        expect(violations).toStrictEqual([]);
    });

    it("keeps legacy renderer globals behind named compatibility modules", () => {
        expect.assertions(8);

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
        const legacyAppStateGlobalDataUsages = scannedFiles
            .filter((relativeFile) =>
                legacyAppStateGlobalDataPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            )
            .sort();
        const unexpectedLegacyUtilityFiles = collectSourceFiles(
            "electron-app/utils/legacy"
        ).filter(
            (relativeFile) => !allowedLegacyUtilityFiles.has(relativeFile)
        );
        const migratedGlobalDataReaderViolations =
            migratedGlobalDataReaderFiles.filter((relativeFile) =>
                directGlobalDataReadPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            );
        const rendererUtilsFreeViolations = rendererUtilsFreeFiles.filter(
            (relativeFile) =>
                rendererUtilsUsagePattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
        );
        const migratedRendererUtilityCallerViolations =
            migratedRendererUtilityCallerFiles.filter((relativeFile) =>
                migratedRendererUtilityGlobalLookupPattern.test(
                    stripComments(readRepositoryFile(relativeFile))
                )
            );
        const deletedCompatibilityFiles = [
            "electron-app/utils/app/initialization/rendererUtils.ts",
        ].filter(hasRepositoryFile);

        expect(directGlobalDataWrites).toStrictEqual([]);
        expect(directRendererUtilsGlobals).toStrictEqual([]);
        expect(legacyAppStateGlobalDataUsages).toStrictEqual([]);
        expect(unexpectedLegacyUtilityFiles).toStrictEqual([]);
        expect(migratedGlobalDataReaderViolations).toStrictEqual([]);
        expect(rendererUtilsFreeViolations).toStrictEqual([]);
        expect(migratedRendererUtilityCallerViolations).toStrictEqual([]);
        expect(deletedCompatibilityFiles).toStrictEqual([]);
    });
});
