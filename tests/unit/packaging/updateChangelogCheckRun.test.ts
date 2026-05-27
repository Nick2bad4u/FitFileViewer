import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

type CommandCall = {
    args: string[];
    command: string;
    options: {
        encoding: string;
        input: string;
    };
};
type CommandRunner = (
    command: string,
    args: string[],
    options: CommandCall["options"]
) => string;

type UpdateChangelogCheckRunModule = {
    buildCompleteCheckRunPayload: (options: { jobStatus: string }) => unknown;
    buildCreateCheckRunPayload: (options: { headSha: string }) => unknown;
    buildGeneratedCheckRunPayload: (options: { version: string }) => unknown;
    createChangelogCheckRun: (options: {
        githubEnv: string;
        headSha: string;
        repository: string;
        runCommand: CommandRunner;
    }) => number;
    markChangelogsGenerated: (options: {
        checkId: string;
        repository: string;
        runCommand: CommandRunner;
        version: string;
    }) => void;
    parseArgs: (
        args: string[],
        environment?: Record<string, string | undefined>
    ) => {
        action: string;
        checkId?: string;
        githubEnv?: string;
        headSha?: string;
        help: boolean;
        jobStatus?: string;
        repository: string;
        version?: string;
    };
    resolveCheckRunConclusion: (jobStatus: string) => string;
};

const temporaryRoots: string[] = [];

async function importUpdateChangelogCheckRun(): Promise<UpdateChangelogCheckRunModule> {
    return (await import("../../../scripts/update-changelog-check-run.mjs")) as UpdateChangelogCheckRunModule;
}

function makeTemporaryRoot(): string {
    const temporaryRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), "ffv-changelog-check-run-")
    );

    temporaryRoots.push(temporaryRoot);

    return temporaryRoot;
}

function makeCommandRecorder(output = "{}"): {
    calls: CommandCall[];
    runCommand: CommandRunner;
} {
    const calls: CommandCall[] = [];

    return {
        calls,
        runCommand(command, args, options) {
            calls.push({ args, command, options });
            return output;
        },
    };
}

afterEach(() => {
    for (const temporaryRoot of temporaryRoots.splice(0)) {
        fs.rmSync(temporaryRoot, { force: true, recursive: true });
    }
});

describe("update-changelog-check-run script", () => {
    it("builds the check run payloads", async () => {
        expect.assertions(3);

        const {
            buildCompleteCheckRunPayload,
            buildCreateCheckRunPayload,
            buildGeneratedCheckRunPayload,
        } = await importUpdateChangelogCheckRun();

        expect(buildCreateCheckRunPayload({ headSha: "abc123" })).toStrictEqual(
            {
                head_sha: "abc123",
                name: "Update ChangeLogs",
                output: {
                    summary: "Changelog update in progress",
                    title: "Update ChangeLogs",
                },
                status: "in_progress",
            }
        );
        expect(
            buildGeneratedCheckRunPayload({ version: "30.0.0" })
        ).toStrictEqual({
            output: {
                summary:
                    "Changelogs generated for v30.0.0 and committed to repository",
                title: "Update ChangeLogs",
            },
            status: "in_progress",
        });
        expect(
            buildCompleteCheckRunPayload({ jobStatus: "cancelled" })
        ).toStrictEqual({
            conclusion: "failure",
            output: {
                summary:
                    "Changelog update workflow completed with status: cancelled",
                title: "Update ChangeLogs",
            },
        });
    });

    it("creates a check run and writes CHECKID to the GitHub environment", async () => {
        expect.assertions(5);

        const { createChangelogCheckRun } =
            await importUpdateChangelogCheckRun();
        const githubEnv = path.join(makeTemporaryRoot(), "github-env");
        const { calls, runCommand } = makeCommandRecorder('{"id":12345}');

        expect(
            createChangelogCheckRun({
                githubEnv,
                headSha: "abc123",
                repository: "Nick2bad4u/FitFileViewer",
                runCommand,
            })
        ).toBe(12345);
        expect(fs.readFileSync(githubEnv, "utf8")).toBe("CHECKID=12345\n");
        expect(calls).toHaveLength(1);
        expect(calls[0]?.args).toContain(
            "/repos/Nick2bad4u/FitFileViewer/check-runs"
        );
        expect(JSON.parse(calls[0]?.options.input ?? "{}")).toMatchObject({
            head_sha: "abc123",
            name: "Update ChangeLogs",
        });
    });

    it("updates the generated check run through gh api", async () => {
        expect.assertions(4);

        const { markChangelogsGenerated } =
            await importUpdateChangelogCheckRun();
        const { calls, runCommand } = makeCommandRecorder();

        markChangelogsGenerated({
            checkId: "12345",
            repository: "Nick2bad4u/FitFileViewer",
            runCommand,
            version: "30.0.0",
        });

        expect(calls).toHaveLength(1);
        expect(calls[0]?.args).toContain("-X");
        expect(calls[0]?.args).toContain("PATCH");
        expect(JSON.parse(calls[0]?.options.input ?? "{}")).toStrictEqual({
            output: {
                summary:
                    "Changelogs generated for v30.0.0 and committed to repository",
                title: "Update ChangeLogs",
            },
            status: "in_progress",
        });
    });

    it("parses action-specific CLI arguments and environment defaults", async () => {
        expect.assertions(3);

        const { parseArgs } = await importUpdateChangelogCheckRun();

        expect(
            parseArgs(["create"], {
                GITHUB_ENV: "github.env",
                GITHUB_REPOSITORY: "owner/repo",
                GITHUB_SHA: "abc123",
            })
        ).toStrictEqual({
            action: "create",
            checkId: undefined,
            githubEnv: "github.env",
            headSha: "abc123",
            help: false,
            jobStatus: undefined,
            repository: "owner/repo",
            version: undefined,
        });
        expect(
            parseArgs(
                [
                    "generated",
                    "--repository=owner/repo",
                    "--check-id",
                    "12345",
                    "--version=30.0.0",
                ],
                {}
            )
        ).toStrictEqual({
            action: "generated",
            checkId: "12345",
            githubEnv: undefined,
            headSha: undefined,
            help: false,
            jobStatus: undefined,
            repository: "owner/repo",
            version: "30.0.0",
        });
        expect(() => parseArgs(["create"], {})).toThrow(
            "--repository or GITHUB_REPOSITORY is required"
        );
    });

    it("normalizes non-success job statuses to a failure conclusion", async () => {
        expect.assertions(2);

        const { resolveCheckRunConclusion } =
            await importUpdateChangelogCheckRun();

        expect(resolveCheckRunConclusion("success")).toBe("success");
        expect(resolveCheckRunConclusion("cancelled")).toBe("failure");
    });
});
