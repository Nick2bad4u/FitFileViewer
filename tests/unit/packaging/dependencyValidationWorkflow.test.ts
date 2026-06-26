import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const dependencyValidationWorkflowPath = path.join(
    process.cwd(),
    ".github",
    "workflows",
    "dependency-validation.yml"
);
const developmentGuidePath = path.join(
    process.cwd(),
    "docs",
    "DEVELOPMENT_GUIDE.md"
);

function readDependencyValidationWorkflow(): string {
    return readFileSync(dependencyValidationWorkflowPath, "utf8");
}

describe("dependency validation workflow", () => {
    it("uploads release gate diagnostics when dependency validation fails", () => {
        expect.assertions(54);

        const workflow = readDependencyValidationWorkflow();
        const developmentGuide = readFileSync(developmentGuidePath, "utf8");

        expect(workflow).toContain("schedule:");
        expect(workflow).toContain('- cron: "23 9 * * 1"');
        expect(workflow).toContain("pull_request:");
        expect(workflow).toContain("merge_group:");
        expect(workflow).toContain("workflow_dispatch:");
        expect(workflow).toContain('"package.json"');
        expect(workflow).toContain('"package-lock.json"');
        expect(workflow).toContain('"docusaurus/package.json"');
        expect(workflow).toContain('"docusaurus/package-lock.json"');
        expect(workflow).toContain('".github/dependabot.yml"');
        expect(workflow).toContain(
            '".github/workflows/dependency-validation.yml"'
        );
        expect(workflow).toContain("timeout-minutes: 60");
        expect(workflow).toContain("node-version: 24");
        expect(workflow).toContain(
            "tee artifacts/dependency-validation/npm-ci-app.log"
        );
        expect(workflow).toContain(
            "tee artifacts/dependency-validation/npm-ci-docusaurus.log"
        );
        expect(workflow).toContain("xvfb-run -a npm run release:verify");
        expect(workflow).toContain("set -o pipefail");
        expect(workflow).toContain(
            "tee artifacts/dependency-validation/release-verify.log"
        );
        expect(workflow).toContain("Verify unsigned package artifacts");
        expect(workflow).toContain("test -d release-dist");
        expect(workflow).toContain(
            'test -n "$(find release-dist -type f -print -quit)"'
        );
        expect(workflow).toContain(
            "node --version > artifacts/dependency-validation/node-version.txt"
        );
        expect(workflow).toContain(
            "npm --version > artifacts/dependency-validation/npm-version.txt"
        );
        expect(workflow).toContain("git status --short");
        expect(workflow).toContain(
            "cp package.json artifacts/dependency-validation/package.json"
        );
        expect(workflow).toContain(
            "cp package-lock.json artifacts/dependency-validation/package-lock.json"
        );
        expect(workflow).toContain(
            "cp docusaurus/package.json artifacts/dependency-validation/docusaurus-package.json"
        );
        expect(workflow).toContain(
            "cp docusaurus/package-lock.json artifacts/dependency-validation/docusaurus-package-lock.json"
        );
        expect(workflow).toContain("npm ls --all");
        expect(workflow).toContain("npm --prefix docusaurus ls --all");
        expect(workflow).toContain("npm run release:list-release-dist-files");
        expect(workflow).toContain(
            "cp -R release-dist artifacts/dependency-validation/release-dist"
        );
        expect(workflow).toContain(
            "find dist -maxdepth 3 -type f | sort > artifacts/dependency-validation/dist-files.txt"
        );
        expect(workflow).toContain("root-artifacts-files.txt");
        expect(workflow).toContain(
            "artifacts/dependency-validation/root-artifacts/"
        );
        expect(workflow).toContain("cp -R test-results");
        expect(workflow).toContain("cp -R playwright-report");
        expect(workflow).toContain(
            "Summarize dependency validation diagnostics"
        );
        expect(workflow).toContain("GITHUB_STEP_SUMMARY");
        expect(workflow).toContain("The failed dependency rehearsal uploaded");
        expect(workflow).toContain("### Captured logs");
        expect(workflow).toContain("### App install tail");
        expect(workflow).toContain(
            "tail -n 40 artifacts/dependency-validation/npm-ci-app.log"
        );
        expect(workflow).toContain("### Docs install tail");
        expect(workflow).toContain(
            "tail -n 40 artifacts/dependency-validation/npm-ci-docusaurus.log"
        );
        expect(workflow).toContain("### Release verification tail");
        expect(workflow).toContain(
            "tail -n 80 artifacts/dependency-validation/release-verify.log"
        );
        expect(workflow).toContain("### Root artifact inventory");
        expect(workflow).toContain("if: failure()");
        expect(workflow).toContain("name: dependency-validation-diagnostics");

        expect(developmentGuide).toContain("### Dependency Validation");
        expect(developmentGuide).toContain("runs `npm run release:verify`");
        expect(developmentGuide).toContain(
            "Dependency pull requests that change root or Docusaurus manifests"
        );
        expect(developmentGuide).toContain(
            "release gate and package smoke coverage"
        );
    });
});
