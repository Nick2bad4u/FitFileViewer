import path from "node:path";
import process from "node:process";

import { describe, expect, it, vi } from "vitest";

import { rootElectronBuilderConfigPath } from "../../../scripts/lib/workspaces.mjs";

type CommandRunner = (
    command: string,
    args: string[],
    options: {
        cwd: string;
        env: NodeJS.ProcessEnv;
        stdio: string;
    }
) => { error?: Error; status: number | null };

type RunElectronBuilderModule = {
    electronBuilderBaseArgs: string[];
    electronBuilderCliPath: string;
    getCodeSigningValidationErrors: (
        environment?: NodeJS.ProcessEnv,
        platform?: NodeJS.Platform
    ) => string[];
    getElectronBuilderEnvironment: (
        environment?: NodeJS.ProcessEnv,
        platform?: NodeJS.Platform
    ) => NodeJS.ProcessEnv;
    getUnsignedElectronBuilderEnvironment: (
        environment: NodeJS.ProcessEnv
    ) => NodeJS.ProcessEnv;
    parseArgs: (args: string[]) => {
        builderArgs: string[];
        nodeEnv: string | undefined;
    };
    runElectronBuilder: (
        argv?: string[],
        commandRunner?: CommandRunner,
        environment?: NodeJS.ProcessEnv,
        options?: { platform?: NodeJS.Platform }
    ) => number;
};

async function importRunElectronBuilder(): Promise<RunElectronBuilderModule> {
    return (await import("../../../scripts/run-electron-builder.mjs")) as RunElectronBuilderModule;
}

