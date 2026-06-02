import path from "node:path";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

import {
    buildPrettierArgs,
    prettierOptions,
    prettierTargets,
    runPrettier,
} from "../../../scripts/run-prettier.mjs";
import {
    repositoryPrettierTargets,
    rootPrettierCachePath,
} from "../../../scripts/lib/workspaces.mjs";

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

const appLocalPackageOrConfigTargetPattern =
    /^electron-app\/(?:package(?:-lock)?\.json|(?:electron-builder|eslint|prettier|stylelint|vite|vitest)\.config\.[cm]?[jt]s|tsconfig(?:\.[\w-]+)?\.json)$/u;

describe("run-prettier wrapper", () => {
    it("keeps root-owned formatting targets for app and workspace metadata", () => {
        expect.assertions(3);

        expect(prettierTargets).toBe(repositoryPrettierTargets);
        expect(prettierTargets).toContain("electron-builder.config.cjs");
        expect(
            prettierTargets.filter((target) =>
                appLocalPackageOrConfigTargetPattern.test(target)
            )
        ).toStrictEqual([]);
    });

    it("builds default check arguments with cached formatting options", () => {
        expect.assertions(2);

        const args = buildPrettierArgs([]);

        expect(args[0]).toMatch(/[\\/]prettier[\\/]bin[\\/]prettier\.cjs$/u);
        expect(args.slice(1)).toStrictEqual([
            ...prettierTargets,
            ...prettierOptions,
            "--check",
        ]);
    });

    it("uses explicit targets without adding the default target list", () => {
        expect.assertions(2);

        const args = buildPrettierArgs(["--write", "scripts/run-prettier.mjs"]);

        expect(args[0]).toMatch(/[\\/]prettier[\\/]bin[\\/]prettier\.cjs$/u);
        expect(args.slice(1)).toStrictEqual([
            "scripts/run-prettier.mjs",
            ...prettierOptions,
            "--write",
        ]);
    });

    it("rejects invalid modes", () => {
        expect.assertions(1);

        expect(() => buildPrettierArgs(["--list-different"])).toThrow(
            "Expected --check or --write as the prettier mode"
        );
    });

    it("runs Prettier from the repository root", () => {
        expect.assertions(3);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 3 });

        const exitStatus = runPrettier(["--check"], commandRunner);

        const [
            command,
            args,
            options,
        ] = getRequiredCommandCall(commandRunner.mock.calls);

        expect(commandRunner).toHaveBeenCalledOnce();
        expect({
            command,
            exitStatus,
            args: args.slice(1),
            options: {
                ...options,
                cwd: path.resolve(options.cwd),
            },
        }).toStrictEqual({
            command: process.execPath,
            exitStatus: 3,
            args: [
                ...prettierTargets,
                ...prettierOptions,
                "--check",
            ],
            options: {
                cwd: path.resolve(process.cwd()),
                stdio: "inherit",
            },
        });
        expect(args[0]).toMatch(/[\\/]prettier[\\/]bin[\\/]prettier\.cjs$/u);
    });

    it("throws when Prettier cannot be started", () => {
        expect.assertions(4);

        const spawnError = new Error("spawn failed");
        const commandRunner = vi.fn<CommandRunner>(() => ({
            error: spawnError,
            status: null,
        }));

        expect(() =>
            runPrettier(["--check", "package.json"], commandRunner)
        ).toThrow(spawnError);
        expect(commandRunner).toHaveBeenCalledOnce();

        const [
            command,
            args,
            options,
        ] = getRequiredCommandCall(commandRunner.mock.calls);

        expect({
            args: args.slice(1),
            command,
            options: {
                ...options,
                cwd: path.resolve(options.cwd),
            },
        }).toStrictEqual({
            args: [
                "package.json",
                ...prettierOptions,
                "--check",
            ],
            command: process.execPath,
            options: {
                cwd: path.resolve(process.cwd()),
                stdio: "inherit",
            },
        });
        expect(args[0]).toMatch(/[\\/]prettier[\\/]bin[\\/]prettier\.cjs$/u);
    });

    it("keeps cache output rooted in the shared workspace cache directory", () => {
        expect.assertions(1);

        expect(prettierOptions).toContain(
            `--cache-location=${rootPrettierCachePath}`
        );
    });
});
