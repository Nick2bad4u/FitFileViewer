import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("published upgrade smoke workflow", () => {
    it("upgrades the previous Windows release after successful publication", () => {
        expect.assertions(23);

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
        const upgradeSmoke = readFileSync(
            path.join(process.cwd(), "tests/integration/publishedUpgrade.mts"),
            "utf8"
        );

        expect(workflow).toContain("--startup-timeout-ms 60000");
        expect(workflow).toContain("FFV_SMOKE_EXPECTED_ARCH: x64");
        expect(workflow).toContain(
            "FFV_SMOKE_EXPECTED_VERSION: ${{ env.FFV_UPGRADE_TO_VERSION }}"
        );
        expect(workflow).toContain(
            "FFV_SMOKE_DIAGNOSTICS_DIRECTORY: ${{ runner.temp }}/published-upgrade-smoke"
        );
        expect(workflow).toContain(
            "${{ runner.temp }}/published-upgrade-smoke/"
        );
        expect(workflow).toContain(
            "ref: ${{ github.event.workflow_run.head_sha || github.sha }}"
        );
        expect(workflow).toContain("workflow_run:");
        expect(workflow).toContain(
            'workflows: ["Build and Release Electron App"]'
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
            "tests/integration/publishedUpgrade.mts"
        );
        expect(packageJson.scripts?.["test:upgrade:published"]).toContain(
            "--experimental-strip-types"
        );
        expect(upgradeSmoke).toContain('"/S"');
        expect(upgradeSmoke).toContain(
            "`/D=${configuration.installDirectory}`"
        );
    });
});
