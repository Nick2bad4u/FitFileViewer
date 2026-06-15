import path from "node:path";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

import {
    bundlePreloadScriptPath,
    bundleMainScriptPath,
    cleanRuntimeDistScriptPath,
    formatRuntimeOutputScriptPath,
    prepareRuntimeDistScriptPath,
    rootRuntimeTsconfigPath,
    rootViteRendererConfigPath,
    validateRuntimeTsconfigScriptPath,
} from "../../../scripts/lib/workspaces.mjs";
import {
    buildRuntimeSteps,
    runBuildRuntime,
} from "../../../scripts/build-runtime.mjs";

type CommandRunner = (
    command: string,
    args: string[],
    options: { cwd: string; stdio: string }
) => { error?: Error; status: number };
type CommandCall = Parameters<CommandRunner>;

function getRequiredCommandCall(
    commandRunner: ReturnType<typeof vi.fn<CommandRunner>>,
    index: number
): CommandCall {
    const commandCall = commandRunner.mock.calls.at(index);

    if (!commandCall) {
        throw new TypeError(`Expected command call at index ${index}`);
    }

    return commandCall;
}

describe("build-runtime script", () => {
    it("runs the runtime build pipeline through root-owned scripts", () => {
        expect.assertions(2);

        expect(buildRuntimeSteps.map((step) => step.label)).toStrictEqual([
            "clean runtime dist",
            "validate runtime TypeScript file list",
            "compile runtime TypeScript",
            "bundle main",
            "bundle preload",
            "build renderer bundle",
            "format runtime output",
            "prepare runtime dist",
        ]);
        expect(buildRuntimeSteps.map((step) => step.args)).toStrictEqual([
            [cleanRuntimeDistScriptPath],
            [validateRuntimeTsconfigScriptPath],
            [
                expect.stringMatching(/[\\/]typescript[\\/]bin[\\/]tsc$/u),
                "--project",
                rootRuntimeTsconfigPath,
            ],
            [bundleMainScriptPath],
            [bundlePreloadScriptPath],
            [
                expect.stringMatching(/[\\/]vite[\\/]bin[\\/]vite\.js$/u),
                "build",
                "--config",
                rootViteRendererConfigPath,
            ],
            [formatRuntimeOutputScriptPath],
            [prepareRuntimeDistScriptPath],
        ]);
    });

    it("returns zero when every build step succeeds", () => {
        expect.assertions(3);

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
        ] = getRequiredCommandCall(commandRunner, 0);

        expect({
            command,
            ...options,
            cwd: path.resolve(options.cwd),
        }).toStrictEqual({
            command: process.execPath,
            cwd: path.resolve(process.cwd()),
            stdio: "inherit",
        });
        expect(logger.mock.calls).toStrictEqual(
            buildRuntimeSteps.map((step) => [`[build-runtime] ${step.label}`])
        );
    });

    it("stops after the first failing build step", () => {
        expect.assertions(3);

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
        expect(commandRunner.mock.calls.map(([, args]) => args)).toStrictEqual([
            [cleanRuntimeDistScriptPath],
            [validateRuntimeTsconfigScriptPath],
        ]);
        expect(logger.mock.calls).toStrictEqual([
            ["[build-runtime] clean runtime dist"],
            ["[build-runtime] validate runtime TypeScript file list"],
        ]);
    });

    it("throws when a build step runner reports a spawn error", () => {
        expect.assertions(4);

        const spawnError = new Error("spawn failed");
        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ error: spawnError, status: 0 });
        const logger = vi.fn<(message: string) => void>();

        expect(() => runBuildRuntime(commandRunner, logger)).toThrow(
            spawnError
        );
        expect(commandRunner).toHaveBeenCalledOnce();
        expect(getRequiredCommandCall(commandRunner, 0)[1]).toStrictEqual([
            cleanRuntimeDistScriptPath,
        ]);
        expect(logger).toHaveBeenCalledWith(
            "[build-runtime] clean runtime dist"
        );
    });
});
