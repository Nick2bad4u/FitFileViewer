import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const releaseRehearsalWorkflowPath = path.join(
    process.cwd(),
    ".github",
    "workflows",
    "release-rehearsal.yml"
);

function readReleaseRehearsalWorkflow(): string {
    return readFileSync(releaseRehearsalWorkflowPath, "utf8");
}

describe("release rehearsal workflow", () => {
    it("runs the release gate, signing preflight, packaged smoke, and artifact upload without publishing", () => {
        expect.assertions(24);

        const workflow = readReleaseRehearsalWorkflow();

        expect(workflow).toContain("workflow_dispatch:");
        expect(workflow).toContain("require-code-signing:");
        expect(workflow).toContain("smoke-timeout-ms:");
        expect(workflow).toContain("fail-fast:");
        expect(workflow).toContain(
            "Cancel remaining platform rehearsals after the first failure"
        );
        expect(workflow).toContain(
            "fail-fast: ${{ inputs.fail-fast == 'true' }}"
        );
        expect(workflow).toContain("os: ubuntu-latest");
        expect(workflow).toContain("os: windows-latest");
        expect(workflow).toContain("os: macos-latest");
        expect(workflow).toContain("runner-os: Linux");
        expect(workflow).toContain("runner-os: Windows");
        expect(workflow).toContain("runner-os: macOS");
        expect(workflow).toContain("if: runner.os == 'Linux'");
        expect(workflow).toContain("npm run release:check-signing");
        expect(workflow).toContain('--runner-os "${{ matrix.runner-os }}"');
        expect(workflow).toContain("xvfb-run -a npm run release:verify");
        expect(workflow).toContain(
            "release-verify-command: npm run release:verify"
        );
        expect(workflow).toContain("FFV_PACKAGED_SMOKE_TIMEOUT_MS:");
        expect(workflow).toContain("npm run release:list-release-dist-files");
        expect(workflow).toContain('REQUIRE_CODE_SIGNING: "false"');
        expect(workflow).toContain("actions/upload-artifact@");
        expect(workflow).toContain(
            "name: release-rehearsal-${{ matrix.runner-os }}"
        );
        expect(workflow).toContain("path: release-dist/**");
        expect(workflow).not.toContain("softprops/action-gh-release");
    });
});