describe("run-electron-builder script", () => {
    it("builds electron-builder args from root-owned workspace metadata", async () => {
        expect.assertions(2);

        const { electronBuilderBaseArgs, parseArgs } =
            await importRunElectronBuilder();

        expect(electronBuilderBaseArgs).toStrictEqual([
            "--projectDir",
            ".",
            "--config",
            rootElectronBuilderConfigPath,
        ]);
        expect(
            parseArgs([
                "--node-env",
                "production",
                "--dir",
            ])
        ).toStrictEqual({
            builderArgs: ["--dir"],
            nodeEnv: "production",
        });
    });

    it("rejects invalid node environment arguments", async () => {
        expect.assertions(3);

        const { parseArgs } = await importRunElectronBuilder();

        expect(() => parseArgs(["--node-env"])).toThrow(
            "--node-env requires a value"
        );
        expect(() => parseArgs(["--node-env", "--dir"])).toThrow(
            "--node-env requires a value"
        );
        expect(() => parseArgs(["--node-env="])).toThrow(
            "--node-env must not be empty"
        );
    });

    it("runs electron-builder from the repository root with the root config", async () => {
        expect.assertions(2);

        const { electronBuilderCliPath, runElectronBuilder } =
            await importRunElectronBuilder();
        const commandRunner = vi.fn<CommandRunner>(() => ({ status: 0 }));
        const environment = { FFV_TEST_ENV: "1" };

        const status = runElectronBuilder(
            [
                "--node-env",
                "production",
                "--dir",
                "--win",
            ],
            commandRunner,
            environment
        );

        const [
            command,
            args,
            options,
        ] = commandRunner.mock.calls[0] ?? [];

        expect(commandRunner).toHaveBeenCalledOnce();
        expect({
            args,
            command,
            options: {
                ...options,
                cwd: path.resolve(options?.cwd ?? ""),
            },
            status,
        }).toStrictEqual({
            args: [
                electronBuilderCliPath,
                "--projectDir",
                ".",
                "--config",
                rootElectronBuilderConfigPath,
                "--dir",
                "--win",
            ],
            command: process.execPath,
            options: {
                cwd: path.resolve(process.cwd()),
                env: {
                    CSC_IDENTITY_AUTO_DISCOVERY: "false",
                    FFV_TEST_ENV: "1",
                    NODE_ENV: "production",
                    REQUIRE_CODE_SIGNING: "false",
                },
                stdio: "inherit",
            },
            status: 0,
        });
    });

    it("throws when electron-builder reports a spawn error", async () => {
        expect.assertions(4);

        const spawnError = new Error("spawn failed");
        const { electronBuilderCliPath, runElectronBuilder } =
            await importRunElectronBuilder();
        const environment = { FFV_TEST_ENV: "1" };
        const commandRunner = vi.fn<CommandRunner>(() => ({
            error: spawnError,
            status: 0,
        }));

        expect(() =>
            runElectronBuilder([], commandRunner, environment)
        ).toThrow(spawnError);
        expect(commandRunner).toHaveBeenCalledOnce();

        const [
            command,
            args,
            options,
        ] = commandRunner.mock.calls[0] ?? [];

        expect({ args, command }).toStrictEqual({
            args: [
                electronBuilderCliPath,
                "--projectDir",
                ".",
                "--config",
                rootElectronBuilderConfigPath,
            ],
            command: process.execPath,
        });
        expect({
            ...options,
            cwd: path.resolve(options?.cwd ?? ""),
        }).toStrictEqual({
            cwd: path.resolve(process.cwd()),
            env: {
                CSC_IDENTITY_AUTO_DISCOVERY: "false",
                FFV_TEST_ENV: "1",
                REQUIRE_CODE_SIGNING: "false",
            },
            stdio: "inherit",
        });
    });

    it("strips signing variables for local unsigned packages", async () => {
        expect.assertions(2);

        const { getElectronBuilderEnvironment } =
            await importRunElectronBuilder();

        expect(
            getElectronBuilderEnvironment({ FFV_TEST_ENV: "1" }, "win32")
        ).toStrictEqual({
            CSC_IDENTITY_AUTO_DISCOVERY: "false",
            FFV_TEST_ENV: "1",
            REQUIRE_CODE_SIGNING: "false",
        });
        expect(
            getElectronBuilderEnvironment(
                {
                    CSC_KEY_PASSWORD: "password",
                    CSC_IDENTITY_AUTO_DISCOVERY: "true",
                    CSC_LINK: "certificate.p12",
                    FFV_TEST_ENV: "1",
                },
                "win32"
            )
        ).toStrictEqual({
            CSC_IDENTITY_AUTO_DISCOVERY: "false",
            FFV_TEST_ENV: "1",
            REQUIRE_CODE_SIGNING: "false",
        });
    });

    it("strips signing variables for forced unsigned release rehearsals", async () => {
        expect.assertions(2);

        const {
            getElectronBuilderEnvironment,
            getUnsignedElectronBuilderEnvironment,
        } = await importRunElectronBuilder();
        const environment = {
            APPLE_API_KEY: "notary-key",
            CSC_IDENTITY_AUTO_DISCOVERY: "true",
            CSC_KEY_PASSWORD: "password",
            CSC_LINK: "certificate.p12",
            CSC_NAME: "Developer ID Application",
            FFV_FORCE_UNSIGNED_PACKAGE: "true",
            FFV_TEST_ENV: "1",
            REQUIRE_CODE_SIGNING: "true",
            WIN_CSC_LINK: "windows.pfx",
        };
        const unsignedEnvironment = {
            CSC_IDENTITY_AUTO_DISCOVERY: "false",
            FFV_FORCE_UNSIGNED_PACKAGE: "true",
            FFV_TEST_ENV: "1",
            REQUIRE_CODE_SIGNING: "false",
        };

        expect(
            getUnsignedElectronBuilderEnvironment(environment)
        ).toStrictEqual(unsignedEnvironment);
        expect(
            getElectronBuilderEnvironment(environment, "darwin")
        ).toStrictEqual(unsignedEnvironment);
    });

    it("validates required Windows signing secrets for release builds", async () => {
        expect.assertions(2);

        const {
            getCodeSigningValidationErrors,
            getElectronBuilderEnvironment,
        } = await importRunElectronBuilder();

        expect(
            getCodeSigningValidationErrors(
                {
                    REQUIRE_CODE_SIGNING: "true",
                },
                "win32"
            )
        ).toStrictEqual([
            "one of WIN_CSC_LINK or CSC_LINK is required",
            "CSC_KEY_PASSWORD is required",
        ]);
        expect(
            getElectronBuilderEnvironment(
                {
                    CSC_KEY_PASSWORD: "password",
                    REQUIRE_CODE_SIGNING: "true",
                    WIN_CSC_LINK: "certificate.pfx",
                },
                "win32"
            )
        ).toStrictEqual({
            CSC_KEY_PASSWORD: "password",
            REQUIRE_CODE_SIGNING: "true",
            WIN_CSC_LINK: "certificate.pfx",
        });
    });

    it("validates required macOS signing and notarization secrets for release builds", async () => {
        expect.assertions(2);

        const {
            getCodeSigningValidationErrors,
            getElectronBuilderEnvironment,
        } = await importRunElectronBuilder();

        expect(
            getCodeSigningValidationErrors(
                {
                    CSC_KEY_PASSWORD: "password",
                    CSC_LINK: "application.p12",
                    REQUIRE_CODE_SIGNING: "true",
                },
                "darwin"
            )
        ).toStrictEqual([
            "CSC_INSTALLER_LINK is required",
            "CSC_INSTALLER_KEY_PASSWORD is required",
            "one macOS notarization credential set is required: APPLE_ID/APPLE_APP_SPECIFIC_PASSWORD/APPLE_TEAM_ID, APPLE_API_KEY/APPLE_API_KEY_ID/APPLE_API_ISSUER, or APPLE_KEYCHAIN_PROFILE",
        ]);
        expect(
            getElectronBuilderEnvironment(
                {
                    APPLE_API_ISSUER: "issuer",
                    APPLE_API_KEY: "key",
                    APPLE_API_KEY_ID: "key-id",
                    CSC_INSTALLER_KEY_PASSWORD: "installer-password",
                    CSC_INSTALLER_LINK: "installer.p12",
                    CSC_KEY_PASSWORD: "password",
                    CSC_LINK: "application.p12",
                    REQUIRE_CODE_SIGNING: "true",
                },
                "darwin"
            )
        ).toStrictEqual({
            APPLE_API_ISSUER: "issuer",
            APPLE_API_KEY: "key",
            APPLE_API_KEY_ID: "key-id",
            CSC_INSTALLER_KEY_PASSWORD: "installer-password",
            CSC_INSTALLER_LINK: "installer.p12",
            CSC_KEY_PASSWORD: "password",
            CSC_LINK: "application.p12",
            REQUIRE_CODE_SIGNING: "true",
        });
    });
});
