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

function getRequiredCommandCall(
    calls: Parameters<CommandRunner>[],
    index = 0
): Parameters<CommandRunner> {
    const call = calls[index];

    if (!call) {
        throw new Error(`Expected command call ${index}`);
    }

    return call;
}

function getRequiredDocsStep(
    steps: ReturnType<typeof buildDocsSteps>,
    index: number
): ReturnType<typeof buildDocsSteps>[number] {
    const step = steps[index];

    if (!step) {
        throw new Error(`Expected docs step ${index}`);
    }

    return step;
}

describe("build-docs script", () => {
    it("builds the full docs pipeline through root-owned scripts", () => {
        expect.assertions(3);

        const steps = buildDocsSteps([]);
        const typedocStep = getRequiredDocsStep(steps, 0);
        const apiCategoriesStep = getRequiredDocsStep(steps, 1);
        const docusaurusStep = getRequiredDocsStep(steps, 2);

        expect(steps.map((step) => step.label)).toStrictEqual([
            "generate API docs",
            "generate API categories",
            "build Docusaurus site",
        ]);
        expect(typedocStep.args[0]).toMatch(
            /[\\/]typedoc[\\/]bin[\\/]typedoc$/u
        );
        expect({
            stepCwds: steps.map((step) => ({
                cwd: path.resolve(step.cwd),
                cwdIsNestedElectronApp: path
                    .resolve(step.cwd)
                    .includes(`${path.sep}electron-app${path.sep}`),
                cwdRelativeToRepository: path.relative(
                    process.cwd(),
                    path.resolve(step.cwd)
                ),
                label: step.label,
            })),
            step0Args: typedocStep.args.slice(1),
            step0Cwd: path.resolve(typedocStep.cwd),
            step1Args: apiCategoriesStep.args,
            step1Cwd: path.resolve(apiCategoriesStep.cwd),
            step2Args: docusaurusStep.args,
        }).toStrictEqual({
            stepCwds: [
                {
                    cwd: path.resolve(process.cwd()),
                    cwdIsNestedElectronApp: false,
                    cwdRelativeToRepository: "",
                    label: "generate API docs",
                },
                {
                    cwd: docusaurusWorkspacePath,
                    cwdIsNestedElectronApp: false,
                    cwdRelativeToRepository: "docusaurus",
                    label: "generate API categories",
                },
                {
                    cwd: path.resolve(process.cwd()),
                    cwdIsNestedElectronApp: false,
                    cwdRelativeToRepository: "",
                    label: "build Docusaurus site",
                },
            ],
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
        expect.assertions(3);

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
        ] = getRequiredCommandCall(commandRunner.mock.calls);

        expect({
            command,
            cwd: path.resolve(options.cwd),
        }).toStrictEqual({
            command: process.execPath,
            cwd: path.resolve(process.cwd()),
        });
        expect(logger.mock.calls).toStrictEqual([
            ["[build-docs] generate API docs"],
            ["[build-docs] generate API categories"],
        ]);
    });

    it("stops after the first failing docs build step", () => {
        expect.assertions(3);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValueOnce({ status: 0 })
            .mockReturnValueOnce({ status: 6 });
        const logger = vi.fn<(message: string) => void>();
        const exitStatus = runBuildDocs(
            ["--typedoc-only"],
            commandRunner,
            logger
        );

        expect({
            commandCalls: commandRunner.mock.calls.length,
            status: exitStatus,
        }).toStrictEqual({
            commandCalls: 2,
            status: 6,
        });
        expect(
            commandRunner.mock.calls.map(
                ([
                    ,
                    args,
                    options,
                ]) => ({
                    args,
                    cwd: path.resolve(options.cwd),
                })
            )
        ).toStrictEqual([
            {
                args: getRequiredDocsStep(buildDocsSteps(["--typedoc-only"]), 0)
                    .args,
                cwd: path.resolve(process.cwd()),
            },
            {
                args: [generateApiCategoriesScriptPath],
                cwd: docusaurusWorkspacePath,
            },
        ]);
        expect(logger.mock.calls).toStrictEqual([
            ["[build-docs] generate API docs"],
            ["[build-docs] generate API categories"],
        ]);
    });

    it("throws when a docs build step cannot be started", () => {
        expect.assertions(4);

        const spawnError = new Error("spawn failed");
        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ error: spawnError, status: 0 });
        const logger = vi.fn<(message: string) => void>();

        expect(() => runBuildDocs([], commandRunner, logger)).toThrow(
            spawnError
        );
        expect(commandRunner).toHaveBeenCalledOnce();
        expect(
            getRequiredCommandCall(commandRunner.mock.calls)[1]
        ).toStrictEqual(getRequiredDocsStep(buildDocsSteps([]), 0).args);
        expect(logger).toHaveBeenCalledWith("[build-docs] generate API docs");
    });
});
