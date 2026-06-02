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
type CommandCall = Parameters<CommandRunner>;

function getRequiredCommandCall(
    commandRunner: ReturnType<typeof vi.fn<CommandRunner>>,
    index: number
): CommandCall {
    const commandCall = commandRunner.mock.calls.at(index);

    if (!commandCall) {
        throw new TypeError(`Expected command call at index ${index}`);
    }

    return commandCall;
}

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
        ] = getRequiredCommandCall(commandRunner, 0);

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
            cwd: path.resolve(options.cwd),
        }).toStrictEqual({
            cwd: path.resolve(process.cwd()),
            stdio: "inherit",
        });
    });

    it("returns a failing status from Vite", () => {
        expect.assertions(2);

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
        expect(getRequiredCommandCall(commandRunner, 0)[1]).toStrictEqual(
            buildRendererArgs([])
        );
    });

    it("throws when Vite cannot be started", () => {
        expect.assertions(4);

        const spawnError = new Error("spawn failed");
        const commandRunner = vi.fn<CommandRunner>().mockReturnValue({
            error: spawnError,
            status: 0,
        });

        expect(() => runViteBuild([], commandRunner)).toThrow(spawnError);
        expect(commandRunner).toHaveBeenCalledOnce();

        const [
            command,
            args,
            options,
        ] = getRequiredCommandCall(commandRunner, 0);

        expect({ args, command }).toStrictEqual({
            args: buildRendererArgs([]),
            command: process.execPath,
        });
        expect({
            ...options,
            cwd: path.resolve(options.cwd),
        }).toStrictEqual({
            cwd: path.resolve(process.cwd()),
            stdio: "inherit",
        });
    });
});
