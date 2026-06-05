import path from "node:path";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

import {
    buildPlaywrightEnvironment,
    buildPlaywrightNodeOptions,
    playwrightCliPath,
    playwrightNodeWarningOptions,
    runPlaywright,
    runPlaywrightSteps,
} from "../../../scripts/run-playwright.mjs";
import {
    buildRuntimeScriptPath,
    rootPlaywrightConfigPath,
} from "../../../scripts/lib/workspaces.mjs";

type CommandRunner = (
    command: string,
    args: string[],
    options: { cwd: string; env?: NodeJS.ProcessEnv; stdio: string }
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

function getRequiredPlaywrightStep(
    steps: ReturnType<typeof runPlaywrightSteps>,
    index: number
): ReturnType<typeof runPlaywrightSteps>[number] {
    const step = steps[index];

    if (!step) {
        throw new Error(`Expected Playwright step ${index}`);
    }

    return step;
}

describe("run-playwright script", () => {
    it("runs the Playwright pipeline through root-owned scripts", () => {
        expect.assertions(7);

        const steps = runPlaywrightSteps([
            "--headed",
            "--project",
            "electron",
        ]);
        const runtimeBuildStep = getRequiredPlaywrightStep(steps, 0);
        const playwrightStep = getRequiredPlaywrightStep(steps, 1);

        expect(steps.map((step) => step.label)).toStrictEqual([
            "build runtime",
            "run playwright",
        ]);
        expect(runtimeBuildStep.args).toStrictEqual([buildRuntimeScriptPath]);
        expect(playwrightStep.args).toStrictEqual([
            playwrightCliPath,
            "test",
            "--config",
            rootPlaywrightConfigPath,
            "--headed",
            "--project",
            "electron",
        ]);
        expect(playwrightCliPath).toMatch(
            /[\\/]@playwright[\\/]test[\\/]cli\.js$/u
        );
        expect(playwrightNodeWarningOptions).toStrictEqual([
            "--disable-warning=DEP0205",
        ]);
        expect(buildPlaywrightNodeOptions("")).toBe(
            "--disable-warning=DEP0205"
        );
        expect(buildPlaywrightEnvironment({ NODE_OPTIONS: "--trace-warnings" }))
            .toMatchObject({
                NODE_OPTIONS: "--trace-warnings --disable-warning=DEP0205",
            });
    });

    it("returns zero when every Playwright step succeeds", () => {
        expect.assertions(2);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 0 });
        const logger = vi.fn<(message: string) => void>();

        const status = runPlaywright([], commandRunner, logger);
        expect({
            commandCalls: commandRunner.mock.calls.length,
            loggerMessages: logger.mock.calls.map(([message]) => message),
            status,
        }).toStrictEqual({
            commandCalls: 2,
            loggerMessages: [
                "[run-playwright] build runtime",
                "[run-playwright] run playwright",
            ],
            status: 0,
        });

        expect(
            commandRunner.mock.calls.map(
                ([
                    command,
                    args,
                    options,
                ]) => ({
                    args,
                    command,
                    options: {
                        cwd: path.resolve(options.cwd),
                        cwdIsNestedElectronApp: path
                            .resolve(options.cwd)
                            .includes(`${path.sep}electron-app${path.sep}`),
                        cwdRelativeToRepository: path.relative(
                            process.cwd(),
                            path.resolve(options.cwd)
                        ),
                        nodeOptions: options.env?.NODE_OPTIONS,
                        stdio: options.stdio,
                    },
                })
            )
        ).toStrictEqual([
            {
                args: [buildRuntimeScriptPath],
                command: process.execPath,
                options: {
                    cwd: path.resolve(process.cwd()),
                    cwdIsNestedElectronApp: false,
                    cwdRelativeToRepository: "",
                    stdio: "inherit",
                    nodeOptions: undefined,
                },
            },
            {
                args: [
                    playwrightCliPath,
                    "test",
                    "--config",
                    rootPlaywrightConfigPath,
                ],
                command: process.execPath,
                options: {
                    cwd: path.resolve(process.cwd()),
                    cwdIsNestedElectronApp: false,
                    cwdRelativeToRepository: "",
                    stdio: "inherit",
                    nodeOptions: "--disable-warning=DEP0205",
                },
            },
        ]);
    });

    it("stops after the first failing Playwright step", () => {
        expect.assertions(3);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValueOnce({ status: 0 })
            .mockReturnValueOnce({ status: 5 });
        const logger = vi.fn<(message: string) => void>();
        const status = runPlaywright([], commandRunner, logger);

        expect({
            commandCalls: commandRunner.mock.calls.length,
            loggerCalls: logger.mock.calls.length,
            status,
        }).toStrictEqual({
            commandCalls: 2,
            loggerCalls: 2,
            status: 5,
        });
        expect(commandRunner.mock.calls.map(([, args]) => args)).toStrictEqual([
            [buildRuntimeScriptPath],
            [
                playwrightCliPath,
                "test",
                "--config",
                rootPlaywrightConfigPath,
            ],
        ]);
        expect(logger.mock.calls).toStrictEqual([
            ["[run-playwright] build runtime"],
            ["[run-playwright] run playwright"],
        ]);
    });

    it("returns the runtime build failure before launching Playwright", () => {
        expect.assertions(2);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 7 });
        const logger = vi.fn<(message: string) => void>();

        const status = runPlaywright(["--headed"], commandRunner, logger);

        expect(status).toBe(7);
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

    it("throws when a Playwright step runner reports a spawn error", () => {
        expect.assertions(4);

        const spawnError = new Error("spawn failed");
        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ error: spawnError, status: 0 });
        const logger = vi.fn<(message: string) => void>();

        expect(() => runPlaywright([], commandRunner, logger)).toThrow(
            spawnError
        );
        expect(commandRunner).toHaveBeenCalledOnce();
        expect(
            getRequiredCommandCall(commandRunner.mock.calls)[1]
        ).toStrictEqual([buildRuntimeScriptPath]);
        expect(logger).toHaveBeenCalledWith("[run-playwright] build runtime");
    });
});
