import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
    appElevProfileCssPath,
    appIndexHtmlPath,
    appSourceRepositoryPath,
    appStyleCssPath,
    rootAlternativeFitViewAssetsPath,
    rootAlternativeFitViewIndexPath,
    rootAlternativeFitViewManifestPath,
    rootAppElevProfileCssPath,
    rootAppIconsPath,
    rootAppIconsSiteWebManifestPath,
    rootAppIndexHtmlPath,
    rootAppStyleCssPath,
    rootApplicationLayoutDocPath,
    rootCodecovConfigPath,
    rootDocsScreenshotNames,
    rootDocsScreenshotsPath,
    rootElectronBuilderConfigPath,
    rootFlatpakManifestPath,
    rootPackageRepositoryPath,
    rootReadmePath,
} from "../../../scripts/lib/workspaces.mjs";

const staleAppShellAssetPaths = [
    appSourceRepositoryPath(appIndexHtmlPath),
    appSourceRepositoryPath(appStyleCssPath),
    appSourceRepositoryPath(appElevProfileCssPath),
];
const rootAppShellAssetPaths = [
    rootAppIndexHtmlPath,
    rootAppStyleCssPath,
    rootAppElevProfileCssPath,
];

function readRepositoryFile(relativePath: string): string {
    return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function getDirectoryFileNames(relativePath: string): string[] {
    return readdirSync(path.join(process.cwd(), relativePath), {
        withFileTypes: true,
    })
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
        .sort();
}

function getRepositoryReferences(searchPaths: string[]): string {
    return searchPaths
        .map((relativePath) => readRepositoryFile(relativePath))
        .join("\n");
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

function stripJavaScriptComments(source: string): string {
    return source.replaceAll(/\/\*[\S\s]*?\*\/|\/\/[^\n\r]*/gu, "");
}

function getAssetRelativeReferences(
    ownerPath: string,
    ownerSource: string
): string[] {
    const ownerDirectory = path.posix.dirname(ownerPath);
    const relativeReferences = [];

    if (ownerPath.endsWith(".js") || ownerPath.endsWith(".mjs")) {
        const sourceWithoutComments = stripJavaScriptComments(ownerSource);
        const assetReferencePattern =
            /(?:import\s*\(\s*|from\s*)["']\.\/([^"']+)["']|new URL\(\s*["'](?:\.\/)?([^"']+)["']\s*,\s*import\.meta\.url\s*\)|["']\.\/([^"']+\.(?:css|ico|jpeg|jpg|js|png|svg|webp))["']/gu;

        for (const match of sourceWithoutComments.matchAll(
            assetReferencePattern
        )) {
            relativeReferences.push(match[1] ?? match[2] ?? match[3]);
        }
    } else {
        for (const match of ownerSource.matchAll(
            /\b(?:href|src)="([^"#:]+)"|url\(["']?([^)"']+)["']?\)/gu
        )) {
            relativeReferences.push(match[1] ?? match[2]);
        }
    }

    return relativeReferences
        .filter((reference): reference is string => Boolean(reference))
        .filter((reference) => !reference.startsWith("data:"))
        .filter((reference) => !reference.startsWith("#"))
        .map((reference) =>
            path.posix.normalize(path.posix.join(ownerDirectory, reference))
        )
        .filter((reference) =>
            reference.startsWith(`${rootAlternativeFitViewAssetsPath}/`)
        );
}

function getAlternativeViewerAssetGraph(): {
    knownAssetCount: number;
    missingReferences: Record<string, string[]>;
    referencedAssetCount: number;
    unreferencedAssets: string[];
} {
    const entryPath = rootAlternativeFitViewIndexPath;
    const assetsDirectory = path.join(
        process.cwd(),
        rootAlternativeFitViewAssetsPath
    );
    const knownAssets = new Set(
        readdirSync(assetsDirectory)
            .filter((fileName) =>
                statSync(path.join(assetsDirectory, fileName)).isFile()
            )
            .map(
                (fileName) => `${rootAlternativeFitViewAssetsPath}/${fileName}`
            )
    );
    const pendingReferences = getAssetRelativeReferences(
        entryPath,
        readRepositoryFile(entryPath)
    ).map((assetPath) => ({ assetPath, ownerPath: entryPath }));
    const referencedAssets = new Set<string>();
    const missingReferences: Record<string, string[]> = {};

    while (pendingReferences.length > 0) {
        const pendingReference = pendingReferences.shift();

        if (
            !pendingReference ||
            referencedAssets.has(pendingReference.assetPath)
        ) {
            continue;
        }
        const { assetPath, ownerPath } = pendingReference;
        referencedAssets.add(assetPath);

        const absoluteAssetPath = path.join(process.cwd(), assetPath);
        if (!existsSync(absoluteAssetPath)) {
            missingReferences[ownerPath] = [
                ...(missingReferences[ownerPath] ?? []),
                assetPath,
            ].sort();
            continue;
        }
        if (!assetPath.endsWith(".css") && !assetPath.endsWith(".js")) {
            continue;
        }

        for (const reference of getAssetRelativeReferences(
            assetPath,
            readRepositoryFile(assetPath)
        )) {
            if (!referencedAssets.has(reference)) {
                pendingReferences.push({
                    assetPath: reference,
                    ownerPath: assetPath,
                });
            }
        }
    }

    return {
        knownAssetCount: knownAssets.size,
        missingReferences,
        referencedAssetCount: referencedAssets.size,
        unreferencedAssets: [...knownAssets]
            .filter((assetPath) => !referencedAssets.has(assetPath))
            .sort(),
    };
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

function expectReferencesToResolve(
    ownerPath: string,
    references: string[]
): void {
    expect(getReferenceExistence(ownerPath, references)).toStrictEqual(
        Object.fromEntries(references.map((reference) => [reference, true]))
    );
}

describe("root app shell asset references", () => {
    it("keeps Flatpak app shell installs pointed at root static assets", () => {
        expect.assertions(6);

        const manifest = readRepositoryFile(rootFlatpakManifestPath);

        for (const assetPath of staleAppShellAssetPaths) {
            expect(manifest).not.toContain(`./${assetPath}`);
        }
        for (const assetPath of rootAppShellAssetPaths) {
            expect(manifest).toContain(`./${assetPath}`);
        }
    });

    it("keeps Codecov renderer UI paths pointed at root static assets", () => {
        expect.assertions(6);

        const codecovConfig = readRepositoryFile(rootCodecovConfigPath);

        for (const assetPath of staleAppShellAssetPaths) {
            expect(codecovConfig).not.toContain(`- ${assetPath}`);
        }
        for (const assetPath of rootAppShellAssetPaths) {
            expect(codecovConfig).toContain(`- ${assetPath}`);
        }
    });

    it("keeps alternative FIT viewer shell references backed by root static assets", () => {
        expect.assertions(5);

        const alternativeViewerIndexPath = rootAlternativeFitViewIndexPath;
        const alternativeViewerManifestPath =
            rootAlternativeFitViewManifestPath;
        const alternativeViewerIndexReferences = getHtmlRelativeAssetReferences(
            alternativeViewerIndexPath
        );
        const alternativeViewerManifestIconReferences =
            getManifestIconReferences(alternativeViewerManifestPath);
        const cssAssetReferences = alternativeViewerIndexReferences.filter(
            (reference) => /^\.\/assets\/.+\.css$/u.test(reference)
        );
        const jsAssetReferences = alternativeViewerIndexReferences.filter(
            (reference) => /^\.\/assets\/.+\.js$/u.test(reference)
        );
        const shellReferences = alternativeViewerIndexReferences.filter(
            (reference) => !reference.startsWith("./assets/")
        );
        const unexpectedAssetReferences =
            alternativeViewerIndexReferences.filter(
                (reference) =>
                    reference.startsWith("./assets/") &&
                    !cssAssetReferences.includes(reference) &&
                    !jsAssetReferences.includes(reference)
            );

        expect({
            cssAssetReferenceCount: cssAssetReferences.length,
            cssAssetReferencesAreBundledAssets: cssAssetReferences.every(
                (reference) => /^\.\/assets\/.+\.css$/u.test(reference)
            ),
            jsAssetReferenceCount: jsAssetReferences.length,
            jsAssetReferencesAreBundledAssets: jsAssetReferences.every(
                (reference) => /^\.\/assets\/.+\.js$/u.test(reference)
            ),
            shellReferences,
            unexpectedAssetReferences,
        }).toStrictEqual({
            cssAssetReferenceCount: 1,
            cssAssetReferencesAreBundledAssets: true,
            jsAssetReferenceCount: 1,
            jsAssetReferencesAreBundledAssets: true,
            shellReferences: [
                "../icons/apple-touch-icon.png",
                "../icons/favicon.ico",
                "../icons/favicon-96x96.png",
                "../icons/favicon.svg",
                "./manifest.json",
                "../icons/favicon.svg",
            ],
            unexpectedAssetReferences: [],
        });
        expect(alternativeViewerManifestIconReferences).toStrictEqual([
            "../icons/web-app-manifest-192x192.png",
            "../icons/web-app-manifest-512x512.png",
        ]);
        expectReferencesToResolve(
            alternativeViewerIndexPath,
            alternativeViewerIndexReferences
        );
        expectReferencesToResolve(
            alternativeViewerManifestPath,
            alternativeViewerManifestIconReferences
        );
        const obsoleteFabricIconsPath = path.join(
            process.cwd(),
            rootAlternativeFitViewAssetsPath,
            "fabric-icons.css"
        );
        expect({
            obsoleteFabricIconsExists: existsSync(obsoleteFabricIconsPath),
        }).toStrictEqual({ obsoleteFabricIconsExists: false });
    });

    it("keeps alternative FIT viewer generated assets internally reachable", () => {
        expect.assertions(1);

        expect(getAlternativeViewerAssetGraph()).toStrictEqual({
            knownAssetCount: 18,
            missingReferences: {},
            referencedAssetCount: 18,
            unreferencedAssets: [],
        });
    });

    it("keeps root static icons limited to packaged and shell-referenced assets", () => {
        expect.assertions(2);

        const iconNames = getDirectoryFileNames(rootAppIconsPath);
        const iconReferenceSources = getRepositoryReferences([
            rootPackageRepositoryPath,
            rootElectronBuilderConfigPath,
            rootFlatpakManifestPath,
            rootAppIndexHtmlPath,
            rootAlternativeFitViewIndexPath,
            rootAlternativeFitViewManifestPath,
            rootAppIconsSiteWebManifestPath,
            rootApplicationLayoutDocPath,
            rootReadmePath,
        ]);

        expect(iconNames).toStrictEqual([
            "apple-touch-icon.png",
            "favicon-256x256.ico",
            "favicon-256x256.png",
            "favicon-512x512.icns",
            "favicon-96x96.png",
            "favicon.ico",
            "favicon.svg",
            "harry.png",
            "mascot-kitty.png",
            "site.webmanifest",
            "web-app-manifest-192x192.png",
            "web-app-manifest-512x512.png",
        ]);
        expect(
            iconNames.filter((iconName) => !iconReferenceSources.includes(iconName))
        ).toStrictEqual([]);
    });

    it("keeps docs screenshots limited to canonical referenced images", () => {
        expect.assertions(1);

        expect(getDirectoryFileNames(rootDocsScreenshotsPath)).toStrictEqual(
            [...rootDocsScreenshotNames].sort()
        );
    });
});
