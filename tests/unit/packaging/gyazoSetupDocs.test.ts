import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { rootGyazoSetupDocPath } from "../../../scripts/lib/workspaces.mjs";

function readWorkspaceFile(relativePath: string): string {
    return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("gyazo setup documentation", () => {
    it("points users at current TypeScript runtime files and root build flow", () => {
        expect.assertions(1);

        const guide = readWorkspaceFile(rootGyazoSetupDocPath);
        const requiredGuideSnippets = [
            "electron-app/utils/files/export/exportUtils.ts",
            "electron-app/main/oauth/gyazoOAuthServer.ts",
            "npm run build:runtime-ts",
        ];

        expect(
            requiredGuideSnippets.filter((snippet) => !guide.includes(snippet))
        ).toStrictEqual([]);
    });

    it("does not tell users to edit removed JavaScript paths or source credentials", () => {
        expect.assertions(3);

        const guide = readWorkspaceFile(rootGyazoSetupDocPath);
        const exportUtilsSource = readWorkspaceFile(
            "electron-app/utils/files/export/exportUtils.ts"
        );

        expect(guide).not.toContain("electron-app/utils/exportUtils.js");
        expect(guide).not.toContain("gyazoConfig:");
        expect(exportUtilsSource).not.toContain(
            "Update the exportUtils.gyazoConfig"
        );
    });
});
