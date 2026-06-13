import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
    appLeafletMeasureLitePath,
    appRendererVendorChartDataEntryPath,
    appRendererVendorCoreEntryPath,
    appRendererVendorMapEntryPath,
    appSourceRepositoryPath,
    rootAppIndexHtmlPath,
    rootDocsPath,
    rootPackageRepositoryPath,
    rootStaticAssetsPath,
} from "../../../scripts/lib/workspaces.mjs";

const repositoryRoot = process.cwd();
const rendererImportedBrowserPackages = [
    "@maplibre/maplibre-gl-leaflet",
    "arquero",
    "chart.js",
    "chartjs-adapter-date-fns",
    "chartjs-plugin-zoom",
    "datatables.net-dt",
    "dompurify",
    "jszip",
    "leaflet",
    "leaflet-draw",
    "leaflet-measure",
    "leaflet-minimap",
    "leaflet.fullscreen",
    "leaflet.locatecontrol",
    "maplibre-gl",
    "screenfull",
] as const;
const rendererCompanionBrowserPackages = ["date-fns", "hammerjs"] as const;
const rendererManagedBrowserPackages = [
    ...rendererImportedBrowserPackages,
    ...rendererCompanionBrowserPackages,
] as const;
const rendererDependencyInventoryPath = path.posix.join(
    rootDocsPath,
    "RENDERER_DEPENDENCY_INVENTORY.md"
);

const fromImportSpecifierPattern =
    /^\s*import\s+[^"\n].*?\s+from\s+"([^"]+)";/gmu;
const sideEffectImportSpecifierPattern = /^\s*import\s+"([^"]+)";/gmu;
const dynamicImportSpecifierPattern = /\bimport\("([^"]+)"\)/gmu;
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

function getRequiredPackageEntries(
    entries: Record<string, string> | undefined,
    label: string
): Record<string, string> {
    if (!entries) {
        throw new Error(`Expected package ${label}`);
    }

    return entries;
}

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
        ...source.matchAll(dynamicImportSpecifierPattern),
    ].map((match) => match[1]);

    for (const importSpecifier of importSpecifiers) {
        const packageName = rendererImportedBrowserPackages.find(
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

function getDocumentedBrowserPackages(markdown: string): string[] {
    const browserPackagesSection =
        markdown.match(
            /## Browser Libraries Kept In Dev Dependencies\n(?<section>[\S\s]*?)\n## Tooling And Test Dependencies/u
        )?.groups?.section ?? "";

    return [...browserPackagesSection.matchAll(/^\| `([^`]+)`/gmu)]
        .map((match) => match[1])
        .filter((packageName): packageName is string => Boolean(packageName))
        .sort();
}

describe("renderer vendor asset policy", () => {
    it("keeps renderer browser libraries npm-managed and bundled through the renderer entry", () => {
        expect.assertions(10);

        const rootPackage = JSON.parse(
            readWorkspaceFile(rootPackageRepositoryPath)
        ) as PackageJson;
        const staticAppIndex = readWorkspaceFile(rootAppIndexHtmlPath);
        const dependencyInventory = readWorkspaceFile(
            rendererDependencyInventoryPath
        );
        const vendorBundleSource = [
            readWorkspaceFile(appRendererVendorChartDataEntryPath),
            readWorkspaceFile(appRendererVendorCoreEntryPath),
            readWorkspaceFile(appRendererVendorMapEntryPath),
        ].join("\n");
        const browserPackagesInProductionDependencies =
            rendererManagedBrowserPackages.filter(
                (packageName) =>
                    rootPackage.dependencies?.[packageName] !== undefined
            );
        const browserPackagesMissingFromDevDependencies =
            rendererManagedBrowserPackages.filter(
                (packageName) =>
                    rootPackage.devDependencies?.[packageName] === undefined
            );
        const browserPackagesWithInvalidDevDependencyVersions =
            rendererManagedBrowserPackages.filter((packageName) => {
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
            new Set(rendererImportedBrowserPackages)
        );
        expect(getDocumentedBrowserPackages(dependencyInventory)).toStrictEqual(
            [...rendererManagedBrowserPackages].sort()
        );
        expect(staticAppIndex).not.toContain(
            'src="renderer/vendor-globals-core.js"'
        );
        expect(staticAppIndex).not.toContain(
            'src="renderer/vendor-globals-chart-data.js"'
        );
        expect(staticAppIndex).not.toContain(
            'src="renderer/vendor-globals-map.js"'
        );
        expect(staticAppIndex).not.toContain(
            'src="renderer/vendor-globals.js"'
        );
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
        expect.assertions(6);

        const rootPackage = JSON.parse(
            readWorkspaceFile(rootPackageRepositoryPath)
        ) as {
            devDependencies?: Record<string, string>;
        };
        const rendererVendorMap = readWorkspaceFile(
            appRendererVendorMapEntryPath
        );
        const measureLite = readWorkspaceFile(appLeafletMeasureLitePath);

        expect(
            getRequiredPackageEntries(
                rootPackage.devDependencies,
                "devDependencies"
            )["leaflet-measure"]
        ).toStrictEqual(expect.stringMatching(/\S/u));
        expect(rendererVendorMap).toContain(
            'import "leaflet-measure/dist/leaflet-measure.css";'
        );
        expect(rendererVendorMap).toContain(
            'import { installLeafletMeasureLite } from "./leafletMeasureLite.js";'
        );
        expect(rendererVendorMap).toContain(
            "installLeafletMeasureLite(Leaflet);"
        );
        expect(rendererVendorMap).not.toContain(
            'import "leaflet-measure/dist/leaflet-measure.js";'
        );
        expect(measureLite).toContain("violates a strict CSP");
    });
});
