import path from "node:path";

import { describe, expect, it, vi } from "vitest";

type RunEslintModule = {
    buildEslintArgs: (targetName: string, userArgs?: string[]) => string[];
    runEslintTarget: (
        targetName: string,
        userArgs?: string[],
        commandRunner?: (
            command: string,
            args: string[],
            options: { cwd: string; stdio: string }
        ) => { error?: Error; status: number | null }
    ) => number;
};

async function importRunEslint(): Promise<RunEslintModule> {
    return (await import("../../../scripts/run-eslint.mjs")) as RunEslintModule;
}

describe("run-eslint script", () => {
    it("builds root-owned ESLint target arguments", async () => {
        expect.assertions(4);

        const { buildEslintArgs } = await importRunEslint();

        expect(buildEslintArgs("root", ["--fix"])).toStrictEqual([
            "--cache",
            "--cache-strategy",
            "content",
            "--cache-location",
            ".cache/.eslintcache-root",
            "--fix",
            ".",
            "--ignore-pattern",
            "electron-app/**",
            "--ignore-pattern",
            "docusaurus/**",
        ]);
        expect(buildEslintArgs("electronApp")).toStrictEqual([
            "--config",
            "eslint.config.mjs",
            "--quiet",
            "--cache",
            "--cache-strategy",
            "content",
            "--cache-location",
            ".cache/.eslintcache-electron",
            "electron-app",
        ]);
        expect(buildEslintArgs("docusaurus")).toStrictEqual([
            "--config",
            "eslint.config.mjs",
            "--cache",
            "--cache-strategy",
            "content",
            "--cache-location",
            ".cache/.eslintcache-docusaurus",
            "docusaurus/**/*.{js,jsx,ts,tsx}",
        ]);
        expect(() => buildEslintArgs("missing")).toThrow(
            "Unknown ESLint target: missing"
        );
    });

    it("runs ESLint from the repository root and returns the process status", async () => {
        expect.assertions(5);

        const { runEslintTarget } = await importRunEslint();
        const commandRunner = vi.fn<
            (
                command: string,
                args: string[],
                options: { cwd: string; stdio: string }
            ) => { status: number }
        >(() => ({ status: 7 }));

        expect(runEslintTarget("root", ["--fix"], commandRunner)).toBe(7);

        const [
            command,
            args,
            options,
        ] = commandRunner.mock.calls[0] ?? [];

        expect(command).toBe(process.execPath);
        expect(args?.[0]).toMatch(/[\\/]eslint[\\/]bin[\\/]eslint\.js$/u);
        expect(args).toContain(".cache/.eslintcache-root");
        expect({
            ...options,
            cwd: path.resolve(options?.cwd ?? ""),
        }).toStrictEqual({
            cwd: path.resolve(process.cwd()),
            stdio: "inherit",
        });
    });
});
