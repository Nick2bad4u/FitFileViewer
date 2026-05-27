import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { appPackageRepositoryPath } from "../../../scripts/lib/workspaces.mjs";

type PackageJson = {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    files?: string[];
    scripts?: Record<string, string>;
    workspaces?: string[];
};

function readPackageJson(relativePath: string): PackageJson {
    return JSON.parse(
        readFileSync(path.join(process.cwd(), relativePath), "utf8")
    ) as PackageJson;
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
            "lint:electron-app": "node scripts/lint-electron-app.mjs",
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

    it("keeps the Electron app package limited to runtime publish metadata", () => {
        expect.assertions(6);

        const appPackage = readPackageJson(appPackageRepositoryPath);

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
            "elevProfile.css",
            "global.d.ts",
            "icons/",
            "index.html",
            "package.json",
            "style.css",
        ]);
        expect(appPackage.files).not.toContain("vendor/");
        expect(appPackage.files).not.toContain("node_modules/");
    });
});
