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
    appWorkspaceRepositoryPath,
    rootStylelintConfigPath,
} from "../../../scripts/lib/workspaces.mjs";

type CommandRunner = (
    command: string,
    args: string[],
    options: { cwd: string; stdio: string }
) => { error?: Error; status: number };

describe("lint-css wrapper", () => {
    it("keeps root-owned Stylelint targets for app styles", () => {
        expect.assertions(2);

        expect(stylelintTargets).toStrictEqual([
            appWorkspaceRepositoryPath("**", "*.css"),
        ]);
        expect(stylelintConfigPath).toBe(rootStylelintConfigPath);
    });

    it("builds Stylelint CLI arguments with root config and forwarded flags", () => {
        expect.assertions(4);

        const args = buildStylelintArgs(["--quiet"]);

        expect(args[0]).toMatch(/[\\/]stylelint[\\/]bin[\\/]stylelint\.mjs$/u);
        expect(args).toEqual(
            expect.arrayContaining([
                appWorkspaceRepositoryPath("**", "*.css"),
                "--config",
                rootStylelintConfigPath,
                "--quiet",
            ])
        );
        expect(args.indexOf("--config")).toBeGreaterThan(
            args.indexOf(appWorkspaceRepositoryPath("**", "*.css"))
        );
        expect(args.at(-1)).toBe("--quiet");
    });

    it("runs Stylelint from the repository root", () => {
        expect.assertions(5);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 4 });

        expect(runStylelint(["--fix"], commandRunner)).toBe(4);

        const [
            command,
            args,
            options,
        ] = commandRunner.mock.calls[0] ?? [];

        expect(command).toBe(process.execPath);
        expect(args).toContain("--fix");
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
        expect.assertions(1);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ error: new Error("spawn failed"), status: 0 });

        expect(() => runStylelint([], commandRunner)).toThrow("spawn failed");
    });
});
