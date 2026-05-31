import path from "node:path";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

import {
    buildTypescriptArgs,
    runTypescriptTask,
} from "../../../scripts/run-typescript.mjs";
import {
    rootElectronAppTsconfigPath,
    rootRuntimeTsconfigPath,
} from "../../../scripts/lib/workspaces.mjs";

type CommandRunner = (
    command: string,
    args: string[],
    options: { cwd: string; stdio: string }
) => { status: number };

describe("run-typescript wrapper", () => {
    it("builds root-owned typecheck arguments", () => {
        expect.assertions(4);

        const args = buildTypescriptArgs("typecheck", ["--pretty", "false"]);

        expect(args[0]).toMatch(/[\\/]typescript[\\/]bin[\\/]tsc$/u);
        expect(args).toContain(rootElectronAppTsconfigPath);
        expect(args).toContain("--noEmit");
        expect(args).toContain("--pretty");
    });

    it("builds runtime compile arguments", () => {
        expect.assertions(1);

        expect(buildTypescriptArgs("runtime").slice(1)).toStrictEqual([
            "--project",
            rootRuntimeTsconfigPath,
        ]);
    });

    it("builds declaration output arguments for the app source directory", () => {
        expect.assertions(1);

        expect(buildTypescriptArgs("declarations").slice(1)).toStrictEqual([
            "--project",
            rootElectronAppTsconfigPath,
            "--declaration",
            "--emitDeclarationOnly",
            "--declarationMap",
            "false",
            "--outDir",
            `./${path.join("electron-app", "types")}`,
        ]);
    });

    it("returns status 1 for unknown tasks without spawning tsc", () => {
        expect.assertions(1);

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

        consoleErrorSpy.mockRestore();
    });

    it("runs TypeScript from the repository root", () => {
        expect.hasAssertions();

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
            status,
        }).toStrictEqual({
            command: process.execPath,
            status: 7,
        });
        expect(args?.[0]).toMatch(/[\\/]typescript[\\/]bin[\\/]tsc$/u);
        expect(args).toContain(rootRuntimeTsconfigPath);
        expect({
            ...options,
            cwd: path.resolve(options?.cwd ?? ""),
        }).toStrictEqual({
            cwd: path.resolve(process.cwd()),
            stdio: "inherit",
        });
    });
});
