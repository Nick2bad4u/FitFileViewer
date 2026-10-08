import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";

type Step = {
    env?: Record<string, string>;
    if?: string;
    name: string;
    run?: string;
    uses?: string;
    with?: Record<string, unknown>;
};

type Job = {
    "continue-on-error"?: boolean;
    if?: string;
    needs?: string | string[];
    permissions?: Record<string, string>;
    "runs-on"?: string;
    steps?: Step[];
    uses?: string;
    with?: Record<string, string>;
};

function readWorkflow(name: string): { jobs: Record<string, Job> } {
    return parseYaml(
        readFileSync(
            path.join(process.cwd(), ".github/workflows", name),
            "utf8"
        )
    ) as { jobs: Record<string, Job> };
}

describe("Universal DMG native verification workflows", () => {
    it.each([
        {
            file: "Build.yml",
            producer: "build",
            source: "${{ needs.bump-version.outputs.bump_sha }}",
        },
        {
            file: "release-rehearsal.yml",
            producer: "release-rehearsal",
            source: "${{ github.sha }}",
        },
    ])(
        "hands off the exact ARM64-tested DMG separately from release assets in $file",
        ({ file, producer, source }) => {
            expect.assertions(8);
            const { jobs } = readWorkflow(file);
            const steps = jobs[producer]?.steps ?? [];
            const smokeIndex = steps.findIndex(
                (step) =>
                    step.name === "Smoke test installed distributable artifacts"
            );
            const uploadIndex = steps.findIndex(
                (step) =>
                    step.name ===
                    "Upload Universal DMG for required native Intel verification"
            );
            const upload = steps[uploadIndex];
            expect(uploadIndex).toBeGreaterThan(smokeIndex);
            expect(upload?.if).toBe(
                "runner.os == 'macOS' && matrix.arch == 'universal'"
            );
            expect(upload?.with?.name).toBe(
                "universal-native-verification-${{ github.run_attempt }}"
            );
            expect(upload?.with?.path).toContain(
                "release-dist/distributable-smoke-darwin-universal.json"
            );
            expect(upload?.with?.path).toContain(
                "release-dist/Fit-File-Viewer-dmg-universal-*.dmg"
            );
            expect(upload?.with?.path).toContain(
                "release-dist/signing-verification-report.json"
            );
            expect(
                steps.find(
                    (step) =>
                        step.name ===
                        "Record Universal native verification source"
                )?.env?.SOURCE_SHA
            ).toBe(source);
            expect(steps.map((step) => step.run ?? "").join("\n")).not.toMatch(
                /install-rosetta|run-macos-smoke-diagnostics|--include-rosetta/u
            );
        }
    );

    it("requires successful native Intel verification before publishing", () => {
        expect.assertions(7);
        const { jobs } = readWorkflow("Build.yml");
        expect(jobs.release?.needs).toEqual([
            "build",
            "bump-version",
            "verify-universal-intel",
        ]);
        expect(jobs.release?.if).toContain(
            "needs.verify-universal-intel.result == 'success'"
        );
        expect(jobs["verify-universal-intel"]?.needs).toEqual([
            "build",
            "bump-version",
        ]);
        expect(jobs["verify-universal-intel"]?.with).toEqual({
            "expected-version": "${{ needs.bump-version.outputs.new_version }}",
            "source-sha": "${{ needs.bump-version.outputs.bump_sha }}",
        });
        expect(jobs["verify-universal-intel"]).not.toHaveProperty(
            "continue-on-error"
        );
        expect(
            jobs.release?.steps?.find((step) =>
                step.uses?.startsWith("actions/download-artifact@")
            )?.with?.pattern
        ).toBe("dist-*");
        expect(jobs["verify-universal-intel"]?.uses).toBe(
            "./.github/workflows/verify-universal-native-intel.yml"
        );
    });

    it("requires native Intel rehearsal evidence even when another matrix job fails", () => {
        expect.assertions(5);
        const { jobs } = readWorkflow("release-rehearsal.yml");
        const consumer = jobs["verify-universal-intel"];
        expect(consumer?.needs).toBe("release-rehearsal");
        expect(consumer?.if).toBe("always() && !cancelled()");
        expect(consumer?.with?.["source-sha"]).toBe("${{ github.sha }}");
        expect(consumer).not.toHaveProperty("continue-on-error");
        expect(jobs["release-verification"]).not.toHaveProperty("needs");
    });

    it("validates the current run's source and bytes before native x64 and LaunchServices smoke", () => {
        expect.assertions(12);
        const consumer = readWorkflow("verify-universal-native-intel.yml").jobs[
            "native-intel"
        ];
        const steps = consumer?.steps ?? [];
        const verifyIndex = steps.findIndex((step) =>
            step.run?.includes(
                "node scripts/verify-universal-native-source.mjs"
            )
        );
        const smokeIndex = steps.findIndex(
            (step) => step.run === "node scripts/run-distributable-smoke.mjs"
        );
        const download = steps.find((step) =>
            step.uses?.startsWith("actions/download-artifact@")
        );
        expect(consumer?.["runs-on"]).toBe("macos-15-intel");
        expect(
            steps.find((step) => step.uses?.startsWith("actions/checkout@"))
                ?.with?.ref
        ).toBe("${{ inputs.source-sha }}");
        expect(download?.with?.name).toBe(
            "universal-native-verification-${{ github.run_attempt }}"
        );
        expect(download?.with?.["run-id"]).toBe("${{ github.run_id }}");
        expect(download?.with?.["digest-mismatch"]).toBe("error");
        expect(verifyIndex).toBeGreaterThan(-1);
        expect(smokeIndex).toBeGreaterThan(verifyIndex);
        expect(steps[verifyIndex]?.env).toEqual({
            EXPECTED_VERSION: "${{ inputs.expected-version }}",
            SOURCE_SHA: "${{ inputs.source-sha }}",
        });
        expect(steps[smokeIndex]?.env).toEqual({
            FFV_PACKAGED_SMOKE_TIMEOUT_MS: "60000",
            MATRIX_ARCH: "universal",
        });
        expect(steps[smokeIndex]).not.toHaveProperty("continue-on-error");
        expect(steps.at(-1)?.if).toBe("always()");
        expect(steps.at(-1)?.with?.path).toContain(
            "release-dist/smoke-diagnostics/**"
        );
    });
});
