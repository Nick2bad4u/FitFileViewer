import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { repositoryRoot } from "../../../scripts/lib/workspaces.mjs";

type PublishCommand = {
    args: string[];
    command: string;
};
type PublishCommandCall = PublishCommand & {
    options: {
        cwd: string;
        stdio?: "inherit";
    };
};

type PublishAppVersionModule = {
    createCommitMessage: (version: string) => string;
    createPublishCommands: (options: {
        branch: string;
        version: string;
    }) => PublishCommand[];
    createTagMessage: (version: string) => string;
    createTagName: (version: string) => string;
    defaultVersionFiles: string[];
    parseArgs: (args: string[]) => {
        branch: string | undefined;
        dryRun: boolean;
        githubOutput: boolean;
        help: boolean;
        version: string | undefined;
    };
    publishAppVersion: (options: {
        branch?: string;
        captureRunner?: (
            command: string,
            args: string[],
            options: PublishCommandCall["options"]
        ) => string;
        commandRunner?: (
            command: string,
            args: string[],
            options: PublishCommandCall["options"]
        ) => void;
        dryRun?: boolean;
        repositoryRoot?: string;
        version?: string;
    }) => {
        branch: string;
        bumpSha: string;
        commands: PublishCommand[];
        tagName: string;
        version: string;
    };
    writeGithubOutput: (bumpSha: string, outputPath?: string) => void;
};

type WorkspacesModule = {
    rootPackageLockPath: string;
    rootPackageRepositoryPath: string;
};

async function importPublishAppVersion(): Promise<PublishAppVersionModule> {
    return (await import("../../../scripts/publish-app-version.mjs")) as PublishAppVersionModule;
}

async function importWorkspaces(): Promise<WorkspacesModule> {
    return (await import("../../../scripts/lib/workspaces.mjs")) as WorkspacesModule;
}

describe("publish-app-version script", () => {
    it("builds the release commit and tag metadata", async () => {
        expect.assertions(3);

        const { createCommitMessage, createTagMessage, createTagName } =
            await importPublishAppVersion();

        expect(createCommitMessage("30.0.0")).toBe(
            "🔖 [chore] Release v30.0.0 [skip ci]"
        );
        expect(createTagName("30.0.0")).toBe("v30.0.0");
        expect(createTagMessage("30.0.0")).toBe("Release v30.0.0");
    });

    it("keeps version package paths centralized for the release commit", async () => {
        expect.assertions(1);

        const { defaultVersionFiles } = await importPublishAppVersion();
        const { rootPackageLockPath, rootPackageRepositoryPath } =
            await importWorkspaces();

        expect(defaultVersionFiles).toStrictEqual([
            rootPackageRepositoryPath,
            rootPackageLockPath,
        ]);
    });

    it("builds the git command sequence used by the release workflow", async () => {
        expect.assertions(1);

        const { createPublishCommands } = await importPublishAppVersion();
        const { rootPackageLockPath, rootPackageRepositoryPath } =
            await importWorkspaces();

        expect(
            createPublishCommands({ branch: "main", version: "30.0.0" })
        ).toStrictEqual([
            {
                args: [
                    "config",
                    "user.name",
                    "github-actions[bot]",
                ],
                command: "git",
            },
            {
                args: [
                    "config",
                    "user.email",
                    "41898282+github-actions[bot]@users.noreply.github.com",
                ],
                command: "git",
            },
            {
                args: [
                    "add",
                    rootPackageRepositoryPath,
                    rootPackageLockPath,
                ],
                command: "git",
            },
            {
                args: [
                    "commit",
                    "-m",
                    "🔖 [chore] Release v30.0.0 [skip ci]",
                ],
                command: "git",
            },
            {
                args: [
                    "push",
                    "origin",
                    "HEAD:main",
                ],
                command: "git",
            },
            {
                args: [
                    "tag",
                    "-a",
                    "v30.0.0",
                    "-m",
                    "Release v30.0.0",
                ],
                command: "git",
            },
            {
                args: [
                    "push",
                    "origin",
                    "v30.0.0",
                ],
                command: "git",
            },
        ]);
    });

    it("parses GitHub Actions publish arguments", async () => {
        expect.assertions(1);

        const { parseArgs } = await importPublishAppVersion();

        expect(
            parseArgs([
                "--version",
                "30.0.0",
                "--branch=main",
                "--github-output",
            ])
        ).toStrictEqual({
            branch: "main",
            dryRun: false,
            githubOutput: true,
            help: false,
            version: "30.0.0",
        });
    });

    it("refuses invalid release versions", async () => {
        expect.assertions(1);

        const { publishAppVersion } = await importPublishAppVersion();

        expect(() =>
            publishAppVersion({
                branch: "main",
                dryRun: true,
                version: "30.0.0-beta.1",
            })
        ).toThrow("--version must be a semver value");
    });

    it("returns a deterministic dry-run result without running git", async () => {
        expect.assertions(4);

        const { publishAppVersion } = await importPublishAppVersion();
        const result = publishAppVersion({
            branch: "main",
            dryRun: true,
            version: "30.0.0",
        });

        expect(result.bumpSha).toBe("dry-run");
        expect(result.tagName).toBe("v30.0.0");
        expect(result.commands).toHaveLength(7);
        expect(result.branch).toBe("main");
    });

    it("defaults publish commands to the repository root", async () => {
        expect.assertions(1);

        const { publishAppVersion } = await importPublishAppVersion();
        const calls: PublishCommandCall[] = [];

        publishAppVersion({
            branch: "main",
            captureRunner(command, args, options) {
                calls.push({ args, command, options });

                return "abc123";
            },
            commandRunner(command, args, options) {
                calls.push({ args, command, options });
            },
            version: "30.0.0",
        });

        expect(calls.map((call) => call.options.cwd)).toStrictEqual([
            repositoryRoot,
            repositoryRoot,
            repositoryRoot,
            repositoryRoot,
            repositoryRoot,
            repositoryRoot,
            repositoryRoot,
            repositoryRoot,
        ]);
    });

    it("normalizes relative publish command roots before running git", async () => {
        expect.assertions(1);

        const { publishAppVersion } = await importPublishAppVersion();
        const calls: PublishCommandCall[] = [];

        publishAppVersion({
            branch: "main",
            captureRunner(command, args, options) {
                calls.push({ args, command, options });

                return "abc123";
            },
            commandRunner(command, args, options) {
                calls.push({ args, command, options });
            },
            repositoryRoot: ".",
            version: "30.0.0",
        });

        expect(new Set(calls.map((call) => call.options.cwd))).toStrictEqual(
            new Set([repositoryRoot])
        );
    });

    it("writes the GitHub Actions output value", async () => {
        expect.assertions(1);

        const { writeGithubOutput } = await importPublishAppVersion();
        const temporaryRoot = fs.mkdtempSync(
            path.join(os.tmpdir(), "ffv-publish-app-version-")
        );
        const outputPath = path.join(temporaryRoot, "github-output.txt");

        try {
            writeGithubOutput("abc123", outputPath);

            expect(fs.readFileSync(outputPath, "utf8")).toBe(
                "bump_sha=abc123\n"
            );
        } finally {
            fs.rmSync(temporaryRoot, { force: true, recursive: true });
        }
    });
});
