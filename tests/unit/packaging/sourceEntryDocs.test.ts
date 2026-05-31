import { readFileSync } from "node:fs";
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
        expect.assertions(1);

        const docs = SOURCE_LAYOUT_DOCS.map((docPath) =>
            readWorkspaceFile(docPath)
        ).join("\n");

        expect({
            fitParser: docs.includes("fitParser.ts"),
            main: docs.includes("main.ts"),
            mainUi: docs.includes("main-ui.ts"),
            preload: docs.includes("preload.ts"),
            renderer: docs.includes("renderer.ts"),
        }).toStrictEqual({
            fitParser: true,
            main: true,
            mainUi: true,
            preload: true,
            renderer: true,
        });
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
});
