import path from "node:path";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

import { docusaurusWorkspacePath } from "../../../scripts/lib/workspaces.mjs";
import {
    buildDocusaurusArgs,
    docusaurusCommandsThatSyncAssets,
    findDocusaurusCommand,
    runDocusaurus,
    shouldSyncStaticAssets,
    syncDocusaurusStaticAssetsScript,
} from "../../../scripts/run-docusaurus.mjs";

type CommandRunner = (
    command: string,
    args: string[],
    options: { cwd: string; stdio: string }
) => { error?: Error; status: number };

describe("run-docusaurus wrapper", () => {
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
        expect.assertions(3);

        const args = buildDocusaurusArgs(["build"]);

        expect(args[0]).toMatch(
            /[\\/]@docusaurus[\\/]core[\\/]bin[\\/]docusaurus\.mjs$/u
        );
        expect(args.slice(1)).toStrictEqual(["build"]);
        expect(args).not.toContain("sync-docusaurus-static-assets.mjs");
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
        ] = commandRunner.mock.calls[0] ?? [];
        const [
            docsCommand,
            docsArgs,
            docsOptions,
        ] = commandRunner.mock.calls[1] ?? [];

        expect({
            command: syncCommand,
            cwd: path.resolve(syncOptions?.cwd ?? ""),
            args: syncArgs,
        }).toStrictEqual({
            command: process.execPath,
            cwd: path.resolve(process.cwd()),
            args: [syncDocusaurusStaticAssetsScript],
        });
        expect({
            args: docsArgs?.slice(1),
            command: docsCommand,
            cwd: path.resolve(docsOptions?.cwd ?? ""),
        }).toStrictEqual({
            args: ["build"],
            command: process.execPath,
            cwd: docusaurusWorkspacePath,
        });
        expect(docsArgs?.[0]).toMatch(
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
        ] = commandRunner.mock.calls[0] ?? [];

        expect(args?.[0]).toMatch(
            /[\\/]@docusaurus[\\/]core[\\/]bin[\\/]docusaurus\.mjs$/u
        );
        expect({
            args: args?.slice(1),
            cwd: path.resolve(options?.cwd ?? ""),
        }).toStrictEqual({
            args: ["clear"],
            cwd: docusaurusWorkspacePath,
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
        ] = commandRunner.mock.calls[0] ?? [];

        expect({ args, command }).toStrictEqual({
            args: buildDocusaurusArgs(["clear"]),
            command: process.execPath,
        });
        expect({
            ...options,
            cwd: path.resolve(options?.cwd ?? ""),
        }).toStrictEqual({
            cwd: docusaurusWorkspacePath,
            stdio: "inherit",
        });
    });
});
