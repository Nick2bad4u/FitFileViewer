import path from "node:path";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

import {
    buildStylelintArgs,
    runStylelint,
    stylelintConfigPath,
    stylelintTargets,
} from "../../../scripts/lint-css.mjs";
import {
    rootAppCssGlobPath,
    rootStylelintConfigPath,
} from "../../../scripts/lib/workspaces.mjs";

type CommandRunner = (
    command: string,
    args: string[],
    options: { cwd: string; stdio: string }
) => { error?: Error; status: number };

describe("lint-css wrapper", () => {
    it("keeps root-owned Stylelint targets for app styles", () => {
        expect.assertions(1);

        expect({
            stylelintConfigPath,
            stylelintTargets,
        }).toStrictEqual({
            stylelintConfigPath: rootStylelintConfigPath,
            stylelintTargets: [rootAppCssGlobPath],
        });
    });

    it("builds Stylelint CLI arguments with root config and forwarded flags", () => {
        expect.assertions(4);

        const args = buildStylelintArgs(["--quiet"]);

        expect(args[0]).toMatch(/[\\/]stylelint[\\/]bin[\\/]stylelint\.mjs$/u);
        expect(args.slice(1)).toStrictEqual([
            rootAppCssGlobPath,
            "--config",
            rootStylelintConfigPath,
            "--quiet",
        ]);
        expect(args.indexOf("--config")).toBeGreaterThan(
            args.indexOf(rootAppCssGlobPath)
        );
        expect(args.at(-1)).toBe("--quiet");
    });

    it("runs Stylelint from the repository root", () => {
        expect.assertions(3);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 4 });

        const exitStatus = runStylelint(["--fix"], commandRunner);

        const [
            command,
            args,
            options,
        ] = commandRunner.mock.calls[0] ?? [];

        expect({
            args: args?.slice(1),
            command,
            status: exitStatus,
        }).toStrictEqual({
            args: [
                rootAppCssGlobPath,
                "--config",
                rootStylelintConfigPath,
                "--fix",
            ],
            command: process.execPath,
            status: 4,
        });
        expect(args?.[0]).toMatch(
            /[\\/]stylelint[\\/]bin[\\/]stylelint\.mjs$/u
        );
        expect({
            ...options,
            cwd: path.resolve(options?.cwd ?? ""),
        }).toStrictEqual({
            cwd: path.resolve(process.cwd()),
            stdio: "inherit",
        });
    });

    it("throws when the Stylelint process cannot be started", () => {
        expect.assertions(4);

        const spawnError = new Error("spawn failed");
        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ error: spawnError, status: 0 });

        expect(() => runStylelint([], commandRunner)).toThrow(spawnError);
        expect(commandRunner).toHaveBeenCalledOnce();

        const [
            command,
            args,
            options,
        ] = commandRunner.mock.calls[0] ?? [];

        expect({ args, command }).toStrictEqual({
            args: buildStylelintArgs([]),
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
