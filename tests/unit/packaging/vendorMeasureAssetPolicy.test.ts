import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const repositoryRoot = process.cwd();

function readWorkspaceFile(relativePath: string): string {
    return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

describe("leaflet measure asset policy", () => {
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
