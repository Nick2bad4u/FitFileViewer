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
    docusaurusPackageRepositoryPath,
    rootDocusaurusTsconfigPath,
    rootElectronAppBaseTsconfigPath,
    rootElectronAppEslintTsconfigPath,
    rootElectronBuilderConfigPath,
    rootElectronAppTsconfigPath,
    rootEslintTsconfigPath,
    rootEslintConfigPath,
    rootPackageJsonPath,
    rootPlaywrightConfigPath,
    rootPrettierConfigPath,
    rootRuntimeTsconfigPath,
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
        expect.assertions(1);

        const requiredTargets = [
            rootPackageJsonPath,
            docusaurusPackageRepositoryPath,
            rootPrettierConfigPath,
            rootEslintConfigPath,
            rootStylelintConfigPath,
            rootTypedocConfigPath,
            rootElectronBuilderConfigPath,
            rootElectronAppBaseTsconfigPath,
            rootElectronAppEslintTsconfigPath,
            rootElectronAppTsconfigPath,
            rootEslintTsconfigPath,
            rootRuntimeTsconfigPath,
            rootDocusaurusTsconfigPath,
            rootPlaywrightConfigPath,
            rootViteRendererConfigPath,
            rootVitestConfigPath,
            rootVitestTypecheckTsconfigPath,
            appLeafletMeasureLitePath,
            "scripts/*.mjs",
            "tests/fixtures/**/*.{js,ts}",
            "tests/integration/**/*.ts",
        ];

        expect({
            missingTargets: requiredTargets.filter(
                (target) => !prettierTargets.includes(target)
            ),
            obsoleteTargets: prettierTargets.filter(
                (target) => target === "electron-app/*.config.*"
            ),
        }).toStrictEqual({
            missingTargets: [],
            obsoleteTargets: [],
        });
    });

    it("builds default check arguments with cached formatting options", () => {
        expect.assertions(4);

        const args = buildPrettierArgs([]);

        expect(args[0]).toMatch(/[\\/]prettier[\\/]bin[\\/]prettier\.cjs$/u);
        expect(args).toContain(rootPackageJsonPath);
        expect(args).toEqual(expect.arrayContaining(prettierOptions));
        expect(args.at(-1)).toBe("--check");
    });

    it("uses explicit targets without adding the default target list", () => {
        expect.assertions(3);

        const args = buildPrettierArgs(["--write", "scripts/run-prettier.mjs"]);

        expect(args).toContain("scripts/run-prettier.mjs");
        expect(args).not.toContain(rootPackageJsonPath);
        expect(args.at(-1)).toBe("--write");
    });

    it("rejects invalid modes", () => {
        expect.assertions(1);

        expect(() => buildPrettierArgs(["--list-different"])).toThrow(
            "Expected --check or --write as the prettier mode"
        );
    });

    it("runs Prettier from the repository root", () => {
        expect.assertions(2);

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
            mode: args?.at(-1),
            prettierCliPath: args?.[0],
            targetSample: {
                rootPackage: args?.includes(rootPackageJsonPath),
            },
            options: {
                ...options,
                cwd: path.resolve(options?.cwd ?? ""),
            },
        }).toStrictEqual({
            command: process.execPath,
            exitStatus: 3,
            mode: "--check",
            prettierCliPath: expect.stringMatching(
                /[\\/]prettier[\\/]bin[\\/]prettier\.cjs$/u
            ),
            targetSample: {
                rootPackage: true,
            },
            options: {
                cwd: path.resolve(process.cwd()),
                stdio: "inherit",
            },
        });
    });
});
