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
        expect.assertions(4);

        expect(docusaurusCommandsThatSyncAssets).toStrictEqual([
            "build",
            "deploy",
            "serve",
            "start",
        ]);
        expect(findDocusaurusCommand(["--verbose", "start"])).toBe("start");
        expect(
            shouldSyncStaticAssets([
                "start",
                "--port",
                "3000",
            ])
        ).toBe(true);
        expect(shouldSyncStaticAssets(["clear"])).toBe(false);
    });

    it("builds Docusaurus CLI arguments from the workspace installation", () => {
        expect.assertions(3);

        const args = buildDocusaurusArgs(["build"]);

        expect(args[0]).toMatch(
            /[\\/]@docusaurus[\\/]core[\\/]bin[\\/]docusaurus\.mjs$/u
        );
        expect(args).toContain("build");
        expect(args).not.toContain("sync-docusaurus-static-assets.mjs");
    });

    it("syncs static assets before running build-like commands", () => {
        expect.assertions(8);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 0 });

        expect(runDocusaurus(["build"], commandRunner)).toBe(0);
        expect(commandRunner).toHaveBeenCalledTimes(2);

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

        expect(syncCommand).toBe(process.execPath);
        expect(syncArgs).toStrictEqual([syncDocusaurusStaticAssetsScript]);
        expect(path.resolve(syncOptions?.cwd ?? "")).toBe(process.cwd());
        expect(docsCommand).toBe(process.execPath);
        expect(docsArgs).toContain("build");
        expect(path.resolve(docsOptions?.cwd ?? "")).toBe(
            path.join(process.cwd(), "docusaurus")
        );
    });

    it("runs non-build commands without syncing static assets", () => {
        expect.assertions(4);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 0 });

        expect(runDocusaurus(["clear"], commandRunner)).toBe(0);
        expect(commandRunner).toHaveBeenCalledOnce();

        const [
            ,
            args,
            options,
        ] = commandRunner.mock.calls[0] ?? [];

        expect(args).toContain("clear");
        expect(path.resolve(options?.cwd ?? "")).toBe(
            path.join(process.cwd(), "docusaurus")
        );
    });

    it("stops when static asset sync fails", () => {
        expect.assertions(2);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 7 });

        expect(runDocusaurus(["start"], commandRunner)).toBe(7);
        expect(commandRunner).toHaveBeenCalledOnce();
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
