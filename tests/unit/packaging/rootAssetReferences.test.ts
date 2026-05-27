import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const staleAppShellAssetPaths = [
    "electron-app/index.html",
    "electron-app/style.css",
    "electron-app/elevProfile.css",
];
const rootAppShellAssetPaths = [
    "static/app/index.html",
    "static/app/style.css",
    "static/app/elevProfile.css",
];

function readRepositoryFile(relativePath: string): string {
    return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("root app shell asset references", () => {
    it("keeps Flatpak app shell installs pointed at root static assets", () => {
        expect.assertions(6);

        const manifest = readRepositoryFile("flatpak-build.yml");

        for (const assetPath of staleAppShellAssetPaths) {
            expect(manifest).not.toContain(`./${assetPath}`);
        }
        for (const assetPath of rootAppShellAssetPaths) {
            expect(manifest).toContain(`./${assetPath}`);
        }
    });

    it("keeps Codecov renderer UI paths pointed at root static assets", () => {
        expect.assertions(6);

        const codecovConfig = readRepositoryFile("codecov.yml");

        for (const assetPath of staleAppShellAssetPaths) {
            expect(codecovConfig).not.toContain(`- ${assetPath}`);
        }
        for (const assetPath of rootAppShellAssetPaths) {
            expect(codecovConfig).toContain(`- ${assetPath}`);
        }
    });
});
