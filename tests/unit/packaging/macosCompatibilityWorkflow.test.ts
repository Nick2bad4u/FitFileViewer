import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";

type WorkflowStep = {
    env?: Record<string, string>;
    if?: string;
    name: string;
    run?: string;
    uses?: string;
    with?: Record<string, unknown>;
};

const workflow = parseYaml(
    readFileSync(
        path.join(
            process.cwd(),
            ".github/workflows/macos-compatibility-smoke.yml"
        ),
        "utf8"
    )
) as {
    jobs: {
        compatibility: {
            "runs-on": string;
            steps: WorkflowStep[];
        };
    };
    on: Record<string, unknown>;
    permissions: Record<string, string>;
};

const { compatibility } = workflow.jobs;

describe("macOS compatibility workflow", () => {
    it("validates same-repository rehearsal provenance before checking out its source", () => {
        expect.assertions(11);
        const provenanceIndex = compatibility.steps.findIndex(
            (step) => step.name === "Validate rehearsal artifact provenance"
        );
        const provenance = compatibility.steps[provenanceIndex];
        const checkoutIndex = compatibility.steps.findIndex((step) =>
            step.uses?.startsWith("actions/checkout@")
        );
        const checkout = compatibility.steps[checkoutIndex];
        expect(Object.keys(workflow.on)).toEqual([
            "workflow_call",
            "workflow_dispatch",
        ]);
        expect(workflow.permissions).toEqual({
            actions: "read",
            contents: "read",
        });
        expect(provenance?.run).toContain("^[1-9][0-9]*$");
        expect(provenance?.run).toContain(
            '.path == ".github/workflows/release-rehearsal.yml"'
        );
        expect(provenance?.run).toContain('.event == "workflow_dispatch"');
        expect(provenance?.run).toContain(
            ".head_repository.full_name == $repo"
        );
        expect(provenance?.run).toContain('.conclusion == "success"');
        expect(provenance?.run).toContain(
            ".workflow_run.id == $run and .workflow_run.head_sha == $sha"
        );
        expect(checkout?.with?.ref).toBe("${{ steps.source.outputs.sha }}");
        expect(checkout?.with?.["persist-credentials"]).toBe(false);
        expect(provenanceIndex).toBeLessThan(checkoutIndex);
    });

    it("downloads the immutable artifact and checks the original tested DMG hash", () => {
        expect.assertions(5);
        const download = compatibility.steps.find((step) =>
            step.uses?.startsWith("actions/download-artifact@")
        );
        const verify = compatibility.steps.find((step) =>
            step.name.startsWith("Verify DMG")
        );
        expect(download?.with?.["artifact-ids"]).toBe(
            "${{ steps.source.outputs.artifact-id }}"
        );
        expect(download?.with?.["digest-mismatch"]).toBe("error");
        expect(verify?.run).toContain(".signatureVerified == true");
        expect(verify?.run).toContain(".launchServicesVerified == true");
        expect(verify?.run).toContain('[[ "$actual" == "$expected" ]]');
    });

    it("tests existing DMG on macOS 27 and preserves evidence without building or publishing", () => {
        expect.assertions(7);
        const commands = compatibility.steps
            .map((step) => step.run ?? "")
            .join("\n");
        const smoke = compatibility.steps.find((step) =>
            step.run?.includes("node scripts/run-distributable-smoke.mjs")
        );
        const upload = compatibility.steps.find((step) =>
            step.uses?.startsWith("actions/upload-artifact@")
        );
        expect(compatibility["runs-on"]).toBe("xcode-27");
        expect(smoke?.env?.MATRIX_ARCH).toBe("arm64");
        expect(commands).not.toMatch(/npm (?:ci|install|run build)|--publish/u);
        expect(commands).toContain("sw_vers");
        expect(upload?.if).toBe("always()");
        expect(upload?.with?.path).toContain(
            "release-dist/smoke-diagnostics/**"
        );
        expect(upload?.with?.path).toContain(
            "${{ runner.temp }}/ffv-macos-compatibility/**"
        );
    });
});
