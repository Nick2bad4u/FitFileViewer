import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
    appLeafletMeasureLitePath,
    appRendererVendorGlobalsCoreEntryPath,
    appRendererVendorGlobalsEntryPath,
    appSourceRepositoryPath,
    rootAppIndexHtmlPath,
    rootPackageRepositoryPath,
    rootStaticAssetsPath,
} from "../../../scripts/lib/workspaces.mjs";

const repositoryRoot = process.cwd();
const rendererBrowserPackages = [
    "@maplibre/maplibre-gl-leaflet",
    "arquero",
    "chart.js",
    "chartjs-adapter-date-fns",
    "chartjs-plugin-zoom",
    "datatables.net-dt",
    "dompurify",
    "hammerjs",
    "jquery",
    "jszip",
    "leaflet",
    "leaflet-draw",
    "leaflet-measure",
    "leaflet-minimap",
    "leaflet.fullscreen",
    "leaflet.locatecontrol",
    "leaflet.markercluster",
    "maplibre-gl",
    "screenfull",
] as const;

const fromImportSpecifierPattern =
    /^\s*import\s+[^"\n].*?\s+from\s+"([^"]+)";/gmu;
const sideEffectImportSpecifierPattern = /^\s*import\s+"([^"]+)";/gmu;
const staleRepositoryVendorPaths = [
    appSourceRepositoryPath("renderer", "vendor"),
    appSourceRepositoryPath("vendor"),
    path.posix.join(path.posix.dirname(rootAppIndexHtmlPath), "vendor"),
    path.posix.join(rootStaticAssetsPath, "vendor"),
] as const;

type PackageJson = {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
};

function readWorkspaceFile(relativePath: string): string {
    return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

function getFileExistence(relativePaths: string[]): Record<string, boolean> {
    return Object.fromEntries(
        relativePaths.map((relativePath) => [
            relativePath,
            existsSync(path.join(repositoryRoot, relativePath)),
        ])
    );
}

function getImportedBrowserPackages(source: string): Set<string> {
    const importedPackages = new Set<string>();
    const importSpecifiers = [
        ...source.matchAll(fromImportSpecifierPattern),
        ...source.matchAll(sideEffectImportSpecifierPattern),
    ].map((match) => match[1]);

    for (const importSpecifier of importSpecifiers) {
        const packageName = rendererBrowserPackages.find(
            (candidate) =>
                importSpecifier === candidate ||
                importSpecifier.startsWith(`${candidate}/`)
        );

        if (packageName) {
            importedPackages.add(packageName);
        }
    }

    return importedPackages;
}

describe("renderer vendor asset policy", () => {
    it("keeps renderer browser libraries npm-managed and bundled through the renderer entry", () => {
        expect.assertions(6);

        const rootPackage = JSON.parse(
            readWorkspaceFile(rootPackageRepositoryPath)
        ) as PackageJson;
        const staticAppIndex = readWorkspaceFile(rootAppIndexHtmlPath);
        const vendorBundleSource = [
            readWorkspaceFile(appRendererVendorGlobalsCoreEntryPath),
            readWorkspaceFile(appRendererVendorGlobalsEntryPath),
        ].join("\n");
        const browserPackagesInProductionDependencies =
            rendererBrowserPackages.filter(
                (packageName) =>
                    rootPackage.dependencies?.[packageName] !== undefined
            );
        const browserPackagesMissingFromDevDependencies =
            rendererBrowserPackages.filter(
                (packageName) =>
                    rootPackage.devDependencies?.[packageName] === undefined
            );
        const browserPackagesWithInvalidDevDependencyVersions =
            rendererBrowserPackages.filter((packageName) => {
                const version = rootPackage.devDependencies?.[packageName];

                return typeof version !== "string" || version.length === 0;
            });
        const vendorBrowserPackageImports =
            getImportedBrowserPackages(vendorBundleSource);

        expect(browserPackagesMissingFromDevDependencies).toStrictEqual([]);
        expect(browserPackagesWithInvalidDevDependencyVersions).toStrictEqual(
            []
        );
        expect(browserPackagesInProductionDependencies).toStrictEqual([]);
        expect(
            ['from "chart.js/auto"'].filter(
                (importStatement) =>
                    !vendorBundleSource.includes(importStatement)
            )
        ).toStrictEqual([]);
        expect(vendorBrowserPackageImports).toStrictEqual(
            new Set(rendererBrowserPackages)
        );
        expect(staticAppIndex).toContain('src="renderer/vendor-globals.js"');
    });

    it("does not keep package-sourced browser assets in repository vendor trees", () => {
        expect.assertions(4);

        const staticAppIndex = readWorkspaceFile(rootAppIndexHtmlPath);

        expect(getFileExistence([...staleRepositoryVendorPaths])).toStrictEqual(
            Object.fromEntries(
                staleRepositoryVendorPaths.map((vendorPath) => [
                    vendorPath,
                    false,
                ])
            )
        );
        expect(staticAppIndex).toContain('href="renderer/vendor-globals.css"');
        expect(staticAppIndex).not.toContain("node_modules");
        expect(staticAppIndex).not.toContain("vendor/");
    });

    it("keeps upstream CSS npm-managed and JS as a CSP-safe local control", () => {
        expect.assertions(5);

        const rootPackage = JSON.parse(
            readWorkspaceFile(rootPackageRepositoryPath)
        ) as {
            devDependencies?: Record<string, string>;
        };
        const vendorGlobalsCore = readWorkspaceFile(
            appRendererVendorGlobalsCoreEntryPath
        );
        const vendorGlobals = readWorkspaceFile(
            appRendererVendorGlobalsEntryPath
        );
        const measureLite = readWorkspaceFile(appLeafletMeasureLitePath);

        expect(rootPackage.devDependencies?.["leaflet-measure"]).toBe("^3.1.0");
        expect(vendorGlobalsCore).toContain(
            'import "leaflet-measure/dist/leaflet-measure.css";'
        );
        expect(vendorGlobals).toContain('import "./leafletMeasureLite.js";');
        expect(vendorGlobals).not.toContain(
            'import "leaflet-measure/dist/leaflet-measure.js";'
        );
        expect(measureLite).toContain("violates a strict CSP");
    });
});
