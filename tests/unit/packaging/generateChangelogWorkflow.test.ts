import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
    repositoryRoot,
    rootChangelogPath,
    rootCliffConfigPath,
} from "../../../scripts/lib/workspaces.mjs";

type DirectoryEntry = {
    name: string;
    type: "directory" | "file";
};
type GenerateChangelogWorkflowModule = {
    createChangelogMetadata: (cwd?: string) => {
        exists: boolean;
        lineCount: number;
        path: string;
        size: string;
    };
    createDirectoryListing: (cwd?: string) => DirectoryEntry[];
    formatChangelogMetadata: (metadata: {
        exists: boolean;
        lineCount: number;
        size: string;
    }) => string;
    formatDirectoryListing: (entries: DirectoryEntry[]) => string;
    buildChangelogArgs: (options?: { verbose?: boolean }) => string[];
    currentReleaseChangelogBody: string;
    parseArgs: (args: string[]) => {
        help: boolean;
        verbose: boolean;
    };
    runChangelogWorkflow: (options?: {
        cwd?: string;
        log?: (message: string) => void;
        runCommand?: (
            command: string,
            args: string[],
            options: { cwd: string; stdio: "inherit" }
        ) => { error?: Error; status?: number };
        verbose?: boolean;
    }) => number;
};

const temporaryRoots: string[] = [];

async function importGenerateChangelogWorkflow(): Promise<GenerateChangelogWorkflowModule> {
    return (await import("../../../scripts/generate-changelog-workflow.mjs")) as GenerateChangelogWorkflowModule;
}

function makeTemporaryRoot(): string {
    const temporaryRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), "ffv-generate-changelog-workflow-")
    );

    temporaryRoots.push(temporaryRoot);

    return temporaryRoot;
}

afterEach(() => {
    for (const temporaryRoot of temporaryRoots.splice(0)) {
        fs.rmSync(temporaryRoot, { force: true, recursive: true });
    }
});

describe("generate-changelog-workflow script", () => {
    it("formats the repository directory listing deterministically", async () => {
        expect.assertions(2);

        const { createDirectoryListing, formatDirectoryListing } =
            await importGenerateChangelogWorkflow();
        const temporaryRoot = makeTemporaryRoot();

        fs.mkdirSync(path.join(temporaryRoot, "scripts"));
        fs.writeFileSync(path.join(temporaryRoot, "package.json"), "{}\n");

        expect(createDirectoryListing(temporaryRoot)).toStrictEqual([
            { name: "package.json", type: "file" },
            { name: "scripts", type: "directory" },
        ]);
        expect(
            formatDirectoryListing([
                { name: "package.json", type: "file" },
                { name: "scripts", type: "directory" },
            ])
        ).toBe("- package.json\nd scripts");
    });

    it("reports root changelog metadata", async () => {
        expect.assertions(2);

        const { createChangelogMetadata, formatChangelogMetadata } =
            await importGenerateChangelogWorkflow();
        const temporaryRoot = makeTemporaryRoot();

        expect(
            formatChangelogMetadata(createChangelogMetadata(temporaryRoot))
        ).toBe("Root CHANGELOG.md generated, size: file not found");

        fs.writeFileSync(path.join(temporaryRoot, rootChangelogPath), "a\nb\n");

        expect(createChangelogMetadata(temporaryRoot)).toStrictEqual({
            exists: true,
            lineCount: 3,
            path: rootChangelogPath,
            size: "4",
        });
    });

    it("runs the changelog generator and logs the root changelog result", async () => {
        expect.assertions(2);

        const { buildChangelogArgs, runChangelogWorkflow } =
            await importGenerateChangelogWorkflow();
        const temporaryRoot = makeTemporaryRoot();
        const messages: string[] = [];
        const commands: Array<{ args: string[]; command: string }> = [];

        fs.writeFileSync(
            path.join(temporaryRoot, rootChangelogPath),
            "# Log\n"
        );

        const exitCode = runChangelogWorkflow({
            cwd: temporaryRoot,
            log(message) {
                messages.push(message);
            },
            runCommand(command, args) {
                commands.push({ args, command });
                return { status: 0 };
            },
        });

        expect({
            commands,
            exitCode,
        }).toStrictEqual({
            commands: [
                {
                    args: buildChangelogArgs({ verbose: true }),
                    command: process.execPath,
                },
            ],
            exitCode: 0,
        });
        expect(messages).toStrictEqual([
            "Starting changelog generation...",
            `Current directory: ${temporaryRoot}`,
            "Available files:",
            `- ${rootChangelogPath}`,
            "",
            `Generating root ${rootChangelogPath}...`,
            "Root CHANGELOG.md generated, size: 6, lines: 2",
            "",
            "All changelog generation completed.",
            "Files updated:",
            `Found: ${rootChangelogPath}`,
        ]);
    });

    it("propagates a failed changelog generation status", async () => {
        expect.assertions(1);

        const { runChangelogWorkflow } =
            await importGenerateChangelogWorkflow();
        const priorExitCode = process.exitCode;

        try {
            const exitCode = runChangelogWorkflow({
                cwd: makeTemporaryRoot(),
                log() {},
                runCommand() {
                    return { status: 9 };
                },
            });

            expect({
                exitCode,
                processExitCode: process.exitCode,
            }).toStrictEqual({
                exitCode: 9,
                processExitCode: 9,
            });
        } finally {
            process.exitCode = priorExitCode;
        }
    });

    it("normalizes relative changelog workflow roots before running commands", async () => {
        expect.assertions(1);

        const { runChangelogWorkflow } =
            await importGenerateChangelogWorkflow();
        const commandCwds: string[] = [];

        runChangelogWorkflow({
            cwd: ".",
            log() {},
            runCommand(_command, _args, options) {
                commandCwds.push(options.cwd);
                return { status: 0 };
            },
        });

        expect(commandCwds).toStrictEqual([repositoryRoot]);
    });

    it("parses CLI options", async () => {
        expect.assertions(3);

        const { parseArgs } = await importGenerateChangelogWorkflow();

        expect(parseArgs([])).toStrictEqual({ help: false, verbose: true });
        expect(parseArgs(["--no-verbose"])).toStrictEqual({
            help: false,
            verbose: false,
        });
        expect(() => parseArgs(["--bad-option"])).toThrow(
            "Unknown option: --bad-option"
        );
    });

    it("builds git-cliff arguments for the root changelog", async () => {
        expect.assertions(2);

        const { buildChangelogArgs, currentReleaseChangelogBody } =
            await importGenerateChangelogWorkflow();

        expect(buildChangelogArgs({ verbose: false }).slice(1)).toStrictEqual([
            "--config",
            rootCliffConfigPath,
            "--latest",
            "--current",
            "--github-repo",
            "Nick2bad4u/FitFileViewer",
            "--body",
            currentReleaseChangelogBody,
            "--prepend",
            rootChangelogPath,
        ]);
        expect(buildChangelogArgs({ verbose: true }).slice(-1)).toStrictEqual([
            "--verbose",
        ]);
    });
});
