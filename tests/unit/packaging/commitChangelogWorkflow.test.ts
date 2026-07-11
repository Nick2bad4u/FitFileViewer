import path from "node:path";

import { describe, expect, it } from "vitest";

import {
    repositoryRoot,
    rootChangelogPath,
} from "../../../scripts/lib/workspaces.mjs";

type CommandCall = {
    args: string[];
    command: string;
    options: {
        cwd: string;
        stdio: "inherit";
    };
};
type CommandResult = {
    error?: Error;
    status?: number;
};
type CommandRunner = (
    command: string,
    args: string[],
    options: CommandCall["options"]
) => CommandResult;
type CommitChangelogWorkflowModule = {
    commitChangelogWorkflow: (options: {
        cwd?: string;
        log?: (message: string) => void;
        runCommand: CommandRunner;
        targetBranch: string;
        version: string;
    }) => boolean;
    createChangelogCommitMessage: (version: string) => string;
    parseArgs: (
        args: string[],
        environment?: Record<string, string | undefined>
    ) => {
        help: boolean;
        targetBranch: string;
        version: string;
    };
};

async function importCommitChangelogWorkflow(): Promise<CommitChangelogWorkflowModule> {
    return (await import("../../../scripts/commit-changelog-workflow.mjs")) as CommitChangelogWorkflowModule;
}

function makeCommandRecorder(diffStatus: number): {
    calls: CommandCall[];
    runCommand: CommandRunner;
} {
    const calls: CommandCall[] = [];

    return {
        calls,
        runCommand(command, args, options) {
            calls.push({ args, command, options });

            if (args.join(" ") === "diff --staged --quiet") {
                return { status: diffStatus };
            }

            return { status: 0 };
        },
    };
}

function getCommandArgs(calls: CommandCall[]): string[] {
    return calls.map((call) => call.args.join(" "));
}

describe("commit-changelog-workflow script", () => {
    it("creates the changelog commit message", async () => {
        expect.assertions(1);

        const { createChangelogCommitMessage } =
            await importCommitChangelogWorkflow();

        expect(createChangelogCommitMessage("30.0.0")).toBe(
            "📝 [docs] Update changelog for v30.0.0 [skip ci]"
        );
    });

    it("configures git and skips commit when the changelog has no staged changes", async () => {
        expect.assertions(2);

        const { commitChangelogWorkflow } =
            await importCommitChangelogWorkflow();
        const { calls, runCommand } = makeCommandRecorder(0);
        const messages: string[] = [];

        const didCommit = commitChangelogWorkflow({
            cwd: "repo",
            log(message) {
                messages.push(message);
            },
            runCommand,
            targetBranch: "main",
            version: "30.0.0",
        });

        expect({
            commands: getCommandArgs(calls),
            didCommit,
            messages,
        }).toStrictEqual({
            commands: [
                "config user.name github-actions[bot]",
                "config user.email 41898282+github-actions[bot]@users.noreply.github.com",
                `add ${rootChangelogPath}`,
                "diff --staged --quiet",
            ],
            didCommit: false,
            messages: ["No changelog changes to commit"],
        });
        expect(calls.map((call) => call.command)).toStrictEqual([
            "git",
            "git",
            "git",
            "git",
        ]);
    });

    it("commits and pushes staged changelog changes", async () => {
        expect.assertions(2);

        const { commitChangelogWorkflow } =
            await importCommitChangelogWorkflow();
        const { calls, runCommand } = makeCommandRecorder(1);
        const messages: string[] = [];

        const didCommit = commitChangelogWorkflow({
            cwd: "repo",
            log(message) {
                messages.push(message);
            },
            runCommand,
            targetBranch: "release",
            version: "30.0.0",
        });

        expect({
            commands: getCommandArgs(calls),
            didCommit,
            messages,
        }).toStrictEqual({
            commands: [
                "config user.name github-actions[bot]",
                "config user.email 41898282+github-actions[bot]@users.noreply.github.com",
                `add ${rootChangelogPath}`,
                "diff --staged --quiet",
                "commit -m 📝 [docs] Update changelog for v30.0.0 [skip ci]",
                "push origin release",
            ],
            didCommit: true,
            messages: ["Changelogs updated and pushed to repository"],
        });
        expect(new Set(calls.map((call) => call.options.cwd))).toStrictEqual(
            new Set([path.resolve("repo")])
        );
    });

    it("defaults git commands to the repository root", async () => {
        expect.assertions(1);

        const { commitChangelogWorkflow } =
            await importCommitChangelogWorkflow();
        const { calls, runCommand } = makeCommandRecorder(0);

        commitChangelogWorkflow({
            runCommand,
            targetBranch: "main",
            version: "30.0.0",
        });

        expect(calls.map((call) => call.options.cwd)).toStrictEqual([
            repositoryRoot,
            repositoryRoot,
            repositoryRoot,
            repositoryRoot,
        ]);
    });

    it("parses CLI arguments and environment defaults", async () => {
        expect.assertions(3);

        const { parseArgs } = await importCommitChangelogWorkflow();

        expect(
            parseArgs([], {
                CHANGELOG_VERSION: "30.0.0",
                TARGET_BRANCH: "main",
            })
        ).toStrictEqual({
            help: false,
            targetBranch: "main",
            version: "30.0.0",
        });
        expect(
            parseArgs(
                [
                    "--version=31.0.0",
                    "--target-branch",
                    "release",
                ],
                {}
            )
        ).toStrictEqual({
            help: false,
            targetBranch: "release",
            version: "31.0.0",
        });
        expect(() => parseArgs(["--version=30.0.0"], {})).toThrow(
            "--target-branch or TARGET_BRANCH is required"
        );
    });
});
