import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
    appPreloadBundleAbsolutePath,
    appSourcePath,
    rootPackageRepositoryPath,
    rootVitestCachePath,
    rootVitestGlobalSetupPath,
    rootVitestPreloadDistHelperPath,
    rootVitestSetupFilePath,
} from "../../../scripts/lib/workspaces.mjs";
import { preloadDistPath } from "../../vitest/helpers/preloadDist";

type VitestConfigModule = {
    default: {
        cacheDir?: string;
        root?: string;
        test?: {
            coverage?: {
                exclude?: string[];
            };
            globalSetup?: string[];
            setupFiles?: string[];
        };
    };
};

async function importVitestConfig(): Promise<VitestConfigModule> {
    return (await import("../../../vitest.config")) as VitestConfigModule;
}

function getRequiredVitestTestConfig(
    config: VitestConfigModule["default"]
): NonNullable<VitestConfigModule["default"]["test"]> {
    if (!config.test) {
        throw new Error("Expected Vitest test config");
    }

    return config.test;
}

function getRootScripts(): Record<string, string> {
    const packageJson = JSON.parse(
        readFileSync(
            path.join(process.cwd(), rootPackageRepositoryPath),
            "utf8"
        )
    ) as { scripts?: Record<string, string> };

    return packageJson.scripts ?? {};
}

describe("vitest root config", () => {
    it("uses the repository root for cache, setup, and test script paths", async () => {
        expect.assertions(8);

        const { default: config } = await importVitestConfig();
        const testConfig = getRequiredVitestTestConfig(config);

        expect(config.root).toBe(process.cwd());
        expect(config.root).not.toBe(appSourcePath);
        expect(config.cacheDir).toBe(rootVitestCachePath);
        expect(testConfig.globalSetup).toStrictEqual([
            rootVitestGlobalSetupPath,
        ]);
        expect(testConfig.setupFiles).toStrictEqual([rootVitestSetupFilePath]);
        expect(getRootScripts()["test:unit"]).toBe(
            "node scripts/run-vitest.mjs --run --suite unit --maxWorkers 1"
        );
        expect(getRootScripts()["test:integration"]).toBe(
            "node scripts/run-vitest.mjs --run --suite integration --maxWorkers 1"
        );
        expect(getRootScripts()["test:tabs"]).toBe(
            "node scripts/run-vitest.mjs --run --reporter=verbose --suite tabs --maxWorkers 1"
        );
    });

    it("keeps preload dist fixtures pointed at the root runtime output", () => {
        expect.assertions(3);

        expect(rootVitestPreloadDistHelperPath).toBe(
            "tests/vitest/helpers/preloadDist.ts"
        );
        expect(preloadDistPath).toBe(appPreloadBundleAbsolutePath);
        expect(path.relative(process.cwd(), preloadDistPath)).toBe(
            path.join("dist", "preload.js")
        );
    });
});
