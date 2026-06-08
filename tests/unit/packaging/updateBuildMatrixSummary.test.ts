import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

type UpdateBuildMatrixSummaryModule = {
    createBuildMatrixSummaryRow: (options: {
        arch: string;
        buildOutcome?: string;
        jobStatus: string;
        matrixOs: string;
        packagedSmokeOutcome?: string;
        signingVerificationOutcome?: string;
        version: string;
    }) => string;
    parseArgs: (
        args: string[],
        environment?: Record<string, string | undefined>
    ) => {
        arch: string;
        buildOutcome?: string;
        githubStepSummary: string;
        help: boolean;
        jobStatus: string;
        matrixOs: string;
        packagedSmokeOutcome?: string;
        signingVerificationOutcome?: string;
        version: string;
    };
    resolveBuildStatus: (
        jobStatus: string,
        buildOutcome?: string,
        packagedSmokeOutcome?: string,
        signingVerificationOutcome?: string
    ) => string;
    resolveSigningVerificationStatus: (
        signingVerificationOutcome?: string
    ) => string;
    updateBuildMatrixSummary: (options: {
        arch: string;
        buildOutcome?: string;
        githubStepSummary: string;
        jobStatus: string;
        matrixOs: string;
        packagedSmokeOutcome?: string;
        signingVerificationOutcome?: string;
        version: string;
    }) => void;
};

const temporaryRoots: string[] = [];

async function importUpdateBuildMatrixSummary(): Promise<UpdateBuildMatrixSummaryModule> {
    return (await import("../../../scripts/update-build-matrix-summary.mjs")) as UpdateBuildMatrixSummaryModule;
}

function makeTemporaryRoot(): string {
    const temporaryRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), "ffv-build-matrix-summary-")
    );

    temporaryRoots.push(temporaryRoot);

    return temporaryRoot;
}

afterEach(() => {
    for (const temporaryRoot of temporaryRoots.splice(0)) {
        fs.rmSync(temporaryRoot, { force: true, recursive: true });
    }
});

describe("update-build-matrix-summary script", () => {
    it("normalizes the build status from build, smoke, and signing outcomes", async () => {
        expect.assertions(5);

        const { resolveBuildStatus } = await importUpdateBuildMatrixSummary();

        expect(
            resolveBuildStatus("cancelled", "failure", "success", "success")
        ).toBe("failure");
        expect(
            resolveBuildStatus("failure", "success", "failure", "success")
        ).toBe("failure");
        expect(
            resolveBuildStatus("failure", "success", "success", "failure")
        ).toBe("failure");
        expect(
            resolveBuildStatus("failure", "success", "success", "success")
        ).toBe("success");
        expect(
            resolveBuildStatus("cancelled", "skipped", "skipped", "skipped")
        ).toBe("cancelled");
    });

    it("creates the build matrix summary row", async () => {
        expect.assertions(1);

        const { createBuildMatrixSummaryRow } =
            await importUpdateBuildMatrixSummary();

        expect(
            createBuildMatrixSummaryRow({
                arch: "x64",
                buildOutcome: "success",
                jobStatus: "failure",
                matrixOs: "windows-latest",
                packagedSmokeOutcome: "success",
                signingVerificationOutcome: "success",
                version: "30.0.0",
            })
        ).toBe(
            "| 30.0.0 | windows-latest | x64 | Build Status: success | Signing Verification: success |"
        );
    });

    it("marks unsigned platform summary rows as signing not run", async () => {
        expect.assertions(2);

        const {
            createBuildMatrixSummaryRow,
            resolveSigningVerificationStatus,
        } = await importUpdateBuildMatrixSummary();

        expect(resolveSigningVerificationStatus()).toBe("not run");
        expect(
            createBuildMatrixSummaryRow({
                arch: "x64",
                buildOutcome: "success",
                jobStatus: "success",
                matrixOs: "ubuntu-latest",
                packagedSmokeOutcome: "success",
                version: "30.0.0",
            })
        ).toContain("Signing Verification: not run");
    });

    it("appends the summary row to GITHUB_STEP_SUMMARY", async () => {
        expect.assertions(1);

        const { updateBuildMatrixSummary } =
            await importUpdateBuildMatrixSummary();
        const summaryPath = path.join(makeTemporaryRoot(), "summary.md");

        updateBuildMatrixSummary({
            arch: "arm64",
            buildOutcome: "failure",
            githubStepSummary: summaryPath,
            jobStatus: "success",
            matrixOs: "macos-15",
            packagedSmokeOutcome: "success",
            signingVerificationOutcome: "failure",
            version: "30.0.0",
        });

        expect(fs.readFileSync(summaryPath, "utf8")).toBe(
            "| 30.0.0 | macos-15 | arm64 | Build Status: failure | Signing Verification: failure |\n"
        );
    });

    it("parses CLI arguments and environment defaults", async () => {
        expect.assertions(2);

        const { parseArgs } = await importUpdateBuildMatrixSummary();

        expect(
            parseArgs([], {
                BUILD_APP_OUTCOME: "success",
                BUILD_VERSION: "30.0.0",
                GITHUB_STEP_SUMMARY: "summary.md",
                JOB_STATUS: "failure",
                MATRIX_ARCH: "x64",
                MATRIX_OS: "windows-latest",
                PACKAGED_SMOKE_OUTCOME: "success",
                SIGNING_VERIFICATION_OUTCOME: "success",
            })
        ).toStrictEqual({
            arch: "x64",
            buildOutcome: "success",
            githubStepSummary: "summary.md",
            help: false,
            jobStatus: "failure",
            matrixOs: "windows-latest",
            packagedSmokeOutcome: "success",
            signingVerificationOutcome: "success",
            version: "30.0.0",
        });
        expect(
            parseArgs(
                [
                    "--version=31.0.0",
                    "--matrix-os",
                    "ubuntu-latest",
                    "--arch=x64",
                    "--job-status",
                    "success",
                    "--build-outcome=failure",
                    "--packaged-smoke-outcome",
                    "success",
                    "--signing-verification-outcome=skipped",
                    "--github-step-summary",
                    "tmp/summary.md",
                ],
                {}
            )
        ).toStrictEqual({
            arch: "x64",
            buildOutcome: "failure",
            githubStepSummary: "tmp/summary.md",
            help: false,
            jobStatus: "success",
            matrixOs: "ubuntu-latest",
            packagedSmokeOutcome: "success",
            signingVerificationOutcome: "skipped",
            version: "31.0.0",
        });
    });

    it("rejects missing required summary inputs", async () => {
        expect.assertions(1);

        const { parseArgs } = await importUpdateBuildMatrixSummary();

        expect(() => parseArgs(["--version=30.0.0"], {})).toThrow(
            "--arch or MATRIX_ARCH is required"
        );
    });
});
