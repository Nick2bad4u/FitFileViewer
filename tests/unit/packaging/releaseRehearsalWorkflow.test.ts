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
        expect.assertions(8);

        const workflow = readReleaseRehearsalWorkflow();

        expect(workflow).toContain("workflow_dispatch:");
        expect(workflow).toContain("require-code-signing:");
        expect(workflow).toContain("npm run release:check-signing");
        expect(workflow).toContain("xvfb-run -a npm run release:verify");
        expect(workflow).toContain('REQUIRE_CODE_SIGNING: "false"');
        expect(workflow).toContain("actions/upload-artifact@");
        expect(workflow).toContain("path: release-dist/**");
        expect(workflow).not.toContain("softprops/action-gh-release");
    });
});
