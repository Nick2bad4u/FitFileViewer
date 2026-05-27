import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

type GenerateReleaseNotesModule = {
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
            "--pretty=format:- %s%n  - Author: %an <%ae>%n  - Commit: [%h](https://github.com/Nick2bad4u/FitFileViewer/commit/%H)%n  - Date: %ad%n",
            "--date=short",
        ]);
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

    it("generates release notes from previous tag to current tag", async () => {
        expect.assertions(4);

        const { generateReleaseNotes } = await importGenerateReleaseNotes();
        const calls: string[] = [];
        const result = generateReleaseNotes({
            commandRunner(command, args) {
                calls.push([command, ...args].join(" "));

                if (args[0] === "describe") {
                    return "v29.9.0\n";
                }

                if (args[0] === "log") {
                    return "- Commit subject";
                }

                return "";
            },
            repository: "Nick2bad4u/FitFileViewer",
            repositoryRoot: ".",
            version: "30.0.0",
        });

        expect(result.currentTag).toBe("v30.0.0");
        expect(result.previousTag).toBe("v29.9.0");
        expect(result.rangeSpec).toBe("v29.9.0..v30.0.0");
        expect(calls).toContain("git fetch --tags --force");
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
