import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

type UpdateReleaseJobSummaryModule = {
    createReleaseJobSummary: (options: { jobStatus: string }) => string;
    parseArgs: (
        args: string[],
        environment?: Record<string, string | undefined>
    ) => {
        githubStepSummary: string;
        help: boolean;
        jobStatus: string;
    };
    updateReleaseJobSummary: (options: {
        githubStepSummary: string;
        jobStatus: string;
    }) => void;
};

const temporaryRoots: string[] = [];

async function importUpdateReleaseJobSummary(): Promise<UpdateReleaseJobSummaryModule> {
    return (await import("../../../../scripts/update-release-job-summary.mjs")) as UpdateReleaseJobSummaryModule;
}

function makeTemporaryRoot(): string {
    const temporaryRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), "ffv-release-job-summary-")
    );

    temporaryRoots.push(temporaryRoot);

    return temporaryRoot;
}

afterEach(() => {
    for (const temporaryRoot of temporaryRoots.splice(0)) {
        fs.rmSync(temporaryRoot, { force: true, recursive: true });
    }
});

describe("update-release-job-summary script", () => {
    it("creates the release job summary markdown", async () => {
        expect.assertions(1);

        const { createReleaseJobSummary } =
            await importUpdateReleaseJobSummary();

        expect(createReleaseJobSummary({ jobStatus: "success" })).toBe(
            [
                "## \u{1F3D7}\uFE0F Build and Release Electron App Workflow Summary",
                "",
                "See above for the full build matrix results.",
                "---",
                "- **Version bump and tagging** performed for electron-app.",
                "- **Builds executed** for multiple OS and architectures.",
                "- **Build artifacts uploaded** for each platform.",
                "- **Release created** if build and version bump succeeded.",
                "- **Changelogs will be updated** and committed directly to the repository.",
                "- Workflow completed with status: success",
                "",
            ].join("\n")
        );
    });

    it("appends the summary to GITHUB_STEP_SUMMARY", async () => {
        expect.assertions(1);

        const { updateReleaseJobSummary } =
            await importUpdateReleaseJobSummary();
        const summaryPath = path.join(makeTemporaryRoot(), "summary.md");

        updateReleaseJobSummary({
            githubStepSummary: summaryPath,
            jobStatus: "failure",
        });

        expect(fs.readFileSync(summaryPath, "utf8")).toContain(
            "- Workflow completed with status: failure\n"
        );
    });

    it("parses CLI arguments and environment defaults", async () => {
        expect.assertions(2);

        const { parseArgs } = await importUpdateReleaseJobSummary();

        expect(
            parseArgs([], {
                GITHUB_STEP_SUMMARY: "summary.md",
                JOB_STATUS: "success",
            })
        ).toStrictEqual({
            githubStepSummary: "summary.md",
            help: false,
            jobStatus: "success",
        });
        expect(
            parseArgs(
                [
                    "--job-status",
                    "failure",
                    "--github-step-summary=tmp/summary.md",
                ],
                {}
            )
        ).toStrictEqual({
            githubStepSummary: "tmp/summary.md",
            help: false,
            jobStatus: "failure",
        });
    });

    it("rejects missing required summary inputs", async () => {
        expect.assertions(1);

        const { parseArgs } = await importUpdateReleaseJobSummary();

        expect(() => parseArgs(["--job-status=success"], {})).toThrow(
            "GITHUB_STEP_SUMMARY is required"
        );
    });
});
