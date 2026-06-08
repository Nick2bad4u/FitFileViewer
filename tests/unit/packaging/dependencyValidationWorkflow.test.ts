import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const dependencyValidationWorkflowPath = path.join(
    process.cwd(),
    ".github",
    "workflows",
    "dependency-validation.yml"
);

function readDependencyValidationWorkflow(): string {
    return readFileSync(dependencyValidationWorkflowPath, "utf8");
}

describe("dependency validation workflow", () => {
    it("uploads release gate diagnostics when dependency validation fails", () => {
        expect.assertions(13);

        const workflow = readDependencyValidationWorkflow();

        expect(workflow).toContain("schedule:");
        expect(workflow).toContain("workflow_dispatch:");
        expect(workflow).toContain("xvfb-run -a npm run release:verify");
        expect(workflow).toContain("set -o pipefail");
        expect(workflow).toContain(
            "tee artifacts/dependency-validation/release-verify.log"
        );
        expect(workflow).toContain("git status --short");
        expect(workflow).toContain("npm ls --all");
        expect(workflow).toContain("npm --prefix docusaurus ls --all");
        expect(workflow).toContain("npm run release:list-release-dist-files");
        expect(workflow).toContain("cp -R test-results");
        expect(workflow).toContain("cp -R playwright-report");
        expect(workflow).toContain("if: failure()");
        expect(workflow).toContain("name: dependency-validation-diagnostics");
    });
});
