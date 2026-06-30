import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const performanceBaselineWorkflowPath = path.join(
    process.cwd(),
    ".github",
    "workflows",
    "performance-baseline.yml"
);

function readPerformanceBaselineWorkflow(): string {
    return readFileSync(performanceBaselineWorkflowPath, "utf8");
}

describe("performance baseline workflow", () => {
    it("restores a trusted baseline, compares trends, and uploads diagnostics", () => {
        expect.assertions(20);

        const workflow = readPerformanceBaselineWorkflow();

        expect(workflow).toContain("name: Performance Baseline");
        expect(workflow).toContain("schedule:");
        expect(workflow).toContain("workflow_dispatch:");
        expect(workflow).toContain("threshold-percent:");
        expect(workflow).toContain("runs-on: ubuntu-latest");
        expect(workflow).toContain("node-version-file: .node-version");
        expect(workflow).toContain("npm ci --no-audit --no-fund");
        expect(workflow).toContain("actions/cache@");
        expect(workflow).toContain(
            "artifacts/performance-baseline-cache/performance-baseline.json"
        );
        expect(workflow).toContain(
            "performance-baseline-${{ runner.os }}-${{ github.ref_name }}-${{ github.run_id }}"
        );
        expect(workflow).toContain("restore-keys:");
        expect(workflow).toContain(
            "artifacts/performance-baseline.previous.json"
        );
        expect(workflow).toContain("xvfb-run -a npm run perf:trend");
        expect(workflow).toContain(
            '--threshold-percent "$PERF_REGRESSION_THRESHOLD_PERCENT"'
        );
        expect(workflow).toContain("set -o pipefail");
        expect(workflow).toContain("tee artifacts/performance-baseline.log");
        expect(workflow).toContain("actions/upload-artifact@");
        expect(workflow).toContain("if: always()");
        expect(workflow).toContain("performance-baseline-${{ runner.os }}");
        expect(workflow).toContain("if-no-files-found: warn");
    });
});
