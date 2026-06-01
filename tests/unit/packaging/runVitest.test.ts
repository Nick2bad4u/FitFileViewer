import path from "node:path";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

import {
    buildRuntimeScriptPath,
    rootIntegrationTestsPath,
    rootTabsTestsPath,
    rootUnitTestsPath,
    rootVitestConfigPath,
} from "../../../scripts/lib/workspaces.mjs";
import {
    buildVitestArgs,
    ensureRuntimeDist,
    runVitest,
} from "../../../scripts/run-vitest.mjs";

type CommandRunner = (
    command: string,
    args: string[],
    options: { cwd: string; stdio: string }
) => { status: number };

describe("run-vitest wrapper", () => {
    it("expands named unit suite paths", () => {
        expect.assertions(1);

        expect(
            buildVitestArgs([
                "--run",
                "--suite",
                "unit",
                "--maxWorkers",
                "1",
            ])
        ).toStrictEqual([
            "--config",
            rootVitestConfigPath,
            "--run",
            rootUnitTestsPath,
            "--maxWorkers",
            "1",
        ]);
    });

    it("expands inline named suite paths", () => {
        expect.assertions(1);

        expect(
            buildVitestArgs([
                "--run",
                "--reporter=verbose",
                "--suite=tabs",
            ])
        ).toStrictEqual([
            "--config",
            rootVitestConfigPath,
            "--run",
            "--reporter=verbose",
            rootTabsTestsPath,
        ]);
    });

    it("uses explicit test paths instead of expanding suite defaults", () => {
        expect.assertions(1);

        expect(
            buildVitestArgs([
                "--run",
                "--suite",
                "unit",
                "--maxWorkers",
                "1",
                "tests/unit/packaging/cleanWorkspace.test.ts",
            ])
        ).toStrictEqual([
            "--config",
            rootVitestConfigPath,
            "--run",
            "--maxWorkers",
            "1",
            "tests/unit/packaging/cleanWorkspace.test.ts",
        ]);
    });

    it("does not mistake option values for explicit test paths", () => {
        expect.assertions(1);

        expect(
            buildVitestArgs([
                "--run",
                "--reporter",
                "dot",
                "--suite=unit",
            ])
        ).toStrictEqual([
            "--config",
            rootVitestConfigPath,
            "--run",
            "--reporter",
            "dot",
            rootUnitTestsPath,
        ]);
    });

    it("rejects invalid suite arguments", () => {
        expect.assertions(2);

        expect(() => buildVitestArgs(["--suite"])).toThrow(
            "Missing Vitest suite name after --suite."
        );
        expect(() => buildVitestArgs(["--suite", "unknown"])).toThrow(
            'Unknown Vitest suite "unknown".'
        );
    });

    it("skips the runtime build when the runtime dist sentinel exists", () => {
        expect.assertions(2);

        const commandRunner = vi.fn<CommandRunner>(() => ({ status: 0 }));

        expect(ensureRuntimeDist(commandRunner, () => true)).toBe(0);
        expect(commandRunner).not.toHaveBeenCalled();
    });

    it("returns the runtime build failure before launching Vitest", () => {
        expect.assertions(2);

        const commandRunner = vi.fn<CommandRunner>(() => ({ status: 7 }));

        const runStatus = runVitest(
            ["--run", "--suite=unit"],
            commandRunner,
            () => false
        );

        expect(runStatus).toBe(7);
        expect(commandRunner.mock.calls).toStrictEqual([
            [
                process.execPath,
                [buildRuntimeScriptPath],
                {
                    cwd: process.cwd(),
                    stdio: "inherit",
                },
            ],
        ]);
    });

    it("runs Vitest from the repository root", () => {
        expect.assertions(2);

        const commandRunner = vi.fn<CommandRunner>(() => ({ status: 0 }));

        const runStatus = runVitest(
            ["--run", "--suite=integration"],
            commandRunner,
            () => false
        );
        expect(commandRunner).toHaveBeenCalledTimes(2);

        const [
            buildCommand,
            buildArgs,
            buildOptions,
        ] = commandRunner.mock.calls[0];
        const [
            vitestCommand,
            vitestArgs,
            vitestOptions,
        ] = commandRunner.mock.calls[1];

        expect({
            build: {
                args: buildArgs,
                command: buildCommand,
                options: {
                    ...buildOptions,
                    cwd: path.resolve(buildOptions.cwd),
                },
            },
            runStatus,
            vitest: {
                args: vitestArgs,
                command: vitestCommand,
                options: {
                    ...vitestOptions,
                    cwd: path.resolve(vitestOptions.cwd),
                },
            },
        }).toStrictEqual({
            build: {
                args: [buildRuntimeScriptPath],
                command: process.execPath,
                options: {
                    cwd: process.cwd(),
                    stdio: "inherit",
                },
            },
            runStatus: 0,
            vitest: {
                args: [
                    "--max-old-space-size=8192",
                    expect.stringMatching(/[\\/]vitest[\\/]vitest\.mjs$/u),
                    "--config",
                    rootVitestConfigPath,
                    "--run",
                    rootIntegrationTestsPath,
                ],
                command: process.execPath,
                options: {
                    cwd: process.cwd(),
                    stdio: "inherit",
                },
            },
        });
    });
});
