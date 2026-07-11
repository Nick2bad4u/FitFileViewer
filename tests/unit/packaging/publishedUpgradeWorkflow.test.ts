import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("published upgrade smoke workflow", () => {
    it("upgrades the previous Windows release after successful publication", () => {
        expect.assertions(14);

        const workflow = readFileSync(
            path.join(
                process.cwd(),
                ".github/workflows/published-upgrade-smoke.yml"
            ),
            "utf8"
        );
        const packageJson = JSON.parse(
            readFileSync(path.join(process.cwd(), "package.json"), "utf8")
        ) as { scripts?: Record<string, string> };

        expect(workflow).toContain("workflow_run:");
        expect(workflow).toContain(
            'workflows: ["Build And Release Electron App"]'
        );
        expect(workflow).toContain(
            "github.event.workflow_run.conclusion == 'success'"
        );
        expect(workflow).toContain("runs-on: windows-latest");
        expect(workflow).toContain("timeout-minutes: 35");
        expect(workflow).toContain("npm ci --ignore-scripts");
        expect(workflow).toContain("Fit-File-Viewer-nsis-x64-");
        expect(workflow).toContain("npm run test:upgrade:published");
        expect(workflow).toContain("Verify upgraded installation");
        expect(workflow).toContain("Unexpected Windows product version");
        expect(workflow).toContain(
            "Expected one Fit File Viewer uninstall entry"
        );
        expect(workflow).toContain("Smoke test upgraded executable");
        expect(workflow).toContain("Collect upgrade diagnostics");
        expect(packageJson.scripts?.["test:upgrade:published"]).toContain(
            "tests/playwright/published-upgrade.spec.ts"
        );
    });
});
