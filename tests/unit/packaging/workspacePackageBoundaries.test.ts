import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
    rootElectronAppBaseTsconfigPath,
    rootElectronAppEslintTsconfigPath,
    appSourceRepositoryPath,
    docusaurusPackageRepositoryPath,
    rootElectronBuilderConfigPath,
    rootElectronAppTsconfigPath,
    rootEslintConfigPath,
    rootPackageRepositoryPath,
    rootPlaywrightConfigPath,
    rootPrettierConfigPath,
    rootRuntimeTsconfigPath,
    rootStylelintConfigPath,
    rootViteRendererConfigPath,
    rootVitestConfigPath,
} from "../../../scripts/lib/workspaces.mjs";

type PackageJson = {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    engines?: Record<string, string>;
    exports?: Record<string, string>;
    files?: string[];
    icon?: string;
    main?: string;
    private?: boolean;
    publishConfig?: Record<string, unknown>;
    scripts?: Record<string, string>;
    types?: string;
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

function createEngineDocsPattern(engineRange: string | undefined): RegExp {
    if (!engineRange) {
        throw new Error("Expected package engine range to be defined");
    }

    return new RegExp(
        engineRange
            .replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")
            .replace(">=", ">=\\s*"),
        "u"
    );
}

const nestedElectronPackageDelegationPatterns = [
    /(?:^|[&;|]\s*|\s)(?:cd|pushd|Set-Location)\s+["']?electron-app["']?(?:\s|$)/u,
    /(?:^|\s)npm\s+(?:(?:--prefix|-C)\s+["']?electron-app["']?|(?:run\s+)?(?:-w|--workspace)\s+["']?electron-app["']?)/u,
] as const;

function delegatesToNestedElectronPackage(script: string): boolean {
    return nestedElectronPackageDelegationPatterns.some((pattern) =>
        pattern.test(script)
    );
}

describe("workspace package boundaries", () => {
    it("keeps shared tooling and local Vitest UI support in the root workspace", () => {
        expect.assertions(9);

        const rootPackage = readPackageJson("package.json");

        expect(rootPackage.workspaces).toStrictEqual(["docusaurus"]);
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
        expect(
            Object.keys(rootPackage.dependencies ?? {}).sort()
        ).toStrictEqual([
            "@garmin/fitsdk",
            "electron-conf",
            "electron-log",
            "electron-updater",
            "zod",
        ]);
        expect(rootPackage.devDependencies).not.toHaveProperty("@actions/core");
        expect(rootPackage.devDependencies).not.toHaveProperty(
            "eslint-plugin-unicorn"
        );
        expect(rootPackage.devDependencies).not.toHaveProperty(
            "eslint-plugin-vue"
        );
        expect(rootPackage.devDependencies).not.toHaveProperty("fast-check");
        expect(rootPackage.devDependencies).not.toHaveProperty(
            "fast-xml-parser"
        );
    });

    it("keeps root package scripts from delegating Electron app work to a nested package", () => {
        expect.assertions(1);

        const rootPackage = readPackageJson("package.json");

        expect(
            Object.entries(rootPackage.scripts ?? {})
                .filter(([, script]) =>
                    delegatesToNestedElectronPackage(script)
                )
                .map(([scriptName, script]) => `${scriptName}: ${script}`)
        ).toStrictEqual([]);
    });

    it("keeps the root app package as the runtime app manifest", () => {
        expect.assertions(13);

        const appPackage = readPackageJson(rootPackageRepositoryPath);

        expect({ private: appPackage.private }).toStrictEqual({
            private: true,
        });
        expect(appPackage).not.toHaveProperty("publishConfig");
        expect(appPackage.scripts).toHaveProperty("build:runtime-ts");
        expect(appPackage.devDependencies).toHaveProperty("vitest");
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
            "electron-app/dist/",
            "electron-app/global.d.ts",
            "package.json",
        ]);
        expect(appPackage.exports?.["./index.html"]).toBe(
            "./electron-app/dist/index.html"
        );
        expect(appPackage.main).toBe("electron-app/dist/main.js");
        expect(appPackage.types).toBe("electron-app/global.d.ts");
        expect(appPackage.icon).toBe("electron-app/dist/icons/favicon.ico");
        expect(appPackage.files).not.toContain("vendor/");
        expect(appPackage.files).not.toContain("node_modules/");
        expect(getFileExistence(["electron-app/package.json"])).toStrictEqual({
            "electron-app/package.json": false,
        });
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
        expect(docusaurusPackage).toHaveProperty("private", true);
    });

    it("keeps setup docs aligned with root runtime engines", () => {
        expect.assertions(4);

        const rootPackage = readPackageJson("package.json");
        const setupDocs = [
            "docs/DEVELOPMENT_GUIDE.md",
            "docusaurus/docs/development/setup.md",
        ].map((relativePath) =>
            readFileSync(path.join(process.cwd(), relativePath), "utf8")
        );
        const nodeEnginePattern = createEngineDocsPattern(
            rootPackage.engines?.node
        );
        const npmEnginePattern = createEngineDocsPattern(
            rootPackage.engines?.npm
        );

        for (const doc of setupDocs) {
            expect(doc).toMatch(nodeEnginePattern);
            expect(doc).toMatch(npmEnginePattern);
        }
    });

    it("keeps public package snippets aligned with the root app manifest", () => {
        expect.assertions(7);

        const rootPackage = readPackageJson("package.json");
        const buildReleaseGuide = readFileSync(
            path.join(
                process.cwd(),
                "docusaurus",
                "docs",
                "development",
                "build-release.md"
            ),
            "utf8"
        );
        const homepageSource = readFileSync(
            path.join(process.cwd(), "docusaurus", "src", "pages", "index.tsx"),
            "utf8"
        );

        expect(homepageSource).toContain(`"name": "${rootPackage.name}"`);
        expect(homepageSource).toContain(`"main": "${rootPackage.main}"`);
        expect(homepageSource).toContain('"docusaurus"');
        expect(homepageSource).not.toContain("fitfileviewer-root");
        expect(homepageSource).not.toContain('"electron-app",');
        expect(buildReleaseGuide).toContain("files: rootPackageFiles");
        expect(buildReleaseGuide).not.toContain("appPackageFiles");
    });

    it("keeps dependency update configuration rooted at the app package", () => {
        expect.assertions(1);

        const ncuConfig = JSON.parse(
            readFileSync(path.join(process.cwd(), ".ncurc.json"), "utf8")
        ) as Record<string, unknown>;

        expect(ncuConfig).toStrictEqual({
            $schema:
                "https://raw.githubusercontent.com/raineorshine/npm-check-updates/main/src/types/RunOptions.json",
            cache: true,
            cacheFile: ".cache/.ncu-cache.json",
            concurrency: 8,
            dep: [
                "prod",
                "dev",
                "optional",
                "peer",
                "packageManager",
            ],
            deprecated: true,
            format: [
                "dep",
                "time",
                "homepage",
                "ownerChanged",
            ],
            install: "never",
            interactive: true,
            packageFile: "./package.json",
            packageManager: "npm",
            root: true,
            target: "latest",
            workspaces: true,
        });
    });

    it("keeps Docusaurus setup guidance in maintained docs pages", () => {
        expect.assertions(4);

        const docusaurusReadme = readFileSync(
            path.join(process.cwd(), "docusaurus", "README.md"),
            "utf8"
        );
        const docusaurusSetupGuide = readFileSync(
            path.join(
                process.cwd(),
                "docusaurus",
                "docs",
                "development",
                "setup.md"
            ),
            "utf8"
        );

        expect(
            getFileExistence(["docusaurus/CHECKLIST.md", "docusaurus/SETUP.md"])
        ).toStrictEqual({
            "docusaurus/CHECKLIST.md": false,
            "docusaurus/SETUP.md": false,
        });
        expect(docusaurusReadme).toContain("docs/development/setup.md");
        expect(docusaurusReadme).toContain("docs/development/build-release.md");
        expect(docusaurusSetupGuide).not.toContain("├── vendor/");
    });

    it("keeps Electron app tooling configuration centralized at the repository root", () => {
        expect.assertions(2);

        const rootToolingConfigs = [
            rootElectronAppBaseTsconfigPath,
            rootElectronAppEslintTsconfigPath,
            rootElectronBuilderConfigPath,
            rootEslintConfigPath,
            rootPrettierConfigPath,
            rootStylelintConfigPath,
            rootVitestConfigPath,
            rootElectronAppTsconfigPath,
            rootRuntimeTsconfigPath,
            rootViteRendererConfigPath,
            rootPlaywrightConfigPath,
        ];
        const appLocalToolingConfigs = [
            ".eslintrc",
            ".eslintrc.cjs",
            ".eslintrc.js",
            ".eslintrc.json",
            ".prettierrc",
            ".prettierrc.cjs",
            ".prettierrc.js",
            ".prettierrc.json",
            ".stylelintrc",
            ".stylelintrc.cjs",
            ".stylelintrc.js",
            ".stylelintrc.json",
            "electron-builder.config.cjs",
            "eslint.config.mjs",
            "package-lock.json",
            "package.json",
            "playwright.config.ts",
            "prettier.config.mjs",
            "stylelint.config.mjs",
            "tsconfig.json",
            "tsconfig.electron-app.base.json",
            "tsconfig.electron-app.eslint.json",
            "tsconfig.runtime.json",
            "vite.renderer.config.mjs",
            "vitest.config.js",
            "vitest.config.ts",
        ].map((configPath) => appSourceRepositoryPath(configPath));

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

    it("keeps the root Playwright smoke config strict", () => {
        expect.assertions(3);

        const playwrightConfig = readFileSync(
            path.join(process.cwd(), rootPlaywrightConfigPath),
            "utf8"
        );

        expect(playwrightConfig).toContain("forbidOnly: true");
        expect(playwrightConfig).toContain('testDir: "./tests/playwright"');
        expect(playwrightConfig).toContain("workers: 1");
    });
});
