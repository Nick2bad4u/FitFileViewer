import path from "node:path";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

import {
    repositoryScriptPath,
    rootIntegrationTestsPath,
    rootTabsTestsPath,
    rootUnitTestsPath,
    rootVitestConfigPath,
} from "../../../scripts/lib/workspaces.mjs";
import { buildVitestArgs, runVitest } from "../../../scripts/run-vitest.mjs";

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

    it("runs Vitest from the repository root", () => {
        expect.assertions(10);

        const commandRunner = vi.fn<CommandRunner>(() => ({ status: 0 }));

        expect(
            runVitest(
                ["--run", "--suite=integration"],
                commandRunner,
                () => false
            )
        ).toBe(0);
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

        expect(buildCommand).toBe(process.execPath);
        expect(buildArgs).toStrictEqual([
            repositoryScriptPath("build-runtime.mjs"),
        ]);
        expect(path.resolve(buildOptions.cwd)).toBe(process.cwd());
        expect(buildOptions.stdio).toBe("inherit");
        expect(vitestCommand).toBe(process.execPath);
        expect(vitestArgs).toEqual(
            expect.arrayContaining([
                "--max-old-space-size=8192",
                expect.stringContaining(path.join("vitest", "vitest.mjs")),
                "--config",
                rootVitestConfigPath,
                rootIntegrationTestsPath,
            ])
        );
        expect(path.resolve(vitestOptions.cwd)).toBe(process.cwd());
        expect(vitestOptions.stdio).toBe("inherit");
    });
});
