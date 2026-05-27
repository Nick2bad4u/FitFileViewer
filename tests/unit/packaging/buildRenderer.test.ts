import path from "node:path";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

import {
    buildRendererArgs,
    rendererViteConfigPath,
    runBuildRenderer,
    viteCliPath,
} from "../../../scripts/build-renderer.mjs";

type CommandRunner = (
    command: string,
    args: string[],
    options: { cwd: string; stdio: string }
) => { error?: Error; status: number | null };

describe("build-renderer script", () => {
    it("builds renderer Vite args from root-owned config", () => {
        expect.assertions(3);

        expect(buildRendererArgs(["--mode", "development"])).toStrictEqual([
            viteCliPath,
            "build",
            "--config",
            rendererViteConfigPath,
            "--mode",
            "development",
        ]);
        expect(rendererViteConfigPath).toBe("vite.renderer.config.mjs");
        expect(viteCliPath).toMatch(/[\\/]vite[\\/]bin[\\/]vite\.js$/u);
    });

    it("runs Vite from the repository root", () => {
        expect.assertions(4);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 0 });

        expect(runBuildRenderer(["--debug"], commandRunner)).toBe(0);

        const [
            command,
            args,
            options,
        ] = commandRunner.mock.calls[0] ?? [];

        expect(command).toBe(process.execPath);
        expect(args).toStrictEqual(buildRendererArgs(["--debug"]));
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

        expect(runBuildRenderer([], commandRunner)).toBe(8);
    });

    it("throws when Vite cannot be started", () => {
        expect.assertions(1);

        const commandRunner = vi.fn<CommandRunner>().mockReturnValue({
            error: new Error("spawn failed"),
            status: 0,
        });

        expect(() => runBuildRenderer([], commandRunner)).toThrow(
            "spawn failed"
        );
    });
});
