import path from "node:path";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

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
            cwd: path.join(process.cwd(), "docusaurus"),
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
            cwd: path.join(process.cwd(), "docusaurus"),
        });
    });

    it("stops when static asset sync fails", () => {
        expect.assertions(1);

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
    });

    it("throws when Docusaurus cannot be started", () => {
        expect.assertions(1);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ error: new Error("spawn failed"), status: 0 });

        expect(() => runDocusaurus(["clear"], commandRunner)).toThrow(
            "spawn failed"
        );
    });
});
