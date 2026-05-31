import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

type RunElectronModule = {
    defaultAppPath: string;
    parseArgs: (args: string[]) => {
        electronArgs: string[];
        electronIsDev: string | undefined;
    };
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

        const { electronArgs, electronIsDev } = parseArgs([
            "--inspect=9229",
            "--remote-debugging-port=9222",
        ]);

        expect(electronIsDev).toBeUndefined();
        expect(defaultAppPath).toBe(".");
        expect(withDefaultAppPath(electronArgs)).toStrictEqual([
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

    it("does not append the app workspace for Electron help commands", async () => {
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
});
