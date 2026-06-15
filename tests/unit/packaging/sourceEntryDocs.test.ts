import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
    docusaurusAdvancedFitParserMigrationDocPath,
    docusaurusAdvancedPerformanceDocPath,
    docusaurusApiCoreApisDocPath,
    docusaurusApiIpcCommunicationDocPath,
    docusaurusApiStateManagementDocPath,
    docusaurusApiUtilityApisDocPath,
    docusaurusArchitectureModuleSystemDocPath,
    docusaurusArchitectureOverviewDocPath,
    docusaurusArchitectureProcessModelDocPath,
    docusaurusArchitectureSecurityDocPath,
    rootAgentsPath,
    rootApiDocumentationDocPath,
    rootApplicationArchitectureDocPath,
    rootApplicationLayoutDocPath,
    rootApplicationOverviewDocPath,
    rootCliffConfigPath,
    rootCodecovConfigPath,
    rootElectronBuilderConfigPath,
    rootEslintConfigPath,
    rootFitParserMigrationGuideDocPath,
    rootGitignorePath,
    rootPrettierConfigPath,
    rootStylelintConfigPath,
    rootVitestConfigPath,
} from "../../../scripts/lib/workspaces.mjs";

const SOURCE_LAYOUT_DOCS = [
    rootAgentsPath,
    docusaurusArchitectureModuleSystemDocPath,
    rootApplicationArchitectureDocPath,
    rootApplicationLayoutDocPath,
    rootApplicationOverviewDocPath,
    docusaurusArchitectureOverviewDocPath,
    docusaurusArchitectureProcessModelDocPath,
    docusaurusArchitectureSecurityDocPath,
];

const FIT_PARSER_API_DOCS = [
    rootFitParserMigrationGuideDocPath,
    docusaurusAdvancedFitParserMigrationDocPath,
    docusaurusAdvancedPerformanceDocPath,
    docusaurusApiCoreApisDocPath,
    docusaurusApiIpcCommunicationDocPath,
];

const staleFlatUtilityApiReferences = [
    "./utils/formatting/formatDistance.js",
    "./utils/formatting/formatDuration.js",
    "./utils/formatting/formatSpeed.js",
    "./utils/maps/renderMap.js",
    "./utils/maps/mapDrawLaps.js",
    "./utils/charts/renderChartJS.js",
    "./utils/charts/chartSpec.js",
    "./utils/state/stateManager.js",
    "./utils/state/themeManager.js",
    "./utils/state/fileStateManager.js",
];

const staleStateApiReferences = [
    "./utils/state/stateManager.js",
    "./utils/state/themeManager.js",
    "./utils/state/fileStateManager.js",
    "stateManager.remove(",
    "stateManager.configurePersistence(",
    "stateManager.loadPersistedState();",
    "themeManager.",
    "fileStateManager.",
];

