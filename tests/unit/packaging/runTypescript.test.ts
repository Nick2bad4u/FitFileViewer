import path from "node:path";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

import {
    buildTypescriptArgs,
    runTypescriptTask,
} from "../../../scripts/run-typescript.mjs";

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
        expect(args).toContain("tsconfig.electron-app.json");
        expect(args).toContain("--noEmit");
        expect(args).toContain("--pretty");
    });

    it("builds runtime compile arguments", () => {
        expect.assertions(1);

        expect(buildTypescriptArgs("runtime").slice(1)).toStrictEqual([
            "--project",
            "tsconfig.runtime.json",
        ]);
    });

    it("builds declaration output arguments for the app workspace", () => {
        expect.assertions(1);

        expect(buildTypescriptArgs("declarations").slice(1)).toStrictEqual([
            "--project",
            "tsconfig.electron-app.json",
            "--declaration",
            "--emitDeclarationOnly",
            "--declarationMap",
            "false",
            "--outDir",
            `./${path.join("electron-app", "types")}`,
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

        expect(runTypescriptTask(["missing"], commandRunner)).toBe(1);
        expect(commandRunner).not.toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
    });

    it("runs TypeScript from the repository root", () => {
        expect.assertions(5);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 7 });

        expect(runTypescriptTask(["runtime"], commandRunner)).toBe(7);

        const [
            command,
            args,
            options,
        ] = commandRunner.mock.calls[0] ?? [];

        expect(command).toBe(process.execPath);
        expect(args?.[0]).toMatch(/[\\/]typescript[\\/]bin[\\/]tsc$/u);
        expect(args).toContain("tsconfig.runtime.json");
        expect({
            ...options,
            cwd: path.resolve(options?.cwd ?? ""),
        }).toStrictEqual({
            cwd: path.resolve(process.cwd()),
            stdio: "inherit",
        });
    });
});
