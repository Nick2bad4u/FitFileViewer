import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { repositoryRoot } from "../../../scripts/lib/workspaces.mjs";

type GenerateReleaseNotesModule = {
    appendReleaseNotesOverflow: (
        notes: string,
        options: {
            commitCount: number;
            currentTag: string;
            maxCommits?: number;
            previousTag: string;
            repository: string;
        }
    ) => string;
    createCommitPrettyFormat: (repository: string) => string;
    createGitLogArgs: (rangeSpec: string, repository: string) => string[];
    createRangeSpec: (currentTag: string, previousTag: string) => string;
    createTagName: (version: string) => string;
    generateReleaseNotes: (options: {
        commandRunner: (
            command: string,
            args: string[],
            options?: Record<string, unknown>
        ) => string;
        repository: string;
        repositoryRoot?: string;
        version: string;
    }) => {
        commitCount: number;
        currentTag: string;
        notes: string;
        previousTag: string;
        rangeSpec: string;
    };
    normalizeReleaseNotes: (notes: string, rangeSpec: string) => string;
    parseArgs: (args: string[]) => {
        githubOutput: boolean;
        help: boolean;
        repository: string | undefined;
        repositoryRoot: string;
        version: string | undefined;
    };
    writeGithubOutput: (notes: string, outputPath?: string) => void;
};

async function importGenerateReleaseNotes(): Promise<GenerateReleaseNotesModule> {
    return (await import("../../../scripts/generate-release-notes.mjs")) as GenerateReleaseNotesModule;
}