function readWorkspaceFile(relativePath: string): string {
    return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function getPathStates(
    relativePaths: string[]
): Record<string, "missing" | "present"> {
    return Object.fromEntries(
        relativePaths.map((relativePath) => [
            relativePath,
            existsSync(path.join(process.cwd(), relativePath))
                ? "present"
                : "missing",
        ])
    );
}

describe("source entrypoint documentation", () => {
    it("uses the case-exact root agent instructions path", () => {
        expect.assertions(2);

        const rootEntries = readdirSync(process.cwd());

        expect(rootAgentsPath).toBe("AGENTS.md");
        expect({
            pathState: getPathStates([rootAgentsPath]),
            rootEntryMatches: rootEntries.filter(
                (entry) => entry.toLowerCase() === rootAgentsPath.toLowerCase()
            ),
        }).toStrictEqual({
            pathState: {
                [rootAgentsPath]: "present",
            },
            rootEntryMatches: [rootAgentsPath],
        });
    });

    it("documents TypeScript source entrypoints for the Electron app", () => {
        expect.assertions(2);

        const docs = SOURCE_LAYOUT_DOCS.map((docPath) =>
            readWorkspaceFile(docPath)
        ).join("\n");
        const expectedSourceEntrypoints = [
            "fitParser.ts",
            "main.ts",
            "main-ui.ts",
            "preload.ts",
            "renderer.ts",
        ];
        const expectedSourceEntrypointPaths = expectedSourceEntrypoints.map(
            (sourceEntrypoint) => path.join("electron-app", sourceEntrypoint)
        );

        expect(getPathStates(expectedSourceEntrypointPaths)).toStrictEqual(
            Object.fromEntries(
                expectedSourceEntrypointPaths.map((sourceEntrypointPath) => [
                    sourceEntrypointPath,
                    "present",
                ])
            )
        );
        expect(
            expectedSourceEntrypoints.filter(
                (sourceEntrypoint) => !docs.includes(sourceEntrypoint)
            )
        ).toStrictEqual([]);
    });

    it("does not present generated JavaScript files as source layout entries", () => {
        expect.assertions(14);

        const docs = SOURCE_LAYOUT_DOCS.map((docPath) =>
            readWorkspaceFile(docPath)
        ).join("\n");

        expect(docs).not.toContain("`electron-app/main.js`");
        expect(docs).not.toContain("`electron-app/preload.js`");
        expect(docs).not.toContain("`electron-app/renderer.js`");
        expect(docs).not.toContain("├── fitParser.js");
        expect(docs).not.toContain("├── main.js");
        expect(docs).not.toContain("├── main-ui.js");
        expect(docs).not.toContain("| `main.js`");
        expect(docs).not.toContain("`main-ui.js`");
        expect(docs).not.toContain("`renderer.js`");
        expect(docs).not.toContain("A[renderer.js]");
        expect(docs).not.toContain("B[main-ui.js]");
        expect(docs).not.toContain("C[fitParser.js]");
        expect(docs).not.toContain("// main.js");
        expect(docs).not.toContain("// preload.js");
    });

    it("documents runtime output under root dist", () => {
        expect.assertions(4);

        const docs = [
            readWorkspaceFile(rootApplicationLayoutDocPath),
            readWorkspaceFile(rootApplicationOverviewDocPath),
        ].join("\n");

        expect(docs).toContain("dist/preload.js");
        expect(docs).toContain(
            "├── dist/                            # Generated runtime output"
        );
        expect(docs).not.toContain("electron-app/dist");
        expect(docs).not.toMatch(/└── electron-app\/\s*\n\s*└── dist\//u);
    });

    it("keeps FIT parser API docs aligned with current bridge and decode APIs", () => {
        expect.assertions(1);

        const docs = FIT_PARSER_API_DOCS.map((docPath) =>
            readWorkspaceFile(docPath)
        ).join("\n");
        const staleApiReferences = [
            "fitParser.js module",
            "initializeFitParserIntegration",
            "decodeFitFileWithState",
            "updateDecoderOptionsWithState",
            "getCurrentDecoderOptionsWithState",
            "setupFitParserIPC",
            "setupFitParserPreload",
            "import { parseFitFile }",
            'require("./fitParser.js")',
            'require("electron")',
            "// renderer.js",
            "// preload.js",
        ];
        const staleDirectParserCall = /(^|[^.\w])parseFitFile\(buffer\)/u;

        expect([
            ...staleApiReferences.filter((reference) =>
                docs.includes(reference)
            ),
            ...(staleDirectParserCall.test(docs)
                ? ["direct parseFitFile(buffer)"]
                : []),
        ]).toStrictEqual([]);
    });

    it("keeps the root layout guide from documenting removed top-level directories", () => {
        expect.assertions(2);

        const layoutGuide = readWorkspaceFile(rootApplicationLayoutDocPath);
        const currentRootDirectories = [
            "docusaurus/",
            "electron-app/",
            "fit-test-files/",
            "scripts/",
            "static/",
            "tests/",
        ];

        expect(
            currentRootDirectories.filter(
                (rootDirectory) => !layoutGuide.includes(rootDirectory)
            )
        ).toStrictEqual([]);
        expect(layoutGuide).not.toMatch(
            /├── (?:logs|utils)\/\s+# (?:Application logs|Shared utilities \(legacy\))/u
        );
    });

    it("keeps the root layout guide utility domains aligned with current source directories", () => {
        expect.assertions(3);

        const layoutGuide = readWorkspaceFile(rootApplicationLayoutDocPath);
        const currentUtilityDirectoryNames = [
            "app",
            "async",
            "charts",
            "config",
            "data",
            "debug",
            "docs",
            "dom",
            "errors",
            "files",
            "formatting",
            "logging",
            "maps",
            "net",
            "performance",
            "rendering",
            "runtime",
            "state",
            "storage",
            "theming",
            "types",
            "ui",
        ];
        const currentUtilityDirectories = currentUtilityDirectoryNames.map(
            (directoryName) =>
                path.posix.join("electron-app", "utils", directoryName)
        );
        const staleFlatUtilityEntries = [
            "aboutModal.js",
            "appMenu.js",
            "chartColors.js",
            "notifications.js",
            "renderChartJS.js",
            "setupWindow.js",
            "showNotification.js",
            "tabManager.js",
        ];

        expect(getPathStates(currentUtilityDirectories)).toStrictEqual(
            Object.fromEntries(
                currentUtilityDirectories.map((directoryPath) => [
                    directoryPath,
                    "present",
                ])
            )
        );
        expect(
            currentUtilityDirectoryNames.filter(
                (directoryName) => !layoutGuide.includes(`── ${directoryName}/`)
            )
        ).toStrictEqual([]);
        expect(
            staleFlatUtilityEntries.filter((entryName) =>
                layoutGuide.includes(entryName)
            )
        ).toStrictEqual([]);
    });

    it("keeps the Docusaurus module-system page aligned with current utility domains", () => {
        expect.assertions(3);

        const moduleSystemGuide = readWorkspaceFile(
            docusaurusArchitectureModuleSystemDocPath
        );
        const currentSourceExamples = [
            "electron-app/utils/formatting/formatters/formatDistance.ts",
            "electron-app/utils/maps/core/renderMap.ts",
            "electron-app/utils/charts/core/renderChartJS.ts",
            "electron-app/utils/state/core/stateManager.ts",
            "electron-app/utils/ui/tabs/tabStateManager.ts",
        ];
        const staleFlatModuleReferences = [
            "| `formatDistance.js`",
            "| `formatDuration.js`",
            "| `formatSpeed.js`",
            "| `renderMap.js`",
            "| `renderChartJS.js`",
            "| `stateManager.js`",
            "| `tabManager.js`",
            "./utils/formatting/formatDistance.js",
            "./utils/maps/renderMap.js",
            "./utils/charts/renderChartJS.js",
            "./utils/state/stateManager.js",
        ];

        expect(getPathStates(currentSourceExamples)).toStrictEqual(
            Object.fromEntries(
                currentSourceExamples.map((sourcePath) => [
                    sourcePath,
                    "present",
                ])
            )
        );
        expect(
            currentSourceExamples.filter(
                (sourcePath) => !moduleSystemGuide.includes(sourcePath)
            )
        ).toStrictEqual([]);
        expect(
            staleFlatModuleReferences.filter((reference) =>
                moduleSystemGuide.includes(reference)
            )
        ).toStrictEqual([]);
    });

    it("keeps the Docusaurus process model module-loading examples current", () => {
        expect.assertions(4);

        const processModelGuide = readWorkspaceFile(
            docusaurusArchitectureProcessModelDocPath
        );
        const currentProcessModelSourceExamples = [
            "electron-app/utils/maps/core/renderMap.ts",
            "electron-app/utils/charts/core/renderChartJS.ts",
        ];
        const staleProcessModelReferences = [
            "./utils/maps/renderMap.js",
            "./utils/charts/renderChart.js",
            "renderChart }",
        ];

        expect(getPathStates(currentProcessModelSourceExamples)).toStrictEqual(
            Object.fromEntries(
                currentProcessModelSourceExamples.map((sourcePath) => [
                    sourcePath,
                    "present",
                ])
            )
        );
        expect(processModelGuide).toContain("./utils/maps/core/renderMap.js");
        expect(processModelGuide).toContain(
            "./utils/charts/core/renderChartJS.js"
        );
        expect(
            staleProcessModelReferences.filter((reference) =>
                processModelGuide.includes(reference)
            )
        ).toStrictEqual([]);
    });

    it("keeps the root architecture guide aligned with current utility source", () => {
        expect.assertions(4);

        const architectureGuide = readWorkspaceFile(
            rootApplicationArchitectureDocPath
        );
        const currentArchitectureSourceExamples = [
            "electron-app/utils/charts/core/renderChartJS.ts",
            "electron-app/utils/charts/core/chartSpecFactory.ts",
            "electron-app/utils/maps/core/renderMap.ts",
            "electron-app/utils/maps/layers/mapDrawLaps.ts",
            "electron-app/utils/state/core/stateManager.ts",
            "electron-app/utils/files/import/handleOpenFile.ts",
            "electron-app/utils/rendering/components/createTables.ts",
            "electron-app/utils/ui/tabs/tabStateManager.ts",
        ];
        const staleArchitectureReferences = [
            "aboutModal.js",
            "appMenu.js",
            "notifications.js",
            "chartSpec.js",
            "vegaLiteUtils.js",
            "tabManager.js",
            "setupWindow.js",
            "./utils/maps/renderMap.js",
            "./utils/charts/renderChartJS.js",
            "├── renderChartJS.js",
            "├── renderMap.js",
            "├── mapDrawLaps.js",
            "Vega-Lite",
            "vegaLite",
        ];

        expect(getPathStates(currentArchitectureSourceExamples)).toStrictEqual(
            Object.fromEntries(
                currentArchitectureSourceExamples.map((sourcePath) => [
                    sourcePath,
                    "present",
                ])
            )
        );
        expect(
            currentArchitectureSourceExamples.filter(
                (sourcePath) => !architectureGuide.includes(sourcePath)
            )
        ).toStrictEqual([]);
        expect(
            staleArchitectureReferences.filter((reference) =>
                architectureGuide.includes(reference)
            )
        ).toStrictEqual([]);
        expect(architectureGuide).toContain('charts: "Chart.js rendering"');
    });

    it("keeps the Docusaurus utility API reference aligned with current utility source", () => {
        expect.assertions(3);

        const utilityApiReference = readWorkspaceFile(
            docusaurusApiUtilityApisDocPath
        );
        const currentApiSourceExamples = [
            "electron-app/utils/formatting/formatters/formatDistance.ts",
            "electron-app/utils/formatting/formatters/formatDuration.ts",
            "electron-app/utils/formatting/formatters/formatTime.ts",
            "electron-app/utils/maps/core/renderMap.ts",
            "electron-app/utils/maps/layers/mapDrawLaps.ts",
            "electron-app/utils/charts/core/renderChartJS.ts",
            "electron-app/utils/charts/core/chartSpecFactory.ts",
            "electron-app/utils/state/core/stateManager.ts",
            "electron-app/utils/state/domain/settingsStateManager.ts",
        ];
        expect(getPathStates(currentApiSourceExamples)).toStrictEqual(
            Object.fromEntries(
                currentApiSourceExamples.map((sourcePath) => [
                    sourcePath,
                    "present",
                ])
            )
        );
        expect(
            currentApiSourceExamples.filter(
                (sourcePath) => !utilityApiReference.includes(sourcePath)
            )
        ).toStrictEqual([]);
        expect(
            staleFlatUtilityApiReferences.filter((reference) =>
                utilityApiReference.includes(reference)
            )
        ).toStrictEqual([]);
    });

    it("keeps the Docusaurus state API reference aligned with current state source", () => {
        expect.assertions(3);

        const stateApiReference = readWorkspaceFile(
            docusaurusApiStateManagementDocPath
        );
        const currentStateSourceExamples = [
            "electron-app/utils/state/core/stateManager.ts",
            "electron-app/utils/state/domain/settingsStateManager.ts",
            "electron-app/utils/state/domain/fitFileState.ts",
        ];

        expect(getPathStates(currentStateSourceExamples)).toStrictEqual(
            Object.fromEntries(
                currentStateSourceExamples.map((sourcePath) => [
                    sourcePath,
                    "present",
                ])
            )
        );
        expect(
            currentStateSourceExamples.filter(
                (sourcePath) => !stateApiReference.includes(sourcePath)
            )
        ).toStrictEqual([]);
        expect(
            staleStateApiReferences.filter((reference) =>
                stateApiReference.includes(reference)
            )
        ).toStrictEqual([]);
    });

    it("keeps the root API documentation as a current maintained index", () => {
        expect.assertions(4);

        const rootApiDocumentation = readWorkspaceFile(
            rootApiDocumentationDocPath
        );
        const maintainedApiReferences = [
            "docusaurus/docs/api-reference/core-apis.md",
            "docusaurus/docs/api-reference/ipc-communication.md",
            "docusaurus/docs/api-reference/utility-apis.md",
            "docusaurus/docs/api-reference/state-management.md",
            "docusaurus/docs/api/",
            "electron-app/fitParser.ts",
            "electron-app/main.ts",
            "electron-app/preload.ts",
            "electron-app/renderer.ts",
        ];
        const staleRootApiReferences = [
            ...staleFlatUtilityApiReferences,
            "./utils/charts/vegaLiteCharts.js",
            "./utils/maps/mapControls.js",
            "./utils/data/createTables.js",
            "./utils/ui/copyTableAsCSV.js",
            "./utils/state/core/unifiedStateManager.js",
            "./utils/errors/index.js",
            "./utils/config/index.js",
            "./tests/utils/testEnvironment.js",
            "./tests/utils/componentHelpers.js",
            "./tests/utils/integrationHelpers.js",
            "PluginBase",
            "Vega-Lite",
        ];

        expect(getPathStates([rootApiDocumentationDocPath])).toStrictEqual({
            [rootApiDocumentationDocPath]: "present",
        });
        expect(
            maintainedApiReferences.filter(
                (reference) => !rootApiDocumentation.includes(reference)
            )
        ).toStrictEqual([]);
        expect(
            staleRootApiReferences.filter((reference) =>
                rootApiDocumentation.includes(reference)
            )
        ).toStrictEqual([]);
        expect(rootApiDocumentation).toContain(
            "Root API documentation is an index, not a second source of API truth."
        );
    });

    it("documents only current root tooling files in the root layout guide", () => {
        expect.assertions(3);

        const layoutGuide = readWorkspaceFile(rootApplicationLayoutDocPath);
        const documentedRootToolingFiles = [
            rootGitignorePath,
            rootCliffConfigPath,
            rootCodecovConfigPath,
            rootElectronBuilderConfigPath,
            rootEslintConfigPath,
            rootPrettierConfigPath,
            rootStylelintConfigPath,
            rootVitestConfigPath,
        ];
        const staleRootToolingFiles = [
            ".browserslistrc",
            ".editorconfig",
            ".gitattributes",
        ];

        expect(getPathStates(documentedRootToolingFiles)).toStrictEqual(
            Object.fromEntries(
                documentedRootToolingFiles.map((filePath) => [
                    filePath,
                    "present",
                ])
            )
        );
        expect(
            documentedRootToolingFiles.filter(
                (filePath) => !layoutGuide.includes(filePath)
            )
        ).toStrictEqual([]);
        expect(
            staleRootToolingFiles.filter((filePath) =>
                layoutGuide.includes(filePath)
            )
        ).toStrictEqual([]);
    });
});
