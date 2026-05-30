import path from "node:path";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

import {
    buildPackageSteps,
    runBuildPackage,
} from "../../../scripts/build-package.mjs";

type CommandRunner = (
    command: string,
    args: string[],
    options: { cwd: string; stdio: string }
) => { error?: Error; status: number };

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
            [path.join(process.cwd(), "scripts", "build-runtime.mjs")],
            [
                path.join(process.cwd(), "scripts", "run-electron-builder.mjs"),
                "--node-env",
                "production",
                "--dir",
            ],
        ]);
    });

    it("returns zero when every package step succeeds", () => {
        expect.hasAssertions();

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

    it("stops after the first failing package step", () => {
        expect.assertions(1);

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
    });

    it("throws when a package step runner reports a spawn error", () => {
        expect.assertions(1);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ error: new Error("spawn failed"), status: 0 });
        const logger = vi.fn<(message: string) => void>();

        expect(() => runBuildPackage([], commandRunner, logger)).toThrow(
            "spawn failed"
        );
    });
});
