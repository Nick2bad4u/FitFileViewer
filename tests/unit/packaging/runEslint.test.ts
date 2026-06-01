import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
    adHocEslintCachePath,
    appEslintCachePath,
    appSourceDirectoryName,
    docusaurusEslintCachePath,
    docusaurusWorkspaceName,
    rootEslintCachePath,
    rootEslintConfigPath,
} from "../../../scripts/lib/workspaces.mjs";

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
        expect.assertions(6);

        const { buildEslintArgs } = await importRunEslint();
        const scriptPath = "scripts/prepare-runtime-dist.mjs";
        const testPath = "tests/unit/packaging/runEslint.test.ts";

        expect(buildEslintArgs("root", ["--fix"])).toStrictEqual([
            "--cache",
            "--cache-strategy",
            "content",
            "--cache-location",
            rootEslintCachePath,
            "--fix",
            ".",
            "--ignore-pattern",
            `${appSourceDirectoryName}/**`,
            "--ignore-pattern",
            `${docusaurusWorkspaceName}/**`,
        ]);
        expect(buildEslintArgs("electronApp")).toStrictEqual([
            "--config",
            rootEslintConfigPath,
            "--quiet",
            "--cache",
            "--cache-strategy",
            "content",
            "--cache-location",
            appEslintCachePath,
            appSourceDirectoryName,
        ]);
        expect(buildEslintArgs("docusaurus")).toStrictEqual([
            "--config",
            rootEslintConfigPath,
            "--cache",
            "--cache-strategy",
            "content",
            "--cache-location",
            docusaurusEslintCachePath,
            `${docusaurusWorkspaceName}/**/*.{js,jsx,ts,tsx}`,
        ]);
        expect(buildEslintArgs(testPath, ["--fix"])).toStrictEqual([
            "--config",
            rootEslintConfigPath,
            "--cache",
            "--cache-strategy",
            "content",
            "--cache-location",
            adHocEslintCachePath,
            "--fix",
            testPath,
        ]);
        expect(
            buildEslintArgs(scriptPath, ["--no-warn-ignored"])
        ).toStrictEqual([
            "--config",
            rootEslintConfigPath,
            "--cache",
            "--cache-strategy",
            "content",
            "--cache-location",
            adHocEslintCachePath,
            "--no-warn-ignored",
            scriptPath,
        ]);
        expect(() => buildEslintArgs("missing")).toThrow(
            "Unknown ESLint target: missing"
        );
    });

    it("runs ESLint from the repository root and returns the process status", async () => {
        expect.assertions(2);

        const { runEslintTarget } = await importRunEslint();
        const commandRunner = vi.fn<
            (
                command: string,
                args: string[],
                options: { cwd: string; stdio: string }
            ) => { status: number }
        >(() => ({ status: 7 }));

        const exitStatus = runEslintTarget("root", ["--fix"], commandRunner);

        const [
            command,
            args,
            options,
        ] = commandRunner.mock.calls[0] ?? [];

        expect(commandRunner).toHaveBeenCalledOnce();
        expect({
            command,
            eslintCliPath: args?.[0],
            exitStatus,
            forwardedArgs: args?.slice(1),
            options: {
                ...options,
                cwd: path.resolve(options?.cwd ?? ""),
            },
        }).toStrictEqual({
            command: process.execPath,
            eslintCliPath: expect.stringMatching(
                /[\\/]eslint[\\/]bin[\\/]eslint\.js$/u
            ),
            exitStatus: 7,
            forwardedArgs: [
                "--cache",
                "--cache-strategy",
                "content",
                "--cache-location",
                rootEslintCachePath,
                "--fix",
                ".",
                "--ignore-pattern",
                `${appSourceDirectoryName}/**`,
                "--ignore-pattern",
                `${docusaurusWorkspaceName}/**`,
            ],
            options: {
                cwd: path.resolve(process.cwd()),
                stdio: "inherit",
            },
        });
    });
});
