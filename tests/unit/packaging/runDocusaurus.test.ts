import path from "node:path";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

import { docusaurusWorkspacePath } from "../../../scripts/lib/workspaces.mjs";
import {
    buildDocusaurusArgs,
    buildDocusaurusEnvironment,
    buildDocusaurusNodeOptions,
    docusaurusLocalStorageFilePath,
    docusaurusCommandsThatSyncAssets,
    findDocusaurusCommand,
    runDocusaurus,
    shouldSyncStaticAssets,
    syncDocusaurusStaticAssetsScript,
} from "../../../scripts/run-docusaurus.mjs";

type CommandRunner = (
    command: string,
    args: string[],
    options: { cwd: string; env?: NodeJS.ProcessEnv; stdio: string }
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

describe("run-docusaurus wrapper", () => {
    const expectedDocusaurusNodeOptions = (): string =>
        buildDocusaurusNodeOptions(process.env.NODE_OPTIONS);

    it("keeps the docs commands that require asset sync explicit", () => {
        expect.assertions(2);

        expect(docusaurusCommandsThatSyncAssets).toStrictEqual([
            "build",
            "deploy",
            "serve",
            "start",
        ]);
        expect({
            clearSyncsAssets: shouldSyncStaticAssets(["clear"]),
            detectedCommand: findDocusaurusCommand(["--verbose", "start"]),
            startSyncsAssets: shouldSyncStaticAssets([
                "start",
                "--port",
                "3000",
            ]),
        }).toStrictEqual({
            clearSyncsAssets: false,
            detectedCommand: "start",
            startSyncsAssets: true,
        });
    });

    it("builds Docusaurus CLI arguments from the workspace installation", () => {
        expect.assertions(5);

        const args = buildDocusaurusArgs(["build"]);

        expect(args).toStrictEqual([
            expect.stringMatching(
                /[\\/]@docusaurus[\\/]core[\\/]bin[\\/]docusaurus\.mjs$/u
            ),
            "build",
        ]);
        expect(buildDocusaurusNodeOptions("")).toBe(
            `--localstorage-file=${docusaurusLocalStorageFilePath}`
        );
        expect(
            buildDocusaurusEnvironment({ NODE_OPTIONS: "--trace-warnings" })
        ).toMatchObject({
            NODE_OPTIONS: `--trace-warnings --localstorage-file=${docusaurusLocalStorageFilePath}`,
        });
        expect(buildDocusaurusNodeOptions("--trace-warnings", new Set())).toBe(
            "--trace-warnings"
        );
        expect(
            buildDocusaurusNodeOptions(undefined, new Set())
        ).toBeUndefined();
    });

    it("syncs static assets before running build-like commands", () => {
        expect.assertions(4);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 0 });

        const exitStatus = runDocusaurus(["build"], commandRunner);
        expect({
            commandCalls: commandRunner.mock.calls.length,
            status: exitStatus,
        }).toStrictEqual({
            commandCalls: 2,
            status: 0,
        });

        const [
            syncCommand,
            syncArgs,
            syncOptions,
        ] = getRequiredCommandCall(commandRunner.mock.calls);
        const [
            docsCommand,
            docsArgs,
            docsOptions,
        ] = getRequiredCommandCall(commandRunner.mock.calls, 1);

        expect({
            command: syncCommand,
            cwd: path.resolve(syncOptions.cwd),
            args: syncArgs,
        }).toStrictEqual({
            command: process.execPath,
            cwd: path.resolve(process.cwd()),
            args: [syncDocusaurusStaticAssetsScript],
        });
        expect({
            args: docsArgs.slice(1),
            command: docsCommand,
            cwd: path.resolve(docsOptions.cwd),
            nodeOptions: docsOptions.env?.NODE_OPTIONS,
        }).toStrictEqual({
            args: ["build"],
            command: process.execPath,
            cwd: docusaurusWorkspacePath,
            nodeOptions: expectedDocusaurusNodeOptions(),
        });
        expect(docsArgs[0]).toMatch(
            /[\\/]@docusaurus[\\/]core[\\/]bin[\\/]docusaurus\.mjs$/u
        );
    });

    it("runs non-build commands without syncing static assets", () => {
        expect.assertions(3);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 0 });

        const exitStatus = runDocusaurus(["clear"], commandRunner);
        expect({
            commandCalls: commandRunner.mock.calls.length,
            status: exitStatus,
        }).toStrictEqual({
            commandCalls: 1,
            status: 0,
        });

        const [
            ,
            args,
            options,
        ] = getRequiredCommandCall(commandRunner.mock.calls);

        expect(args[0]).toMatch(
            /[\\/]@docusaurus[\\/]core[\\/]bin[\\/]docusaurus\.mjs$/u
        );
        expect({
            args: args.slice(1),
            cwd: path.resolve(options.cwd),
            nodeOptions: options.env?.NODE_OPTIONS,
        }).toStrictEqual({
            args: ["clear"],
            cwd: docusaurusWorkspacePath,
            nodeOptions: expectedDocusaurusNodeOptions(),
        });
    });

    it("stops when static asset sync fails", () => {
        expect.assertions(2);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 7 });

        const exitStatus = runDocusaurus(["start"], commandRunner);

        expect({
            commandCalls: commandRunner.mock.calls.length,
            status: exitStatus,
        }).toStrictEqual({
            commandCalls: 1,
            status: 7,
        });
        expect(commandRunner.mock.calls[0]).toStrictEqual([
            process.execPath,
            [syncDocusaurusStaticAssetsScript],
            {
                cwd: process.cwd(),
                stdio: "inherit",
            },
        ]);
    });

    it("throws when Docusaurus cannot be started", () => {
        expect.assertions(4);

        const spawnError = new Error("spawn failed");
        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ error: spawnError, status: 0 });

        expect(() => runDocusaurus(["clear"], commandRunner)).toThrow(
            spawnError
        );
        expect(commandRunner).toHaveBeenCalledOnce();

        const [
            command,
            args,
            options,
        ] = getRequiredCommandCall(commandRunner.mock.calls);

        expect({ args, command }).toStrictEqual({
            args: buildDocusaurusArgs(["clear"]),
            command: process.execPath,
        });
        expect({
            ...options,
            cwd: path.resolve(options.cwd),
            env: {
                NODE_OPTIONS: options.env?.NODE_OPTIONS,
            },
        }).toStrictEqual({
            cwd: docusaurusWorkspacePath,
            env: {
                NODE_OPTIONS: expectedDocusaurusNodeOptions(),
            },
            stdio: "inherit",
        });
    });
});
