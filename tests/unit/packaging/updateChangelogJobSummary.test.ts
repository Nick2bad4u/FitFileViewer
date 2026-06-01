import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

type UpdateChangelogJobSummaryModule = {
    createChangelogJobSummary: (options: {
        jobStatus: string;
        version: string;
    }) => string;
    parseArgs: (
        args: string[],
        environment?: Record<string, string | undefined>
    ) => {
        githubStepSummary: string;
        help: boolean;
        jobStatus: string;
        version: string;
    };
    updateChangelogJobSummary: (options: {
        githubStepSummary: string;
        jobStatus: string;
        version: string;
    }) => void;
};

const temporaryRoots: string[] = [];

async function importUpdateChangelogJobSummary(): Promise<UpdateChangelogJobSummaryModule> {
    return (await import("../../../scripts/update-changelog-job-summary.mjs")) as UpdateChangelogJobSummaryModule;
}

function makeTemporaryRoot(): string {
    const temporaryRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), "ffv-changelog-job-summary-")
    );

    temporaryRoots.push(temporaryRoot);

    return temporaryRoot;
}

afterEach(() => {
    for (const temporaryRoot of temporaryRoots.splice(0)) {
        fs.rmSync(temporaryRoot, { force: true, recursive: true });
    }
});

describe("update-changelog-job-summary script", () => {
    it("creates the changelog job summary markdown", async () => {
        expect.assertions(1);

        const { createChangelogJobSummary } =
            await importUpdateChangelogJobSummary();

        expect(
            createChangelogJobSummary({
                jobStatus: "success",
                version: "30.0.0",
            })
        ).toBe(
            [
                "## \u{1F4DD} Changelog Update Summary",
                "- **Version**: v30.0.0",
                "- **CHANGELOG.md** generated at the repository root",
                "- **Changes committed** directly to repository (no PR required)",
                "- **Status**: success",
                "",
                "### Files Updated:",
                "- `/CHANGELOG.md`",
                "",
            ].join("\n")
        );
    });

    it("appends the summary to GITHUB_STEP_SUMMARY", async () => {
        expect.assertions(1);

        const { createChangelogJobSummary, updateChangelogJobSummary } =
            await importUpdateChangelogJobSummary();
        const summaryPath = path.join(makeTemporaryRoot(), "summary.md");
        const options = {
            githubStepSummary: summaryPath,
            jobStatus: "failure",
            version: "30.0.0",
        };

        updateChangelogJobSummary(options);

        expect(fs.readFileSync(summaryPath, "utf8")).toBe(
            createChangelogJobSummary(options)
        );
    });

    it("parses CLI arguments and environment defaults", async () => {
        expect.assertions(2);

        const { parseArgs } = await importUpdateChangelogJobSummary();

        expect(
            parseArgs([], {
                CHANGELOG_VERSION: "30.0.0",
                GITHUB_STEP_SUMMARY: "summary.md",
                JOB_STATUS: "success",
            })
        ).toStrictEqual({
            githubStepSummary: "summary.md",
            help: false,
            jobStatus: "success",
            version: "30.0.0",
        });
        expect(
            parseArgs(
                [
                    "--version",
                    "31.0.0",
                    "--job-status=failure",
                    "--github-step-summary=tmp/summary.md",
                ],
                {}
            )
        ).toStrictEqual({
            githubStepSummary: "tmp/summary.md",
            help: false,
            jobStatus: "failure",
            version: "31.0.0",
        });
    });

    it("rejects missing required summary inputs", async () => {
        expect.assertions(1);

        const { parseArgs } = await importUpdateChangelogJobSummary();

        expect(() => parseArgs(["--version=30.0.0"], {})).toThrow(
            "GITHUB_STEP_SUMMARY is required"
        );
    });
});
