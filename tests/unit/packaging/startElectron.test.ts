import path from "node:path";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

import {
    startElectron,
    startElectronSteps,
} from "../../../scripts/start-electron.mjs";

type CommandRunner = (
    command: string,
    args: string[],
    options: { cwd: string; stdio: string }
) => { error?: Error; status: number };

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
            [path.join(process.cwd(), "scripts", "build-runtime.mjs")],
            [
                path.join(process.cwd(), "scripts", "run-electron.mjs"),
                "--inspect=9229",
                "--remote-debugging-port=9222",
            ],
        ]);
    });

    it("returns zero when every startup step succeeds", () => {
        expect.assertions(5);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 0 });
        const logger = vi.fn<(message: string) => void>();

        expect(startElectron([], commandRunner, logger)).toBe(0);
        expect(commandRunner).toHaveBeenCalledTimes(2);
        expect(logger).toHaveBeenCalledTimes(2);

        const [
            command,
            ,
            options,
        ] = commandRunner.mock.calls[0] ?? [];

        expect(command).toBe(process.execPath);
        expect({
            ...options,
            cwd: path.resolve(options?.cwd ?? ""),
        }).toStrictEqual({
            cwd: path.resolve(process.cwd()),
            stdio: "inherit",
        });
    });

    it("stops after the first failing startup step", () => {
        expect.assertions(3);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValueOnce({ status: 4 });
        const logger = vi.fn<(message: string) => void>();

        expect(startElectron([], commandRunner, logger)).toBe(4);
        expect(commandRunner).toHaveBeenCalledOnce();
        expect(logger).toHaveBeenCalledOnce();
    });

    it("throws when a startup step runner reports a spawn error", () => {
        expect.assertions(1);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ error: new Error("spawn failed"), status: 0 });
        const logger = vi.fn<(message: string) => void>();

        expect(() => startElectron([], commandRunner, logger)).toThrow(
            "spawn failed"
        );
    });
});
