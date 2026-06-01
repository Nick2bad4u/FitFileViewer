import path from "node:path";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

import { rootElectronBuilderConfigPath } from "../../../scripts/lib/workspaces.mjs";

type CommandRunner = (
    command: string,
    args: string[],
    options: {
        cwd: string;
        env: NodeJS.ProcessEnv;
        stdio: string;
    }
) => { error?: Error; status: number | null };

type RunElectronBuilderModule = {
    electronBuilderBaseArgs: string[];
    electronBuilderCliPath: string;
    parseArgs: (args: string[]) => {
        builderArgs: string[];
        nodeEnv: string | undefined;
    };
    runElectronBuilder: (
        argv?: string[],
        commandRunner?: CommandRunner,
        environment?: NodeJS.ProcessEnv
    ) => number;
};

async function importRunElectronBuilder(): Promise<RunElectronBuilderModule> {
    return (await import("../../../scripts/run-electron-builder.mjs")) as RunElectronBuilderModule;
}

describe("run-electron-builder script", () => {
    it("builds electron-builder args from root-owned workspace metadata", async () => {
        expect.assertions(3);

        const { electronBuilderBaseArgs, parseArgs } =
            await importRunElectronBuilder();

        expect(electronBuilderBaseArgs).toStrictEqual([
            "--projectDir",
            ".",
            "--config",
            rootElectronBuilderConfigPath,
        ]);
        expect(
            parseArgs([
                "--node-env",
                "production",
                "--dir",
            ])
        ).toStrictEqual({
            builderArgs: ["--dir"],
            nodeEnv: "production",
        });
        expect(() => parseArgs(["--node-env"])).toThrow(
            "--node-env requires a value"
        );
    });

    it("runs electron-builder from the repository root with the root config", async () => {
        expect.assertions(2);

        const { electronBuilderCliPath, runElectronBuilder } =
            await importRunElectronBuilder();
        const commandRunner = vi.fn<CommandRunner>(() => ({ status: 0 }));
        const environment = { FFV_TEST_ENV: "1" };

        const status = runElectronBuilder(
            [
                "--node-env",
                "production",
                "--dir",
                "--win",
            ],
            commandRunner,
            environment
        );

        const [
            command,
            args,
            options,
        ] = commandRunner.mock.calls[0] ?? [];

        expect(commandRunner).toHaveBeenCalledOnce();
        expect({
            args,
            command,
            options: {
                ...options,
                cwd: path.resolve(options?.cwd ?? ""),
            },
            status,
        }).toStrictEqual({
            args: [
                electronBuilderCliPath,
                "--projectDir",
                ".",
                "--config",
                rootElectronBuilderConfigPath,
                "--dir",
                "--win",
            ],
            command: process.execPath,
            options: {
                cwd: path.resolve(process.cwd()),
                env: {
                    FFV_TEST_ENV: "1",
                    NODE_ENV: "production",
                },
                stdio: "inherit",
            },
            status: 0,
        });
    });

    it("throws when electron-builder reports a spawn error", async () => {
        expect.assertions(1);

        const { runElectronBuilder } = await importRunElectronBuilder();
        const commandRunner = vi.fn<CommandRunner>(() => ({
            error: new Error("spawn failed"),
            status: 0,
        }));

        expect(() => runElectronBuilder([], commandRunner)).toThrow(
            "spawn failed"
        );
    });
});
