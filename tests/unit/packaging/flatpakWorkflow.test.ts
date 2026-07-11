import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("Flatpak workflow", () => {
    it("uses the supported toolchain and explicitly prepares Electron", () => {
        expect.assertions(5);

        const workflow = readFileSync(
            path.join(process.cwd(), ".github/workflows/flatpak-build.yml"),
            "utf8"
        );
        const packageJson = JSON.parse(
            readFileSync(path.join(process.cwd(), "package.json"), "utf8")
        ) as { scripts?: Record<string, string> };

        expect(workflow).toContain("node-version-file: .node-version");
        expect(workflow).toContain("npm install --global npm@11.16.0");
        expect(workflow).not.toContain('node-version: "20"');
        expect(workflow).toContain("npm run build:flatpak");
        expect(packageJson.scripts?.["build:flatpak"]).toBe(
            "npm run prepare:electron && npm run build:runtime-ts && node scripts/build-flatpak.mjs"
        );
    });
});
