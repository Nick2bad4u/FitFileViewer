import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
    appPackageRepositoryPath,
    appWorkspaceRepositoryPath,
    docusaurusPackageRepositoryPath,
    rootElectronAppTsconfigPath,
    rootEslintConfigPath,
    rootPrettierConfigPath,
    rootRuntimeTsconfigPath,
    rootVitestConfigPath,
} from "../../../scripts/lib/workspaces.mjs";

type PackageJson = {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    engines?: Record<string, string>;
    exports?: Record<string, string>;
    files?: string[];
    icon?: string;
    private?: boolean;
    publishConfig?: Record<string, unknown>;
    scripts?: Record<string, string>;
    workspaces?: string[];
};

function readPackageJson(relativePath: string): PackageJson {
    return JSON.parse(
        readFileSync(path.join(process.cwd(), relativePath), "utf8")
    ) as PackageJson;
}

function getFileExistence(relativePaths: string[]): Record<string, boolean> {
    return Object.fromEntries(
        relativePaths.map((relativePath) => [
            relativePath,
            existsSync(path.join(process.cwd(), relativePath)),
        ])
    );
}

describe("workspace package boundaries", () => {
    it("keeps shared tooling and local Vitest UI support in the root workspace", () => {
        expect.assertions(7);

        const rootPackage = readPackageJson("package.json");

        expect(rootPackage.workspaces).toStrictEqual([
            "electron-app",
            "docusaurus",
        ]);
        expect(rootPackage.scripts).toMatchObject({
            "lint:electron-app":
                "node scripts/run-eslint.mjs electronApp && node scripts/run-typescript.mjs typecheck",
            "lint:electron-app:fix":
                "node scripts/run-eslint.mjs electronApp --fix && node scripts/run-typescript.mjs typecheck",
            "test:ui": "node scripts/run-vitest.mjs --ui",
            "update-deps": "node scripts/update-deps.mjs",
        });
        expect(rootPackage.devDependencies).toMatchObject({
            "@vitest/ui": expect.any(String),
            "eslint-config-nick2bad4u": expect.any(String),
            "prettier-config-nick2bad4u": expect.any(String),
            "stylelint-config-nick2bad4u": expect.any(String),
            vitest: expect.any(String),
        });
        expect(rootPackage.dependencies ?? {}).toStrictEqual({});
        expect(rootPackage.devDependencies).not.toHaveProperty("@actions/core");
        expect(rootPackage.devDependencies).not.toHaveProperty(
            "eslint-plugin-unicorn"
        );
        expect(rootPackage.devDependencies).not.toHaveProperty(
            "eslint-plugin-vue"
        );
    });

    it("keeps the Electron app package limited to runtime app metadata", () => {
        expect.assertions(10);

        const appPackage = readPackageJson(appPackageRepositoryPath);

        expect({ private: appPackage.private }).toStrictEqual({
            private: true,
        });
        expect(appPackage).not.toHaveProperty("publishConfig");
        expect(appPackage.scripts ?? {}).toStrictEqual({});
        expect(appPackage).not.toHaveProperty("devDependencies");
        expect(Object.keys(appPackage.dependencies ?? {}).sort()).toStrictEqual(
            [
                "@garmin/fitsdk",
                "electron-conf",
                "electron-log",
                "electron-updater",
                "zod",
            ]
        );
        expect(appPackage.files).toStrictEqual([
            "dist/",
            "global.d.ts",
            "package.json",
        ]);
        expect(appPackage.exports?.["./index.html"]).toBe("./dist/index.html");
        expect(appPackage.icon).toBe("dist/icons/favicon.ico");
        expect(appPackage.files).not.toContain("vendor/");
        expect(appPackage.files).not.toContain("node_modules/");
    });

    it("keeps private workspace runtime policy centralized at the root", () => {
        expect.assertions(3);

        const rootPackage = readPackageJson("package.json");
        const docusaurusPackage = readPackageJson(
            docusaurusPackageRepositoryPath
        );

        expect(rootPackage.engines).toStrictEqual({
            node: ">=22.12.0",
            npm: ">=11.15.0",
        });
        expect(docusaurusPackage).not.toHaveProperty("engines");
        expect(docusaurusPackage.private).toBe(true);
    });

    it("keeps Electron app tooling configuration centralized at the repository root", () => {
        expect.assertions(2);

        const rootToolingConfigs = [
            rootEslintConfigPath,
            rootPrettierConfigPath,
            rootVitestConfigPath,
            rootElectronAppTsconfigPath,
            rootRuntimeTsconfigPath,
        ];
        const appLocalToolingConfigs = [
            "eslint.config.mjs",
            "prettier.config.mjs",
            "vitest.config.ts",
            "vitest.config.js",
            "playwright.config.ts",
            "stylelint.config.mjs",
            "tsconfig.json",
            "tsconfig.runtime.json",
        ].map((configPath) => appWorkspaceRepositoryPath(configPath));

        expect(getFileExistence(rootToolingConfigs)).toStrictEqual(
            Object.fromEntries(
                rootToolingConfigs.map((configPath) => [configPath, true])
            )
        );
        expect(getFileExistence(appLocalToolingConfigs)).toStrictEqual(
            Object.fromEntries(
                appLocalToolingConfigs.map((configPath) => [configPath, false])
            )
        );
    });
});
