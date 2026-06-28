import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const buildWin7WorkflowPath = path.join(
    process.cwd(),
    ".github",
    "workflows",
    "build-win7.yml"
);
const developmentGuidePath = path.join(
    process.cwd(),
    "docs",
    "DEVELOPMENT_GUIDE.md"
);

function readBuildWin7Workflow(): string {
    return readFileSync(buildWin7WorkflowPath, "utf8");
}

describe("Windows 7 compatibility workflow", () => {
    it("carries forward legacy assets without rebuilding the current app", () => {
        expect.assertions(24);

        const workflow = readBuildWin7Workflow();
        const developmentGuide = readFileSync(developmentGuidePath, "utf8");

        expect(workflow).toContain(
            "name: Carry Forward Windows 7 Compatibility Artifact"
        );
        expect(workflow).toContain("workflow_dispatch:");
        expect(workflow).toContain("workflow_run:");
        expect(workflow).toContain(
            'workflows: ["Build And Release Electron App"]'
        );
        expect(workflow).toContain("conclusion == 'success'");
        expect(workflow).toContain("runs-on: ubuntu-latest");
        expect(workflow).toContain("timeout-minutes: 15");
        expect(workflow).toContain("gh release list");
        expect(workflow).toContain("gh release view");
        expect(workflow).toContain(
            'Where-Object { $_.name -like "Fit-File-Viewer-win7-*" }'
        );
        expect(workflow).toContain(
            "The Windows 7 source release cannot be the same as the target release"
        );
        expect(workflow).toContain("gh release download");
        expect(workflow).toContain("legacy-win7-assets");
        expect(workflow).toContain("gh release upload");
        expect(workflow).toContain("Carried forward");
        expect(workflow).not.toContain("actions/checkout");
        expect(workflow).not.toContain("actions/setup-node");
        expect(workflow).not.toContain("npm ci");
        expect(workflow).not.toContain("npm install");
        expect(workflow).not.toContain("npm run package");
        expect(workflow).not.toContain("build-package.mjs");
        expect(workflow).not.toContain("electron-builder");
        expect(developmentGuide).toContain(
            "Current releases do not rebuild a Windows 7 binary"
        );
        expect(developmentGuide).toContain(
            "Treat the snapshot as a legacy convenience"
        );
    });
});
