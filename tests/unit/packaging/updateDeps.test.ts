import path from "node:path";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

import { resolveCommandForPlatform } from "../../../scripts/lib/child-process.mjs";
import {
    buildNcuArgs,
    ncuCliPath,
    runUpdateDeps,
    shouldInstallUpdatedDependencies,
} from "../../../scripts/update-deps.mjs";

type CommandRunner = (
    command: string,
    args: string[],
    options: { cwd: string; stdio: string }
) => { error?: Error; status: null | number };

describe("update-deps script", () => {
    it("builds npm-check-updates args for the root workspace set", () => {
        expect.assertions(1);

        expect({
            dryRunInstalls: shouldInstallUpdatedDependencies(["--no-install"]),
            minorUpdateArgs: buildNcuArgs([
                "--target",
                "minor",
                "--no-install",
            ]),
            minorUpdateInstalls: shouldInstallUpdatedDependencies([
                "--target",
                "minor",
            ]),
        }).toStrictEqual({
            dryRunInstalls: false,
            minorUpdateArgs: [
                "-i",
                "--workspaces",
                "--root",
                "--install",
                "never",
                "--target",
                "minor",
            ],
            minorUpdateInstalls: true,
        });
    });

    it("runs npm-check-updates then installs from the repository root", () => {
        expect.assertions(6);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 0 });

        const status = runUpdateDeps(["--target", "minor"], commandRunner);
        expect(commandRunner).toHaveBeenCalledTimes(2);

        const [
            ncuCommand,
            ncuArgs,
            ncuOptions,
        ] = commandRunner.mock.calls[0] ?? [];
        const [
            installCommand,
            installArgs,
            installOptions,
        ] = commandRunner.mock.calls[1] ?? [];

        expect({
            command: ncuCommand,
            status,
        }).toStrictEqual({
            command: process.execPath,
            status: 0,
        });
        expect(ncuArgs).toStrictEqual([
            ncuCliPath,
            "-i",
            "--workspaces",
            "--root",
            "--install",
            "never",
            "--target",
            "minor",
        ]);
        expect({
            ...ncuOptions,
            cwd: path.resolve(ncuOptions?.cwd ?? ""),
        }).toStrictEqual({
            cwd: path.resolve(process.cwd()),
            stdio: "inherit",
        });
        expect(installCommand).toBe(resolveCommandForPlatform("npm"));
        expect({
            args: installArgs,
            cwd: path.resolve(installOptions?.cwd ?? ""),
            stdio: installOptions?.stdio,
        }).toStrictEqual({
            args: ["install"],
            cwd: path.resolve(process.cwd()),
            stdio: "inherit",
        });
    });

    it("skips npm install for dry-run and help modes", () => {
        expect.assertions(1);

        const outcomes = [["--no-install"], ["--help"]].map((args) => {
            const commandRunner = vi
                .fn<CommandRunner>()
                .mockReturnValue({ status: 0 });
            const status = runUpdateDeps(args, commandRunner);

            return {
                args,
                callCount: commandRunner.mock.calls.length,
                status,
            };
        });

        expect(outcomes).toStrictEqual([
            {
                args: ["--no-install"],
                callCount: 1,
                status: 0,
            },
            {
                args: ["--help"],
                callCount: 1,
                status: 0,
            },
        ]);
    });

    it("stops before npm install when npm-check-updates fails", () => {
        expect.assertions(2);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 7 });
        const status = runUpdateDeps([], commandRunner);

        expect({
            callCount: commandRunner.mock.calls.length,
            status,
        }).toStrictEqual({
            callCount: 1,
            status: 7,
        });
        expect(commandRunner.mock.calls[0]).toStrictEqual([
            process.execPath,
            [ncuCliPath, ...buildNcuArgs([])],
            {
                cwd: process.cwd(),
                stdio: "inherit",
            },
        ]);
    });

    it("throws when dependency update commands report spawn errors", () => {
        expect.assertions(4);

        const spawnError = new Error("spawn failed");
        const commandRunner = vi.fn<CommandRunner>().mockReturnValue({
            error: spawnError,
            status: null,
        });

        expect(() => runUpdateDeps([], commandRunner)).toThrow(spawnError);
        expect(commandRunner).toHaveBeenCalledOnce();

        const [
            command,
            args,
            options,
        ] = commandRunner.mock.calls[0] ?? [];

        expect({ args, command }).toStrictEqual({
            args: [ncuCliPath, ...buildNcuArgs([])],
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
