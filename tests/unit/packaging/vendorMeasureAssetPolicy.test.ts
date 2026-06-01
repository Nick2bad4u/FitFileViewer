import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

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
            readWorkspaceFile("package.json")
        ) as PackageJson;
        const staticAppIndex = readWorkspaceFile("static/app/index.html");
        const vendorBundleSource = [
            readWorkspaceFile("electron-app/renderer/vendorGlobalsCore.ts"),
            readWorkspaceFile("electron-app/renderer/vendorGlobals.ts"),
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
        expect(vendorBundleSource).toEqual(
            expect.stringContaining('from "chart.js/auto"')
        );
        expect(vendorBrowserPackageImports).toStrictEqual(
            new Set(rendererBrowserPackages)
        );
        expect(staticAppIndex).toContain('src="renderer/vendor-globals.js"');
    });

    it("does not keep package-sourced browser assets in repository vendor trees", () => {
        expect.assertions(4);

        const staticAppIndex = readWorkspaceFile("static/app/index.html");

        expect(
            getFileExistence([
                "electron-app/renderer/vendor",
                "electron-app/vendor",
                "static/app/vendor",
                "static/vendor",
            ])
        ).toStrictEqual({
            "electron-app/renderer/vendor": false,
            "electron-app/vendor": false,
            "static/app/vendor": false,
            "static/vendor": false,
        });
        expect(staticAppIndex).toContain('href="renderer/vendor-globals.css"');
        expect(staticAppIndex).not.toContain("node_modules");
        expect(staticAppIndex).not.toContain("vendor/");
    });

    it("keeps upstream CSS npm-managed and JS as a CSP-safe local control", () => {
        expect.assertions(5);

        const rootPackage = JSON.parse(readWorkspaceFile("package.json")) as {
            devDependencies?: Record<string, string>;
        };
        const vendorGlobalsCore = readWorkspaceFile(
            "electron-app/renderer/vendorGlobalsCore.ts"
        );
        const vendorGlobals = readWorkspaceFile(
            "electron-app/renderer/vendorGlobals.ts"
        );
        const measureLite = readWorkspaceFile(
            "electron-app/renderer/leafletMeasureLite.js"
        );

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
