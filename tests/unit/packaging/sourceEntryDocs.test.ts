import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const SOURCE_LAYOUT_DOCS = [
    "docs/APPLICATION_ARCHITECTURE.md",
    "docs/APPLICATION_LAYOUT.md",
    "docs/APPLICATION_OVERVIEW.md",
    "docusaurus/docs/architecture/overview.md",
];

function readWorkspaceFile(relativePath: string): string {
    return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("source entrypoint documentation", () => {
    it("documents TypeScript source entrypoints for the Electron app", () => {
        expect.assertions(5);

        const docs = SOURCE_LAYOUT_DOCS.map((docPath) =>
            readWorkspaceFile(docPath)
        ).join("\n");

        expect(docs).toEqual(expect.stringContaining("fitParser.ts"));
        expect(docs).toEqual(expect.stringContaining("main.ts"));
        expect(docs).toEqual(expect.stringContaining("main-ui.ts"));
        expect(docs).toEqual(expect.stringContaining("preload.ts"));
        expect(docs).toEqual(expect.stringContaining("renderer.ts"));
    });

    it("does not present generated JavaScript files as source layout entries", () => {
        expect.assertions(7);

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
    });

    it("documents runtime output under electron-app/dist instead of bare dist", () => {
        expect.assertions(2);

        const docs = [
            readWorkspaceFile("docs/APPLICATION_LAYOUT.md"),
            readWorkspaceFile("docs/APPLICATION_OVERVIEW.md"),
        ].join("\n");

        expect(docs).toContain("electron-app/dist/preload.js");
        expect(docs).not.toMatch(
            /(?:preload:dist\/preload\.js|(?<!electron-app\/)dist\/preload\.js|renderer dist\/renderer\.js|runtime dist)/u
        );
    });

    it("keeps the root layout guide from documenting removed top-level directories", () => {
        expect.assertions(1);

        const layoutGuide = readWorkspaceFile("docs/APPLICATION_LAYOUT.md");

        expect(layoutGuide).not.toMatch(
            /├── (?:logs|utils)\/\s+# (?:Application logs|Shared utilities \(legacy\))/u
        );
    });

    it("documents only current root tooling files in the root layout guide", () => {
        expect.assertions(3);

        const layoutGuide = readWorkspaceFile("docs/APPLICATION_LAYOUT.md");
        const documentedRootToolingFiles = [
            ".gitignore",
            "cliff.toml",
            "codecov.yml",
            "electron-builder.config.cjs",
            "eslint.config.mjs",
            "prettier.config.mjs",
            "stylelint.config.mjs",
            "vitest.config.ts",
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
