import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
    docusaurusWorkspaceRepositoryPath,
    rootDocsPath,
    rootRemarkConfigPath,
    rootSecretlintConfigPath,
} from "../../../scripts/lib/workspaces.mjs";
import {
    buildRemarkArgs,
    remarkOptions,
    remarkTargets,
    runRemarkLint,
} from "../../../scripts/lint-remark.mjs";
import {
    buildSecretlintArgs,
    runSecretlint,
    secretlintTargets,
} from "../../../scripts/lint-secretlint.mjs";

type CommandRunner = (
    command: string,
    args: string[],
    options: { cwd: string; stdio: string }
) => { error?: Error; status: number | null };

function getRequiredCommandCall(
    calls: Parameters<CommandRunner>[],
    index = 0
): Parameters<CommandRunner> {
    const call = calls[index];

    if (!call) {
        throw new Error(`Expected command call ${index}`);
    }

    return call;
}

describe("root documentation lint wrappers", () => {
    it("builds root-owned Remark arguments", () => {
        expect.assertions(3);

        const args = buildRemarkArgs(["--silent"]);

        expect(remarkTargets).toStrictEqual([
            rootDocsPath,
            docusaurusWorkspaceRepositoryPath("docs"),
            docusaurusWorkspaceRepositoryPath("blog"),
            docusaurusWorkspaceRepositoryPath("src"),
        ]);
        expect(remarkOptions).toStrictEqual([
            "--quiet",
            "--frail",
            "--rc-path",
            rootRemarkConfigPath,
            "--ignore-pattern",
            docusaurusWorkspaceRepositoryPath("docs/api/**"),
        ]);
        expect(args.slice(1)).toStrictEqual([
            ...remarkTargets,
            ...remarkOptions,
            "--silent",
        ]);
    });

    it("runs Remark from the repository root", () => {
        expect.assertions(2);

        const commandRunner = vi.fn<CommandRunner>(() => ({ status: 0 }));

        const exitStatus = runRemarkLint(["--silent"], commandRunner);

        const [
            command,
            args,
            options,
        ] = getRequiredCommandCall(commandRunner.mock.calls);

        expect({
            args,
            command,
            status: exitStatus,
        }).toStrictEqual({
            args: buildRemarkArgs(["--silent"]),
            command: process.execPath,
            status: 0,
        });
        expect({
            ...options,
            cwd: path.resolve(options.cwd),
        }).toStrictEqual({
            cwd: path.resolve(process.cwd()),
            stdio: "inherit",
        });
    });

    it("builds root-owned Secretlint arguments", () => {
        expect.assertions(2);

        const args = buildSecretlintArgs(["--format=json"]);

        expect(secretlintTargets).toStrictEqual([
            "*.md",
            `${rootDocsPath}/**/*.md`,
            docusaurusWorkspaceRepositoryPath("docs/**/*.{md,mdx}"),
            docusaurusWorkspaceRepositoryPath("blog/**/*.{md,mdx}"),
        ]);
        expect(args.slice(1)).toStrictEqual([
            ...secretlintTargets,
            "--secretlintrc",
            rootSecretlintConfigPath,
            "--format=json",
        ]);
    });

    it("runs Secretlint from the repository root", () => {
        expect.assertions(2);

        const commandRunner = vi.fn<CommandRunner>(() => ({ status: 0 }));

        const exitStatus = runSecretlint(["--format=json"], commandRunner);

        const [
            command,
            args,
            options,
        ] = getRequiredCommandCall(commandRunner.mock.calls);

        expect({
            args,
            command,
            status: exitStatus,
        }).toStrictEqual({
            args: buildSecretlintArgs(["--format=json"]),
            command: process.execPath,
            status: 0,
        });
        expect({
            ...options,
            cwd: path.resolve(options.cwd),
        }).toStrictEqual({
            cwd: path.resolve(process.cwd()),
            stdio: "inherit",
        });
    });

    it("throws when a documentation linter cannot be started", () => {
        expect.assertions(4);

        const spawnError = new Error("spawn failed");
        const commandRunner = vi.fn<CommandRunner>(() => ({
            error: spawnError,
            status: null,
        }));

        expect(() => runRemarkLint([], commandRunner)).toThrow(spawnError);
        expect(() => runSecretlint([], commandRunner)).toThrow(spawnError);
        expect(commandRunner).toHaveBeenCalledTimes(2);
        expect(commandRunner.mock.calls.map(([command]) => command)).toEqual([
            process.execPath,
            process.execPath,
        ]);
    });
});
