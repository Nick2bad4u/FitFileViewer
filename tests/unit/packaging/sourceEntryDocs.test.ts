import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
    docusaurusAdvancedFitParserMigrationDocPath,
    docusaurusAdvancedPerformanceDocPath,
    docusaurusApiCoreApisDocPath,
    docusaurusApiIpcCommunicationDocPath,
    docusaurusArchitectureModuleSystemDocPath,
    docusaurusArchitectureOverviewDocPath,
    docusaurusArchitectureProcessModelDocPath,
    docusaurusArchitectureSecurityDocPath,
    rootAgentsPath,
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

    it("documents runtime output under electron-app/dist instead of bare dist", () => {
        expect.assertions(2);

        const docs = [
            readWorkspaceFile(rootApplicationLayoutDocPath),
            readWorkspaceFile(rootApplicationOverviewDocPath),
        ].join("\n");

        expect(docs).toContain("electron-app/dist/preload.js");
        expect(docs).not.toMatch(
            /(?:preload:dist\/preload\.js|(?<!electron-app\/)dist\/preload\.js|renderer dist\/renderer\.js|runtime dist)/u
        );
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
