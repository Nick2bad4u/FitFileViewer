import { existsSync, readFileSync } from "node:fs";
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

function getHtmlRelativeAssetReferences(relativePath: string): string[] {
    const html = readRepositoryFile(relativePath);
    const references = [...html.matchAll(/\b(?:href|src)="([^"#:]+)"/gu)].map(
        (match) => match[1]
    );

    return references
        .filter((reference): reference is string => Boolean(reference))
        .filter((reference) => !reference.startsWith("data:"));
}

function getManifestIconReferences(relativePath: string): string[] {
    const manifest = JSON.parse(readRepositoryFile(relativePath)) as {
        icons?: Array<{ src?: string }>;
    };

    return (manifest.icons ?? [])
        .map((icon) => icon.src)
        .filter((reference): reference is string => Boolean(reference));
}

function resolveRepositoryReference(
    ownerPath: string,
    reference: string
): string {
    return path.posix.normalize(
        path.posix.join(path.posix.dirname(ownerPath), reference)
    );
}

function getReferenceExistence(
    ownerPath: string,
    references: string[]
): Record<string, boolean> {
    return Object.fromEntries(
        references.map((reference) => {
            const repositoryPath = resolveRepositoryReference(
                ownerPath,
                reference
            );

            return [
                reference,
                existsSync(path.join(process.cwd(), repositoryPath)),
            ];
        })
    );
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

    it("keeps alternative FIT viewer shell references backed by root static assets", () => {
        expect.assertions(3);

        const alternativeViewerIndexPath = "static/ffv/index.html";
        const alternativeViewerManifestPath = "static/ffv/manifest.json";

        expect(
            getReferenceExistence(
                alternativeViewerIndexPath,
                getHtmlRelativeAssetReferences(alternativeViewerIndexPath)
            )
        ).toStrictEqual({
            "../icons/apple-touch-icon.png": true,
            "../icons/favicon-96x96.png": true,
            "../icons/favicon.ico": true,
            "../icons/favicon.svg": true,
            "./assets/index-LvWRIhnC.js": true,
            "./assets/index-mfP-sHfH.css": true,
            "./manifest.json": true,
        });
        expect(
            getReferenceExistence(
                alternativeViewerManifestPath,
                getManifestIconReferences(alternativeViewerManifestPath)
            )
        ).toStrictEqual({
            "../icons/web-app-manifest-192x192.png": true,
            "../icons/web-app-manifest-512x512.png": true,
        });
        expect(
            existsSync(
                path.join(
                    process.cwd(),
                    "static",
                    "ffv",
                    "assets",
                    "fabric-icons.css"
                )
            )
        ).toBe(false);
    });
});
