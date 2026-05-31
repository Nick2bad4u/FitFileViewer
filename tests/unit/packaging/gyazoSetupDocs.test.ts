import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

function readWorkspaceFile(relativePath: string): string {
    return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("gyazo setup documentation", () => {
    it("points users at current TypeScript runtime files and root build flow", () => {
        expect.assertions(1);

        const guide = readWorkspaceFile("docs/GYAZO_SETUP.md");

        expect({
            includesCurrentExportUtility: guide.includes(
                "electron-app/utils/files/export/exportUtils.ts"
            ),
            includesMainOauthServer: guide.includes(
                "electron-app/main/oauth/gyazoOAuthServer.ts"
            ),
            includesRootBuildScript: guide.includes("npm run build:runtime-ts"),
        }).toStrictEqual({
            includesCurrentExportUtility: true,
            includesMainOauthServer: true,
            includesRootBuildScript: true,
        });
    });

    it("does not tell users to edit removed JavaScript paths or source credentials", () => {
        expect.assertions(4);

        const guide = readWorkspaceFile("docs/GYAZO_SETUP.md");
        const exportUtilsSource = readWorkspaceFile(
            "electron-app/utils/files/export/exportUtils.ts"
        );

        expect(guide).not.toContain("electron-app/utils/exportUtils.js");
        expect(guide).not.toContain("gyazoConfig:");
        expect(exportUtilsSource).not.toContain(
            "Update the exportUtils.gyazoConfig"
        );
        expect({
            guideMentionsRemovedPath: guide.includes(
                "electron-app/utils/exportUtils.js"
            ),
            guideMentionsSourceConfig: guide.includes("gyazoConfig:"),
            uiMentionsSourceConfig: exportUtilsSource.includes(
                "Update the exportUtils.gyazoConfig"
            ),
        }).toStrictEqual({
            guideMentionsRemovedPath: false,
            guideMentionsSourceConfig: false,
            uiMentionsSourceConfig: false,
        });
    });
});
