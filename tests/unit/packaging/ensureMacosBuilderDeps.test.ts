import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import { repositoryRoot } from "../../../scripts/lib/workspaces.mjs";

type CommandRunner = (
    command: string,
    args: string[],
    options: {
        cwd: string;
        stdio: "inherit";
    }
) => { error?: Error; status: number | null };

type EnsureMacosBuilderDepsModule = {
    dmgLicensePackageName: string;
    ensureMacosBuilderDependencies: (options?: {
        commandRunner?: CommandRunner;
        logger?: (message: string) => void;
        platform?: NodeJS.Platform;
        resolver?: (specifier: string) => string;
    }) => number;
    installDmgLicenseArgs: string[];
    isPackageAvailable: (
        packageName?: string,
        resolver?: (specifier: string) => string
    ) => boolean;
};

async function importEnsureMacosBuilderDeps(): Promise<EnsureMacosBuilderDepsModule> {
    return (await import("../../../scripts/ensure-macos-builder-deps.mjs")) as EnsureMacosBuilderDepsModule;
}

describe("ensure-macos-builder-deps script", () => {
    it("checks for dmg-license using its package metadata entry", async () => {
        expect.assertions(2);

        const { dmgLicensePackageName, isPackageAvailable } =
            await importEnsureMacosBuilderDeps();
        const resolver = vi.fn<(specifier: string) => string>(
            () => "node_modules/dmg-license/package.json"
        );

        expect({
            packageAvailable: isPackageAvailable(
                dmgLicensePackageName,
                resolver
            ),
        }).toStrictEqual({ packageAvailable: true });
        expect(resolver).toHaveBeenCalledWith("dmg-license/package.json");
    });

    it("skips dependency installation on non-macOS platforms", async () => {
        expect.assertions(1);

        const { ensureMacosBuilderDependencies } =
            await importEnsureMacosBuilderDeps();
        const commandRunner = vi.fn<CommandRunner>(() => ({ status: 0 }));
        const logger = vi.fn<(message: string) => void>();

        const status = ensureMacosBuilderDependencies({
            commandRunner,
            logger,
            platform: "win32",
        });

        expect({
            commandCalls: commandRunner.mock.calls.length,
            logMessage: logger.mock.calls[0]?.[0],
            status,
        }).toStrictEqual({
            commandCalls: 0,
            logMessage:
                "[ensure-macos-builder-deps] Skipping non-macOS runner.",
            status: 0,
        });
    });

    it("returns success when dmg-license is already available", async () => {
        expect.assertions(1);

        const { ensureMacosBuilderDependencies } =
            await importEnsureMacosBuilderDeps();
        const commandRunner = vi.fn<CommandRunner>(() => ({ status: 0 }));
        const logger = vi.fn<(message: string) => void>();
        const resolver = vi.fn<(specifier: string) => string>(
            () => "node_modules/dmg-license/package.json"
        );

        const status = ensureMacosBuilderDependencies({
            commandRunner,
            logger,
            platform: "darwin",
            resolver,
        });

        expect({
            commandCalls: commandRunner.mock.calls.length,
            logMessage: logger.mock.calls[0]?.[0],
            status,
        }).toStrictEqual({
            commandCalls: 0,
            logMessage: "[ensure-macos-builder-deps] dmg-license is available.",
            status: 0,
        });
    });

    it("installs dmg-license from the repository root when missing", async () => {
        expect.assertions(1);

        const { ensureMacosBuilderDependencies, installDmgLicenseArgs } =
            await importEnsureMacosBuilderDeps();
        const commandRunner = vi.fn<CommandRunner>(() => ({ status: 0 }));
        const logger = vi.fn<(message: string) => void>();
        const resolver = vi.fn<(specifier: string) => string>(() => {
            throw new Error("missing package");
        });

        const status = ensureMacosBuilderDependencies({
            commandRunner,
            logger,
            platform: "darwin",
            resolver,
        });

        const [
            command,
            args,
            options,
        ] = commandRunner.mock.calls[0] ?? [];

        expect({
            args,
            command,
            logMessage: logger.mock.calls[0]?.[0],
            options: {
                ...options,
                cwd: path.resolve(options?.cwd ?? ""),
            },
            status,
        }).toStrictEqual({
            args: installDmgLicenseArgs,
            command: "npm",
            logMessage: "[ensure-macos-builder-deps] Installing dmg-license.",
            options: {
                cwd: path.resolve(repositoryRoot),
                stdio: "inherit",
            },
            status: 0,
        });
    });

    it("throws when the install command reports a spawn error", async () => {
        expect.assertions(1);

        const { ensureMacosBuilderDependencies } =
            await importEnsureMacosBuilderDeps();
        const commandRunner = vi.fn<CommandRunner>(() => ({
            error: new Error("spawn failed"),
            status: 0,
        }));
        const resolver = vi.fn<(specifier: string) => string>(() => {
            throw new Error("missing package");
        });

        expect(() =>
            ensureMacosBuilderDependencies({
                commandRunner,
                logger: vi.fn<(message: string) => void>(),
                platform: "darwin",
                resolver,
            })
        ).toThrow("spawn failed");
    });
});
