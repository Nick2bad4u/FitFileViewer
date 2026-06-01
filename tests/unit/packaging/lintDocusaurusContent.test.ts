import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
    buildMarkdownlintArgs,
    markdownlintTargets,
    runLintDocusaurusContent,
} from "../../../scripts/lint-docusaurus-content.mjs";

type CommandRunner = (
    command: string,
    args: string[],
    options: { cwd: string; stdio: string }
) => { error?: Error; status: number | null };

describe("lint-docusaurus-content script", () => {
    it("builds root-owned markdownlint arguments for Docusaurus content", () => {
        expect.assertions(5);

        const args = buildMarkdownlintArgs(["--fix"]);

        expect(markdownlintTargets).toStrictEqual([
            "docusaurus/docs/**/*.{md,mdx}",
            "!docusaurus/docs/api/**/*.md",
            "docusaurus/blog/**/*.{md,mdx}",
            "docusaurus/src/**/*.{md,mdx}",
        ]);
        expect(args[0]).toMatch(
            /[\\/]markdownlint-cli2[\\/].*markdownlint-cli2(?:\.mjs|\.cjs|\.js)?$/u
        );
        expect(args).toContain("--config");
        expect(args).toContain(".markdownlint.json");
        expect(args.at(-1)).toBe("--fix");
    });

    it("runs markdownlint from the repository root", () => {
        expect.assertions(3);

        const commandRunner = vi.fn<CommandRunner>(() => ({ status: 0 }));

        const exitStatus = runLintDocusaurusContent(["--quiet"], commandRunner);

        const [
            command,
            args,
            options,
        ] = commandRunner.mock.calls[0] ?? [];

        expect({
            args,
            command,
            status: exitStatus,
        }).toStrictEqual({
            args: buildMarkdownlintArgs(["--quiet"]),
            command: process.execPath,
            status: 0,
        });
        expect({
            ...options,
            cwd: path.resolve(options?.cwd ?? ""),
        }).toStrictEqual({
            cwd: path.resolve(process.cwd()),
            stdio: "inherit",
        });
        expect(args).not.toContain("../.markdownlint.json");
    });

    it("throws when markdownlint cannot be started", () => {
        expect.assertions(4);

        const spawnError = new Error("spawn failed");
        const commandRunner = vi.fn<CommandRunner>(() => ({
            error: spawnError,
            status: null,
        }));

        expect(() => runLintDocusaurusContent([], commandRunner)).toThrow(
            spawnError
        );
        expect(commandRunner).toHaveBeenCalledOnce();

        const [
            command,
            args,
            options,
        ] = commandRunner.mock.calls[0] ?? [];

        expect({ args, command }).toStrictEqual({
            args: buildMarkdownlintArgs([]),
            command: process.execPath,
        });
        expect({
            ...options,
            cwd: path.resolve(options?.cwd ?? ""),
        }).toStrictEqual({
            cwd: path.resolve(process.cwd()),
            stdio: "inherit",
        });
    });
});