describe("generate-release-notes script", () => {
    it("builds release tag and git log range values", async () => {
        expect.assertions(3);

        const { createRangeSpec, createTagName } =
            await importGenerateReleaseNotes();

        expect(createTagName("30.0.0")).toBe("v30.0.0");
        expect(createTagName("v30.0.0")).toBe("v30.0.0");
        expect(createRangeSpec("v30.0.0", "v29.9.0")).toBe("v29.9.0..v30.0.0");
    });

    it("builds the same git log format used by release automation", async () => {
        expect.assertions(2);

        const { createCommitPrettyFormat, createGitLogArgs } =
            await importGenerateReleaseNotes();

        expect(createCommitPrettyFormat("Nick2bad4u/FitFileViewer")).toBe(
            "- %s%n  - Author: %an <%ae>%n  - Commit: [%h](https://github.com/Nick2bad4u/FitFileViewer/commit/%H)%n  - Date: %ad%n"
        );
        expect(
            createGitLogArgs("v29.9.0..v30.0.0", "Nick2bad4u/FitFileViewer")
        ).toStrictEqual([
            "log",
            "v29.9.0..v30.0.0",
            "--max-count=100",
            "--pretty=format:- %s%n  - Author: %an <%ae>%n  - Commit: [%h](https://github.com/Nick2bad4u/FitFileViewer/commit/%H)%n  - Date: %ad%n",
            "--date=short",
        ]);
    });

    it("links to omitted release history when the commit range is large", async () => {
        expect.assertions(2);

        const { appendReleaseNotesOverflow } =
            await importGenerateReleaseNotes();
        const options = {
            commitCount: 5352,
            currentTag: "v30.0.0",
            previousTag: "v29.9.0",
            repository: "Nick2bad4u/FitFileViewer",
        };

        expect(appendReleaseNotesOverflow("- Recent commit", options)).toBe(
            "- Recent commit\n\n_5,252 additional commits are included in the [full comparison](https://github.com/Nick2bad4u/FitFileViewer/compare/v29.9.0...v30.0.0)._"
        );
        expect(
            appendReleaseNotesOverflow("- Recent commit", {
                ...options,
                commitCount: 100,
            })
        ).toBe("- Recent commit");
    });

    it("uses a fallback note when git log returns no commits", async () => {
        expect.assertions(1);

        const { normalizeReleaseNotes } = await importGenerateReleaseNotes();

        expect(normalizeReleaseNotes("", "v30.0.0")).toBe(
            "No commits found for range v30.0.0"
        );
    });

    it("parses GitHub Actions release note arguments", async () => {
        expect.assertions(1);

        const { parseArgs } = await importGenerateReleaseNotes();
        const parsedArgs = parseArgs([
            "--version=30.0.0",
            "--repository",
            "Nick2bad4u/FitFileViewer",
            "--repository-root=.",
            "--github-output",
        ]);

        expect(parsedArgs).toStrictEqual({
            githubOutput: true,
            help: false,
            repository: "Nick2bad4u/FitFileViewer",
            repositoryRoot: ".",
            version: "30.0.0",
        });
    });

    it("defaults release note commands to the repository root", async () => {
        expect.assertions(2);

        const { generateReleaseNotes, parseArgs } =
            await importGenerateReleaseNotes();
        const commandCwds: unknown[] = [];

        generateReleaseNotes({
            commandRunner(_command, args, options) {
                commandCwds.push(options?.cwd);

                if (args[0] === "describe") {
                    return "v29.9.0\n";
                }

                if (args[0] === "log") {
                    return "- Commit subject";
                }

                if (args[0] === "rev-list") {
                    return "1";
                }

                return "";
            },
            repository: "Nick2bad4u/FitFileViewer",
            version: "30.0.0",
        });

        expect(parseArgs([]).repositoryRoot).toBe(repositoryRoot);
        expect(commandCwds).toStrictEqual([
            repositoryRoot,
            repositoryRoot,
            repositoryRoot,
            repositoryRoot,
        ]);
    });

    it("generates release notes from previous tag to current tag", async () => {
        expect.assertions(2);

        const { generateReleaseNotes } = await importGenerateReleaseNotes();
        const calls: Array<{
            args: string[];
            command: string;
            cwd: unknown;
        }> = [];
        const result = generateReleaseNotes({
            commandRunner(command, args, options) {
                calls.push({ args, command, cwd: options?.cwd });

                if (args[0] === "describe") {
                    return "v29.9.0\n";
                }

                if (args[0] === "log") {
                    return "- Commit subject";
                }

                if (args[0] === "rev-list") {
                    return "1";
                }

                return "";
            },
            repository: "Nick2bad4u/FitFileViewer",
            repositoryRoot: ".",
            version: "30.0.0",
        });

        expect(result).toStrictEqual({
            commitCount: 1,
            currentTag: "v30.0.0",
            notes: "- Commit subject",
            previousTag: "v29.9.0",
            rangeSpec: "v29.9.0..v30.0.0",
        });
        expect(calls).toStrictEqual([
            {
                args: [
                    "fetch",
                    "--tags",
                    "--force",
                ],
                command: "git",
                cwd: repositoryRoot,
            },
            {
                args: [
                    "describe",
                    "--tags",
                    "--match",
                    "v*",
                    "--abbrev=0",
                    "v30.0.0^",
                ],
                command: "git",
                cwd: repositoryRoot,
            },
            {
                args: [
                    "rev-list",
                    "--count",
                    "v29.9.0..v30.0.0",
                ],
                command: "git",
                cwd: repositoryRoot,
            },
            {
                args: [
                    "log",
                    "v29.9.0..v30.0.0",
                    "--max-count=100",
                    "--pretty=format:- %s%n  - Author: %an <%ae>%n  - Commit: [%h](https://github.com/Nick2bad4u/FitFileViewer/commit/%H)%n  - Date: %ad%n",
                    "--date=short",
                ],
                command: "git",
                cwd: repositoryRoot,
            },
        ]);
    });

    it("refuses invalid versions", async () => {
        expect.assertions(1);

        const { generateReleaseNotes } = await importGenerateReleaseNotes();

        expect(() =>
            generateReleaseNotes({
                commandRunner: () => "",
                repository: "Nick2bad4u/FitFileViewer",
                version: "30.0.0-beta.1",
            })
        ).toThrow("--version must be a semver value");
    });

    it("writes multiline GitHub Actions output", async () => {
        expect.assertions(1);

        const { writeGithubOutput } = await importGenerateReleaseNotes();
        const temporaryRoot = fs.mkdtempSync(
            path.join(os.tmpdir(), "ffv-release-notes-")
        );
        const outputPath = path.join(temporaryRoot, "github-output.txt");

        try {
            writeGithubOutput("- Commit subject", outputPath);

            expect(fs.readFileSync(outputPath, "utf8")).toBe(
                "notes<<EOF\n- Commit subject\nEOF\n"
            );
        } finally {
            fs.rmSync(temporaryRoot, { force: true, recursive: true });
        }
    });
});
