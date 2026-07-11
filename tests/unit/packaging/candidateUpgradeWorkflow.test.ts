import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("candidate upgrade workflow", () => {
    it("builds and installs the unsigned Windows candidate over a published release", () => {
        expect.assertions(18);

        const workflow = fs.readFileSync(
            path.join(
                process.cwd(),
                ".github/workflows/candidate-upgrade-smoke.yml"
            ),
            "utf8"
        );

        expect(workflow).toContain("workflow_dispatch:");
        expect(workflow).toContain("from-version:");
        expect(workflow).toContain('"ffv-candidate-upgrade-$env:FROM_VERSION"');
        expect(workflow).toContain("runs-on: windows-latest");
        expect(workflow).toContain("permissions:\n    contents: read");
        expect(workflow).toContain("node-version-file: .node-version");
        expect(workflow).toContain("npm install --global npm@11.16.0");
        expect(workflow).toContain("gh release download");
        expect(workflow).toContain("node scripts/build-package.mjs");
        expect(workflow).toContain("--win nsis");
        expect(workflow).toContain('FFV_FORCE_UNSIGNED_PACKAGE: "true"');
        expect(workflow).toContain('REQUIRE_CODE_SIGNING: "false"');
        expect(workflow).toContain('@("/S", "--updated")');
        expect(workflow).toContain("Fit File Viewer*");
        expect(workflow).toContain("acb439ea-52e6-5f57-a281-e53187b169ce");
        expect(workflow).toContain("d3d1f287-232f-5429-866d-15b2b1d5fbad");
        expect(workflow).toContain("node scripts/run-packaged-smoke.mjs");
        expect(workflow).not.toContain("softprops/action-gh-release");
    });
});
