import path from "node:path";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

import {
    lintElectronAppSteps,
    runLintElectronApp,
} from "../../../scripts/lint-electron-app.mjs";

type CommandRunner = (
    command: string,
    args: string[],
    options: { cwd: string; stdio: string }
) => { error?: Error; status: number };

describe("lint-electron-app script", () => {
    it("builds the Electron app lint pipeline from root-owned scripts", () => {
        expect.assertions(1);

        expect(lintElectronAppSteps(["--fix"])).toStrictEqual([
            {
                args: ["--fix"],
                label: "eslint",
                target: "electronApp",
                type: "eslint",
            },
            {
                args: [
                    path.join(process.cwd(), "scripts", "run-typescript.mjs"),
                    "typecheck",
                ],
                label: "typecheck",
                type: "script",
            },
        ]);
    });

    it("runs ESLint and typecheck in order", () => {
        expect.assertions(7);

        const eslintRunner = vi.fn<(target: string, args: string[]) => number>(
            () => 0
        );
        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 0 });
        const logger = vi.fn<(message: string) => void>();

        expect(
            runLintElectronApp(["--fix"], eslintRunner, commandRunner, logger)
        ).toBe(0);
        expect(eslintRunner).toHaveBeenCalledWith("electronApp", ["--fix"]);
        expect(commandRunner).toHaveBeenCalledOnce();
        expect(logger).toHaveBeenCalledTimes(2);

        const [
            command,
            args,
            options,
        ] = commandRunner.mock.calls[0] ?? [];

        expect(command).toBe(process.execPath);
        expect(args).toStrictEqual([
            path.join(process.cwd(), "scripts", "run-typescript.mjs"),
            "typecheck",
        ]);
        expect({
            ...options,
            cwd: path.resolve(options?.cwd ?? ""),
        }).toStrictEqual({
            cwd: path.resolve(process.cwd()),
            stdio: "inherit",
        });
    });

    it("stops before typecheck when ESLint fails", () => {
        expect.assertions(3);

        const eslintRunner = vi.fn<(target: string, args: string[]) => number>(
            () => 3
        );
        const commandRunner = vi.fn<CommandRunner>();
        const logger = vi.fn<(message: string) => void>();

        expect(
            runLintElectronApp([], eslintRunner, commandRunner, logger)
        ).toBe(3);
        expect(commandRunner).not.toHaveBeenCalled();
        expect(logger).toHaveBeenCalledOnce();
    });

    it("throws when typecheck cannot be started", () => {
        expect.assertions(1);

        const eslintRunner = vi.fn<(target: string, args: string[]) => number>(
            () => 0
        );
        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ error: new Error("spawn failed"), status: 0 });
        const logger = vi.fn<(message: string) => void>();

        expect(() =>
            runLintElectronApp([], eslintRunner, commandRunner, logger)
        ).toThrow("spawn failed");
    });
});
