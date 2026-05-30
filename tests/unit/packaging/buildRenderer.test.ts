import path from "node:path";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

import { rootViteRendererConfigPath } from "../../../scripts/lib/workspaces.mjs";
import {
    buildRendererArgs,
    rendererViteConfigPath,
    runBuildRenderer as runViteBuild,
    viteCliPath,
} from "../../../scripts/build-renderer.mjs";

type CommandRunner = (
    command: string,
    args: string[],
    options: { cwd: string; stdio: string }
) => { error?: Error; status: number | null };

describe("build-renderer script", () => {
    it("builds renderer Vite args from root-owned config", () => {
        expect.assertions(2);

        expect(buildRendererArgs(["--mode", "development"])).toStrictEqual([
            viteCliPath,
            "build",
            "--config",
            rendererViteConfigPath,
            "--mode",
            "development",
        ]);
        expect({
            rendererViteConfigPath,
            viteCliPathMatches: /[\\/]vite[\\/]bin[\\/]vite\.js$/u.test(
                viteCliPath
            ),
        }).toStrictEqual({
            rendererViteConfigPath: rootViteRendererConfigPath,
            viteCliPathMatches: true,
        });
    });

    it("runs Vite from the repository root", () => {
        expect.assertions(2);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 0 });

        const exitStatus = runViteBuild(["--debug"], commandRunner);
        const [
            command,
            args,
            options,
        ] = commandRunner.mock.calls[0] ?? [];

        expect({
            args,
            command,
            status: exitStatus,
        }).toStrictEqual({
            args: buildRendererArgs(["--debug"]),
            command: process.execPath,
            status: 0,
        });
        expect({
            ...options,
            cwd: path.resolve(options?.cwd ?? ""),
        }).toStrictEqual({
            cwd: path.resolve(process.cwd()),
            stdio: "inherit",
        });
    });

    it("returns a failing status from Vite", () => {
        expect.assertions(1);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 8 });

        const exitStatus = runViteBuild([], commandRunner);

        expect({
            commandCalls: commandRunner.mock.calls.length,
            status: exitStatus,
        }).toStrictEqual({
            commandCalls: 1,
            status: 8,
        });
    });

    it("throws when Vite cannot be started", () => {
        expect.assertions(1);

        const commandRunner = vi.fn<CommandRunner>().mockReturnValue({
            error: new Error("spawn failed"),
            status: 0,
        });

        expect(() => runViteBuild([], commandRunner)).toThrow("spawn failed");
    });
});
