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
    appPackageRepositoryPath,
    docusaurusPackageRepositoryPath,
    rootDocusaurusTsconfigPath,
    rootElectronBuilderConfigPath,
    rootElectronBuilderFilesPath,
    rootElectronAppTsconfigPath,
    rootEslintConfigPath,
    rootPrettierConfigPath,
    rootRuntimeTsconfigPath,
    rootStylelintConfigPath,
    rootTypedocConfigPath,
} from "../../../scripts/lib/workspaces.mjs";

type CommandRunner = (
    command: string,
    args: string[],
    options: { cwd: string; stdio: string }
) => { status: number };

describe("run-prettier wrapper", () => {
    it("keeps root-owned formatting targets for app and workspace metadata", () => {
        expect.assertions(14);

        expect(prettierTargets).toContain("package.json");
        expect(prettierTargets).toContain(appPackageRepositoryPath);
        expect(prettierTargets).toContain(docusaurusPackageRepositoryPath);
        expect(prettierTargets).toContain(rootPrettierConfigPath);
        expect(prettierTargets).toContain(rootEslintConfigPath);
        expect(prettierTargets).toContain(rootStylelintConfigPath);
        expect(prettierTargets).toContain(rootTypedocConfigPath);
        expect(prettierTargets).toContain(rootElectronBuilderConfigPath);
        expect(prettierTargets).toContain(rootElectronBuilderFilesPath);
        expect(prettierTargets).toContain(rootElectronAppTsconfigPath);
        expect(prettierTargets).toContain(rootRuntimeTsconfigPath);
        expect(prettierTargets).toContain(rootDocusaurusTsconfigPath);
        expect(prettierTargets).toContain("scripts/*.mjs");
        expect(prettierTargets).not.toContain("electron-app/*.config.*");
    });

    it("builds default check arguments with cached formatting options", () => {
        expect.assertions(4);

        const args = buildPrettierArgs([]);

        expect(args[0]).toMatch(/[\\/]prettier[\\/]bin[\\/]prettier\.cjs$/u);
        expect(args).toContain("package.json");
        expect(args).toEqual(expect.arrayContaining(prettierOptions));
        expect(args.at(-1)).toBe("--check");
    });

    it("uses explicit targets without adding the default target list", () => {
        expect.assertions(3);

        const args = buildPrettierArgs(["--write", "scripts/run-prettier.mjs"]);

        expect(args).toContain("scripts/run-prettier.mjs");
        expect(args).not.toContain("package.json");
        expect(args.at(-1)).toBe("--write");
    });

    it("rejects invalid modes", () => {
        expect.assertions(1);

        expect(() => buildPrettierArgs(["--list-different"])).toThrow(
            "Expected --check or --write as the prettier mode"
        );
    });

    it("runs Prettier from the repository root", () => {
        expect.assertions(5);

        const commandRunner = vi
            .fn<CommandRunner>()
            .mockReturnValue({ status: 3 });

        expect(runPrettier(["--check"], commandRunner)).toBe(3);

        const [
            command,
            args,
            options,
        ] = commandRunner.mock.calls[0] ?? [];

        expect(command).toBe(process.execPath);
        expect(args?.[0]).toMatch(/[\\/]prettier[\\/]bin[\\/]prettier\.cjs$/u);
        expect(args).toContain("--check");
        expect({
            ...options,
            cwd: path.resolve(options?.cwd ?? ""),
        }).toStrictEqual({
            cwd: path.resolve(process.cwd()),
            stdio: "inherit",
        });
    });
});
