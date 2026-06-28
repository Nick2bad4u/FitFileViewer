import path from "node:path";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

import {
    buildPackageSteps,
    runBuildPackage,
} from "../../../scripts/build-package.mjs";
import {
    buildRuntimeScriptPath,
    runElectronBuilderScriptPath,
} from "../../../scripts/lib/workspaces.mjs";

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

describe("build-package script", () => {
    it("runs the package pipeline through root-owned scripts", () => {
        expect.assertions(2);

        const steps = buildPackageSteps([
            "--node-env",
            "production",
            "--dir",
        ]);

        expect(steps.map((step) => step.label)).toStrictEqual([
            "build runtime",
            "run electron-builder",
        ]);
        expect(steps.map((step) => step.args)).toStrictEqual([
            [buildRuntimeScriptPath],
            [
                runElectronBuilderScriptPath,
                "--node-env",
                "production",
                "--dir",
            ],
        ]);
    });

    it("returns zero when every package step succeeds", () => {
        expect.assertions(3);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 0 });
        const logger = vi.fn<(message: string) => void>();

        const status = runBuildPackage([], commandRunner, logger);
        expect({
            commandCalls: commandRunner.mock.calls.length,
            loggerCalls: logger.mock.calls.length,
            status,
        }).toStrictEqual({
            commandCalls: 2,
            loggerCalls: 2,
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
        expect(logger.mock.calls).toStrictEqual([
            ["[build-package] build runtime"],
            ["[build-package] run electron-builder"],
        ]);
    });

    it("stops after the first failing package step", () => {
        expect.assertions(3);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValueOnce({ status: 7 });
        const logger = vi.fn<(message: string) => void>();
        const status = runBuildPackage([], commandRunner, logger);

        expect({
            commandCalls: commandRunner.mock.calls.length,
            loggerCalls: logger.mock.calls.length,
            status,
        }).toStrictEqual({
            commandCalls: 1,
            loggerCalls: 1,
            status: 7,
        });
        expect(getRequiredCommandCall(commandRunner, 0)[1]).toStrictEqual([
            buildRuntimeScriptPath,
        ]);
        expect(logger.mock.calls).toStrictEqual([
            ["[build-package] build runtime"],
        ]);
    });

    it("throws when a package step runner reports a spawn error", () => {
        expect.assertions(4);

        const spawnError = new Error("spawn failed");
        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ error: spawnError, status: 0 });
        const logger = vi.fn<(message: string) => void>();

        expect(() => runBuildPackage([], commandRunner, logger)).toThrow(
            spawnError
        );
        expect(commandRunner).toHaveBeenCalledOnce();
        expect(getRequiredCommandCall(commandRunner, 0)[1]).toStrictEqual([
            buildRuntimeScriptPath,
        ]);
        expect(logger).toHaveBeenCalledWith("[build-package] build runtime");
    });
});
