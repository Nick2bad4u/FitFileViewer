import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

type VitestConfigModule = {
    default: {
        cacheDir?: string;
        root?: string;
        test?: {
            globalSetup?: string[];
            setupFiles?: string[];
        };
    };
};

async function importVitestConfig(): Promise<VitestConfigModule> {
    return (await import("../../../vitest.config")) as VitestConfigModule;
}

function getRootScripts(): Record<string, string> {
    const packageJson = JSON.parse(
        readFileSync(path.join(process.cwd(), "package.json"), "utf8")
    ) as { scripts?: Record<string, string> };

    return packageJson.scripts ?? {};
}

describe("vitest root config", () => {
    it("uses the repository root for cache, setup, and test script paths", async () => {
        expect.assertions(6);

        const { default: config } = await importVitestConfig();

        expect(config.root).toBe(process.cwd());
        expect(config.root).not.toBe(path.join(process.cwd(), "electron-app"));
        expect(config.cacheDir).toBe(".cache/vitest");
        expect(config.test?.globalSetup).toStrictEqual([
            "tests/vitest/globalSetup.mjs",
        ]);
        expect(config.test?.setupFiles).toStrictEqual([
            "tests/vitest/setupVitest.mjs",
        ]);
        expect(getRootScripts()["test:unit"]).toBe(
            "node scripts/run-vitest.mjs --run tests/unit electron-app/tests/unit --maxWorkers 1"
        );
    });
});
