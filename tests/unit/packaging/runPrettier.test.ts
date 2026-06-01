import path from "node:path";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

import {
    buildPrettierArgs,
    prettierOptions,
    prettierTargets,
    runPrettier,
} from "../../../scripts/run-prettier.mjs";
import {
    appLeafletMeasureLitePath,
    docusaurusConfigRepositoryPath,
    docusaurusPackageRepositoryPath,
    docusaurusSidebarsRepositoryPath,
    docusaurusTsconfigRepositoryPath,
    rootCliffConfigPath,
    rootCspellConfigPath,
    rootDocusaurusTsconfigPath,
    rootElectronAppBaseTsconfigPath,
    rootElectronAppEslintTsconfigPath,
    rootElectronBuilderConfigPath,
    rootElectronAppTsconfigPath,
    rootEslintTsconfigPath,
    rootEslintConfigPath,
    rootMarkdownLinkCheckConfigPath,
    rootMarkdownlintConfigPath,
    rootMermaidConfigPath,
    rootNcuConfigPath,
    rootPackageJsonPath,
    rootPlaywrightConfigPath,
    rootPreCommitConfigPath,
    rootPrettierConfigPath,
    rootRemarkConfigPath,
    rootRuntimeTsconfigPath,
    rootSecretlintConfigPath,
    rootStylelintConfigPath,
    rootTypedocConfigPath,
    rootViteRendererConfigPath,
    rootVitestConfigPath,
    rootVitestTypecheckTsconfigPath,
} from "../../../scripts/lib/workspaces.mjs";

type CommandRunner = (
    command: string,
    args: string[],
    options: { cwd: string; stdio: string }
) => { status: number };

describe("run-prettier wrapper", () => {
    it("keeps root-owned formatting targets for app and workspace metadata", () => {
        expect.assertions(2);

        const expectedTargets = [
            rootPackageJsonPath,
            docusaurusPackageRepositoryPath,
            docusaurusConfigRepositoryPath,
            docusaurusSidebarsRepositoryPath,
            docusaurusTsconfigRepositoryPath,
            rootTypedocConfigPath,
            rootMarkdownLinkCheckConfigPath,
            rootMarkdownlintConfigPath,
            rootNcuConfigPath,
            rootPreCommitConfigPath,
            rootSecretlintConfigPath,
            rootCliffConfigPath,
            rootCspellConfigPath,
            rootElectronBuilderConfigPath,
            rootMermaidConfigPath,
            rootPrettierConfigPath,
            rootStylelintConfigPath,
            rootRemarkConfigPath,
            rootEslintConfigPath,
            rootPlaywrightConfigPath,
            rootViteRendererConfigPath,
            rootVitestConfigPath,
            rootEslintTsconfigPath,
            rootElectronAppBaseTsconfigPath,
            rootElectronAppTsconfigPath,
            rootRuntimeTsconfigPath,
            rootDocusaurusTsconfigPath,
            rootVitestTypecheckTsconfigPath,
            rootElectronAppEslintTsconfigPath,
            "*.yml",
            "*.yaml",
            ".github/*.yml",
            ".github/workflows/*.yml",
            "scripts/*.mjs",
            "tests/fixtures/**/*.{js,ts}",
            "tests/integration/**/*.ts",
            "tests/unit/**/*.ts",
            "tests/playwright/**/*.ts",
            "tests/vitest/**/*.{cjs,mjs,ts}",
            appLeafletMeasureLitePath,
        ];

        expect(prettierTargets).toStrictEqual(expectedTargets);
        expect(
            prettierTargets.filter(
                (target) => target === "electron-app/*.config.*"
            )
        ).toStrictEqual([]);
    });

    it("builds default check arguments with cached formatting options", () => {
        expect.assertions(2);

        const args = buildPrettierArgs([]);

        expect(args[0]).toMatch(/[\\/]prettier[\\/]bin[\\/]prettier\.cjs$/u);
        expect(args.slice(1)).toStrictEqual([
            ...prettierTargets,
            ...prettierOptions,
            "--check",
        ]);
    });

    it("uses explicit targets without adding the default target list", () => {
        expect.assertions(2);

        const args = buildPrettierArgs(["--write", "scripts/run-prettier.mjs"]);

        expect(args[0]).toMatch(/[\\/]prettier[\\/]bin[\\/]prettier\.cjs$/u);
        expect(args.slice(1)).toStrictEqual([
            "scripts/run-prettier.mjs",
            ...prettierOptions,
            "--write",
        ]);
    });

    it("rejects invalid modes", () => {
        expect.assertions(1);

        expect(() => buildPrettierArgs(["--list-different"])).toThrow(
            "Expected --check or --write as the prettier mode"
        );
    });

    it("runs Prettier from the repository root", () => {
        expect.assertions(3);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 3 });

        const exitStatus = runPrettier(["--check"], commandRunner);

        const [
            command,
            args,
            options,
        ] = commandRunner.mock.calls[0] ?? [];

        expect(commandRunner).toHaveBeenCalledOnce();
        expect({
            command,
            exitStatus,
            args: args?.slice(1),
            options: {
                ...options,
                cwd: path.resolve(options?.cwd ?? ""),
            },
        }).toStrictEqual({
            command: process.execPath,
            exitStatus: 3,
            args: [
                ...prettierTargets,
                ...prettierOptions,
                "--check",
            ],
            options: {
                cwd: path.resolve(process.cwd()),
                stdio: "inherit",
            },
        });
        expect(args?.[0]).toMatch(/[\\/]prettier[\\/]bin[\\/]prettier\.cjs$/u);
    });
});
