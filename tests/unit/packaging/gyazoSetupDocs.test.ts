import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

function readWorkspaceFile(relativePath: string): string {
    return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("gyazo setup documentation", () => {
    it("points users at current TypeScript runtime files and root build flow", () => {
        expect.assertions(3);

        const guide = readWorkspaceFile("docs/GYAZO_SETUP.md");

        expect(guide).toEqual(
            expect.stringContaining(
                "electron-app/utils/files/export/exportUtils.ts"
            )
        );
        expect(guide).toEqual(
            expect.stringContaining(
                "electron-app/main/oauth/gyazoOAuthServer.ts"
            )
        );
        expect(guide).toEqual(
            expect.stringContaining("npm run build:runtime-ts")
        );
    });

    it("does not tell users to edit removed JavaScript paths or source credentials", () => {
        expect.assertions(3);

        const guide = readWorkspaceFile("docs/GYAZO_SETUP.md");
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
