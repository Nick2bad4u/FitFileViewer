import path from "node:path";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

import {
    buildTypescriptArgs,
    runTypescriptTask,
} from "../../../scripts/run-typescript.mjs";
import {
    appTypesPath,
    rootElectronAppTsconfigPath,
    rootRuntimeTsconfigPath,
} from "../../../scripts/lib/workspaces.mjs";

type CommandRunner = (
    command: string,
    args: string[],
    options: { cwd: string; stdio: string }
) => { error?: Error; status: number | null };

describe("run-typescript wrapper", () => {
    it("builds root-owned typecheck arguments", () => {
        expect.assertions(2);

        const args = buildTypescriptArgs("typecheck", ["--pretty", "false"]);

        expect(args[0]).toMatch(/[\\/]typescript[\\/]bin[\\/]tsc$/u);
        expect(args.slice(1)).toStrictEqual([
            "--project",
            rootElectronAppTsconfigPath,
            "--noEmit",
            "--pretty",
            "false",
        ]);
    });

    it("builds runtime compile arguments", () => {
        expect.assertions(2);

        const args = buildTypescriptArgs("runtime");

        expect(args[0]).toMatch(/[\\/]typescript[\\/]bin[\\/]tsc$/u);
        expect(args.slice(1)).toStrictEqual([
            "--project",
            rootRuntimeTsconfigPath,
        ]);
    });

    it("builds declaration output arguments for the app source directory", () => {
        expect.assertions(2);

        const args = buildTypescriptArgs("declarations");

        expect(args[0]).toMatch(/[\\/]typescript[\\/]bin[\\/]tsc$/u);
        expect(args.slice(1)).toStrictEqual([
            "--project",
            rootElectronAppTsconfigPath,
            "--declaration",
            "--emitDeclarationOnly",
            "--declarationMap",
            "false",
            "--outDir",
            `./${appTypesPath}`,
        ]);
    });

    it("returns status 1 for unknown tasks without spawning tsc", () => {
        expect.assertions(2);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 0 });
        const consoleErrorSpy = vi
            .spyOn(console, "error")
            .mockReturnValue(undefined);
        const status = runTypescriptTask(["missing"], commandRunner);

        expect({
            commandCalls: commandRunner.mock.calls.length,
            status,
        }).toStrictEqual({
            commandCalls: 0,
            status: 1,
        });
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            "[run-typescript] Expected one of: declarations, runtime, typecheck"
        );

        consoleErrorSpy.mockRestore();
    });

    it("runs TypeScript from the repository root", () => {
        expect.assertions(3);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 7 });

        const status = runTypescriptTask(["runtime"], commandRunner);

        const [
            command,
            args,
            options,
        ] = commandRunner.mock.calls[0] ?? [];

        expect({
            command,
            forwardedArgs: args?.slice(1),
            status,
        }).toStrictEqual({
            command: process.execPath,
            forwardedArgs: ["--project", rootRuntimeTsconfigPath],
            status: 7,
        });
        expect(args?.[0]).toMatch(/[\\/]typescript[\\/]bin[\\/]tsc$/u);
        expect({
            ...options,
            cwd: path.resolve(options?.cwd ?? ""),
        }).toStrictEqual({
            cwd: path.resolve(process.cwd()),
            stdio: "inherit",
        });
    });

    it("throws when TypeScript cannot be started", () => {
        expect.assertions(4);

        const spawnError = new Error("spawn failed");
        const commandRunner = vi.fn<CommandRunner>(() => ({
            error: spawnError,
            status: null,
        }));

        expect(() => runTypescriptTask(["typecheck"], commandRunner)).toThrow(
            spawnError
        );
        expect(commandRunner).toHaveBeenCalledOnce();

        const [
            command,
            args,
            options,
        ] = commandRunner.mock.calls[0] ?? [];

        expect({
            command,
            forwardedArgs: args?.slice(1),
            options: {
                ...options,
                cwd: path.resolve(options?.cwd ?? ""),
            },
        }).toStrictEqual({
            command: process.execPath,
            forwardedArgs: [
                "--project",
                rootElectronAppTsconfigPath,
                "--noEmit",
            ],
            options: {
                cwd: path.resolve(process.cwd()),
                stdio: "inherit",
            },
        });
        expect(args?.[0]).toMatch(/[\\/]typescript[\\/]bin[\\/]tsc$/u);
    });
});
