import path from "node:path";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

import {
    playwrightCliPath,
    runPlaywright,
    runPlaywrightSteps,
} from "../../../scripts/run-playwright.mjs";

type CommandRunner = (
    command: string,
    args: string[],
    options: { cwd: string; stdio: string }
) => { error?: Error; status: number };

describe("run-playwright script", () => {
    it("runs the Playwright pipeline through root-owned scripts", () => {
        expect.assertions(4);

        const steps = runPlaywrightSteps([
            "--headed",
            "--project",
            "electron",
        ]);

        expect(steps.map((step) => step.label)).toStrictEqual([
            "build runtime",
            "run playwright",
        ]);
        expect(steps[0]?.args).toStrictEqual([
            path.join(process.cwd(), "scripts", "build-runtime.mjs"),
        ]);
        expect(steps[1]?.args).toStrictEqual([
            playwrightCliPath,
            "test",
            "--config",
            "playwright.config.ts",
            "--headed",
            "--project",
            "electron",
        ]);
        expect(playwrightCliPath).toMatch(
            /[\\/]@playwright[\\/]test[\\/]cli\.js$/u
        );
    });

    it("returns zero when every Playwright step succeeds", () => {
        expect.hasAssertions();

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 0 });
        const logger = vi.fn<(message: string) => void>();

        const status = runPlaywright([], commandRunner, logger);
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

    it("stops after the first failing Playwright step", () => {
        expect.assertions(1);

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
    });

    it("throws when a Playwright step runner reports a spawn error", () => {
        expect.assertions(1);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ error: new Error("spawn failed"), status: 0 });
        const logger = vi.fn<(message: string) => void>();

        expect(() => runPlaywright([], commandRunner, logger)).toThrow(
            "spawn failed"
        );
    });
});
