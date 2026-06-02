import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
    docusaurusArchitectureModuleSystemDocPath,
    docusaurusArchitectureOverviewDocPath,
    docusaurusArchitectureProcessModelDocPath,
    rootAgentsPath,
    rootApplicationArchitectureDocPath,
    rootApplicationLayoutDocPath,
    rootApplicationOverviewDocPath,
    rootCliffConfigPath,
    rootCodecovConfigPath,
    rootElectronBuilderConfigPath,
    rootEslintConfigPath,
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
];

function readWorkspaceFile(relativePath: string): string {
    return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("source entrypoint documentation", () => {
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

        expect(
            Object.fromEntries(
                expectedSourceEntrypointPaths.map((sourceEntrypointPath) => [
                    sourceEntrypointPath,
                    existsSync(path.join(process.cwd(), sourceEntrypointPath)),
                ])
            )
        ).toStrictEqual(
            Object.fromEntries(
                expectedSourceEntrypointPaths.map((sourceEntrypointPath) => [
                    sourceEntrypointPath,
                    true,
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
        expect.assertions(12);

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

        expect(
            Object.fromEntries(
                documentedRootToolingFiles.map((filePath) => [
                    filePath,
                    existsSync(path.join(process.cwd(), filePath)),
                ])
            )
        ).toStrictEqual(
            Object.fromEntries(
                documentedRootToolingFiles.map((filePath) => [filePath, true])
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
