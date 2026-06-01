import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

type CommandRunner = (
    command: string,
    args: string[],
    options: {
        cwd: string;
        env: NodeJS.ProcessEnv;
        stdio: string;
    }
) => { error?: Error; status: number | null };

type RunElectronModule = {
    defaultAppPath: string;
    electronCliPath: string;
    parseArgs: (args: string[]) => {
        electronArgs: string[];
        electronIsDev: string | undefined;
    };
    runElectron: (
        argv?: string[],
        commandRunner?: CommandRunner,
        environment?: NodeJS.ProcessEnv
    ) => number;
    withDefaultAppPath: (electronArgs: string[], appPath?: string) => string[];
};

async function importRunElectron(): Promise<RunElectronModule> {
    return (await import("../../../scripts/run-electron.mjs")) as RunElectronModule;
}

function getRootScripts(): Record<string, string> {
    const packageJson = JSON.parse(
        readFileSync(path.join(process.cwd(), "package.json"), "utf8")
    ) as { scripts?: Record<string, string> };

    return packageJson.scripts ?? {};
}

describe("run-electron script", () => {
    it("defaults root launch commands to the root app manifest", async () => {
        expect.assertions(3);

        const { defaultAppPath, parseArgs, withDefaultAppPath } =
            await importRunElectron();

        const parsedArgs = parseArgs([
            "--inspect=9229",
            "--remote-debugging-port=9222",
        ]);

        expect(parsedArgs).toStrictEqual({
            electronArgs: ["--inspect=9229", "--remote-debugging-port=9222"],
            electronIsDev: undefined,
        });
        expect(defaultAppPath).toBe(".");
        expect(withDefaultAppPath(parsedArgs.electronArgs)).toStrictEqual([
            "--inspect=9229",
            "--remote-debugging-port=9222",
            ".",
        ]);
    });

    it("keeps explicit app paths and strips the wrapper-only dev flag", async () => {
        expect.assertions(2);

        const { parseArgs, withDefaultAppPath } = await importRunElectron();
        const { electronArgs, electronIsDev } = parseArgs([
            "--electron-is-dev",
            "0",
            "custom-app",
        ]);

        expect(electronIsDev).toBe("0");
        expect(withDefaultAppPath(electronArgs)).toStrictEqual(["custom-app"]);
    });

    it("does not append the app source directory for Electron help commands", async () => {
        expect.assertions(2);

        const { withDefaultAppPath } = await importRunElectron();

        expect(withDefaultAppPath(["--help"])).toStrictEqual(["--help"]);
        expect(withDefaultAppPath(["-v"])).toStrictEqual(["-v"]);
    });

    it("keeps root package start scripts free of explicit app path arguments", () => {
        expect.assertions(2);

        const scripts = getRootScripts();

        expect(scripts["start"]).toBe(
            "node scripts/start-electron.mjs --inspect=9229 --remote-debugging-port=9222"
        );
        expect(scripts["start:prod"]).toBe(
            "node scripts/start-electron.mjs --electron-is-dev 0"
        );
    });

    it("runs Electron from the repository root with the root app manifest", async () => {
        expect.assertions(2);

        const { electronCliPath, runElectron } = await importRunElectron();
        const commandRunner = vi.fn<CommandRunner>(() => ({ status: 0 }));
        const environment = { FFV_TEST_ENV: "1" };

        const status = runElectron(
            [
                "--electron-is-dev",
                "0",
                "--inspect=9229",
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
                electronCliPath,
                "--inspect=9229",
                ".",
            ],
            command: process.execPath,
            options: {
                cwd: path.resolve(process.cwd()),
                env: {
                    ELECTRON_IS_DEV: "0",
                    FFV_TEST_ENV: "1",
                },
                stdio: "inherit",
            },
            status: 0,
        });
    });

    it("throws when Electron reports a spawn error", async () => {
        expect.assertions(4);

        const spawnError = new Error("spawn failed");
        const { electronCliPath, runElectron } = await importRunElectron();
        const commandRunner = vi.fn<CommandRunner>(() => ({
            error: spawnError,
            status: 0,
        }));

        expect(() => runElectron([], commandRunner)).toThrow(spawnError);
        expect(commandRunner).toHaveBeenCalledOnce();

        const [
            command,
            args,
            options,
        ] = commandRunner.mock.calls[0] ?? [];

        expect({ args, command }).toStrictEqual({
            args: [electronCliPath, "."],
            command: process.execPath,
        });
        expect({
            ...options,
            cwd: path.resolve(options?.cwd ?? ""),
        }).toStrictEqual({
            cwd: path.resolve(process.cwd()),
            env: process.env,
            stdio: "inherit",
        });
    });
});
