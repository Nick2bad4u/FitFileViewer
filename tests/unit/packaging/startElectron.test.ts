import path from "node:path";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

import {
    startElectron,
    startElectronSteps,
} from "../../../scripts/start-electron.mjs";
import {
    buildRuntimeScriptPath,
    runElectronScriptPath,
} from "../../../scripts/lib/workspaces.mjs";

type CommandRunner = (
    command: string,
    args: string[],
    options: { cwd: string; stdio: string }
) => { error?: Error; status: number };

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

describe("start-electron script", () => {
    it("runs the Electron startup pipeline through root-owned scripts", () => {
        expect.assertions(2);

        const steps = startElectronSteps([
            "--inspect=9229",
            "--remote-debugging-port=9222",
        ]);

        expect(steps.map((step) => step.label)).toStrictEqual([
            "build runtime",
            "launch electron",
        ]);
        expect(steps.map((step) => step.args)).toStrictEqual([
            [buildRuntimeScriptPath],
            [
                runElectronScriptPath,
                "--inspect=9229",
                "--remote-debugging-port=9222",
            ],
        ]);
    });

    it("returns zero when every startup step succeeds", () => {
        expect.assertions(3);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 0 });
        const logger = vi.fn<(message: string) => void>();

        const exitStatus = startElectron([], commandRunner, logger);
        expect({
            commandCalls: commandRunner.mock.calls.length,
            loggerCalls: logger.mock.calls.length,
            status: exitStatus,
        }).toStrictEqual({
            commandCalls: 2,
            loggerCalls: 2,
            status: 0,
        });

        const [
            command,
            ,
            options,
        ] = getRequiredCommandCall(commandRunner.mock.calls);

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
            ["[start-electron] build runtime"],
            ["[start-electron] launch electron"],
        ]);
    });

    it("stops after the first failing startup step", () => {
        expect.assertions(3);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValueOnce({ status: 4 });
        const logger = vi.fn<(message: string) => void>();
        const exitStatus = startElectron([], commandRunner, logger);

        expect({
            commandCalls: commandRunner.mock.calls.length,
            loggerCalls: logger.mock.calls.length,
            status: exitStatus,
        }).toStrictEqual({
            commandCalls: 1,
            loggerCalls: 1,
            status: 4,
        });
        expect(
            getRequiredCommandCall(commandRunner.mock.calls)[1]
        ).toStrictEqual([buildRuntimeScriptPath]);
        expect(logger.mock.calls).toStrictEqual([
            ["[start-electron] build runtime"],
        ]);
    });

    it("throws when a startup step runner reports a spawn error", () => {
        expect.assertions(4);

        const spawnError = new Error("spawn failed");
        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ error: spawnError, status: 0 });
        const logger = vi.fn<(message: string) => void>();

        expect(() => startElectron([], commandRunner, logger)).toThrow(
            spawnError
        );
        expect(commandRunner).toHaveBeenCalledOnce();
        expect(
            getRequiredCommandCall(commandRunner.mock.calls)[1]
        ).toStrictEqual([buildRuntimeScriptPath]);
        expect(logger).toHaveBeenCalledWith("[start-electron] build runtime");
    });
});
