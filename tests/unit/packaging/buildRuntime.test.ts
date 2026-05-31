import path from "node:path";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

import { repositoryScriptPath } from "../../../scripts/lib/workspaces.mjs";
import {
    buildRuntimeSteps,
    runBuildRuntime,
} from "../../../scripts/build-runtime.mjs";

type CommandRunner = (
    command: string,
    args: string[],
    options: { cwd: string; stdio: string }
) => { error?: Error; status: number };

describe("build-runtime script", () => {
    it("runs the runtime build pipeline through root-owned scripts", () => {
        expect.assertions(2);

        expect(buildRuntimeSteps.map((step) => step.label)).toStrictEqual([
            "clean runtime dist",
            "validate runtime TypeScript file list",
            "compile runtime TypeScript",
            "bundle preload",
            "build renderer bundle",
            "format runtime output",
            "prepare runtime dist",
        ]);
        expect(buildRuntimeSteps.map((step) => step.args)).toStrictEqual([
            [repositoryScriptPath("clean-runtime-dist.mjs")],
            [repositoryScriptPath("validate-runtime-tsconfig.mjs")],
            [repositoryScriptPath("run-typescript.mjs"), "runtime"],
            [repositoryScriptPath("bundle-preload.mjs")],
            [repositoryScriptPath("build-renderer.mjs")],
            [repositoryScriptPath("format-runtime-output.mjs")],
            [repositoryScriptPath("prepare-runtime-dist.mjs")],
        ]);
    });

    it("returns zero when every build step succeeds", () => {
        expect.hasAssertions();

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 0 });
        const logger = vi.fn<(message: string) => void>();

        const status = runBuildRuntime(commandRunner, logger);
        expect({
            commandCalls: commandRunner.mock.calls.length,
            loggerCalls: logger.mock.calls.length,
            status,
        }).toStrictEqual({
            commandCalls: buildRuntimeSteps.length,
            loggerCalls: buildRuntimeSteps.length,
            status: 0,
        });

        const [
            command,
            ,
            options,
        ] = commandRunner.mock.calls[0] ?? [];

        expect({
            command,
            ...options,
            cwd: path.resolve(options?.cwd ?? ""),
        }).toStrictEqual({
            command: process.execPath,
            cwd: path.resolve(process.cwd()),
            stdio: "inherit",
        });
    });

    it("stops after the first failing build step", () => {
        expect.assertions(1);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValueOnce({ status: 0 })
            .mockReturnValueOnce({ status: 9 });
        const logger = vi.fn<(message: string) => void>();
        const status = runBuildRuntime(commandRunner, logger);

        expect({
            commandCalls: commandRunner.mock.calls.length,
            loggerCalls: logger.mock.calls.length,
            status,
        }).toStrictEqual({
            commandCalls: 2,
            loggerCalls: 2,
            status: 9,
        });
    });

    it("throws when a build step runner reports a spawn error", () => {
        expect.assertions(1);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ error: new Error("spawn failed"), status: 0 });
        const logger = vi.fn<(message: string) => void>();

        expect(() => runBuildRuntime(commandRunner, logger)).toThrow(
            "spawn failed"
        );
    });
});
