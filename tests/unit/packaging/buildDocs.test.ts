import path from "node:path";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

import {
    buildDocsSteps,
    runBuildDocs,
    typedocConfigPath,
} from "../../../scripts/build-docs.mjs";
import {
    docusaurusWorkspacePath,
    generateApiCategoriesScriptPath,
    runDocusaurusScriptPath,
} from "../../../scripts/lib/workspaces.mjs";

type CommandRunner = (
    command: string,
    args: string[],
    options: { cwd: string; stdio: string }
) => { error?: Error; status: number };

describe("build-docs script", () => {
    it("builds the full docs pipeline through root-owned scripts", () => {
        expect.assertions(3);

        const steps = buildDocsSteps([]);

        expect(steps.map((step) => step.label)).toStrictEqual([
            "generate API docs",
            "generate API categories",
            "build Docusaurus site",
        ]);
        expect(steps[0]?.args[0]).toMatch(/[\\/]typedoc[\\/]bin[\\/]typedoc$/u);
        expect({
            step0Args: steps[0]?.args.slice(1),
            step0Cwd: path.resolve(steps[0]?.cwd ?? ""),
            step1Args: steps[1]?.args,
            step1Cwd: path.resolve(steps[1]?.cwd ?? ""),
            step2Args: steps[2]?.args,
        }).toStrictEqual({
            step0Args: ["--options", typedocConfigPath],
            step0Cwd: path.resolve(process.cwd()),
            step1Args: [generateApiCategoriesScriptPath],
            step1Cwd: docusaurusWorkspacePath,
            step2Args: [runDocusaurusScriptPath, "build"],
        });
    });

    it("omits the Docusaurus site build for TypeDoc-only runs", () => {
        expect.assertions(1);

        expect(
            buildDocsSteps(["--typedoc-only"]).map((step) => step.label)
        ).toStrictEqual(["generate API docs", "generate API categories"]);
    });

    it("runs docs build steps in order", () => {
        expect.assertions(2);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 0 });
        const logger = vi.fn<(message: string) => void>();

        const exitStatus = runBuildDocs(
            ["--typedoc-only"],
            commandRunner,
            logger
        );
        expect({
            commandCalls: commandRunner.mock.calls.length,
            loggerCalls: logger.mock.calls.length,
            status: exitStatus,
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
            cwd: path.resolve(options?.cwd ?? ""),
        }).toStrictEqual({
            command: process.execPath,
            cwd: path.resolve(process.cwd()),
        });
    });

    it("stops after the first failing docs build step", () => {
        expect.assertions(1);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValueOnce({ status: 0 })
            .mockReturnValueOnce({ status: 6 });
        const exitStatus = runBuildDocs(["--typedoc-only"], commandRunner);

        expect({
            commandCalls: commandRunner.mock.calls.length,
            status: exitStatus,
        }).toStrictEqual({
            commandCalls: 2,
            status: 6,
        });
    });

    it("throws when a docs build step cannot be started", () => {
        expect.assertions(1);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ error: new Error("spawn failed"), status: 0 });

        expect(() => runBuildDocs([], commandRunner)).toThrow("spawn failed");
    });
});
