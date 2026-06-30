import { describe, expect, it, vi } from "vitest";

type CheckSigningEnvModule = {
    getSigningPreflightReport: (
        environment?: NodeJS.ProcessEnv,
        platform?: NodeJS.Platform | string,
        options?: { requireSigning?: boolean }
    ) => {
        errors: string[];
        platform: string;
        signingRequired: boolean;
        valid: boolean;
    };
    parseArgs: (argv: string[]) => {
        platform: string | undefined;
        requireSigning: boolean | undefined;
        runnerOs: string | undefined;
    };
    resolveSigningPlatform: (options?: {
        platform?: string;
        runnerOs?: string;
    }) => string;
    runSigningPreflight: (
        argv?: string[],
        environment?: NodeJS.ProcessEnv,
        output?: {
            error: (message: string) => void;
            log: (message: string) => void;
        }
    ) => number;
};

async function importCheckSigningEnv(): Promise<CheckSigningEnvModule> {
    return (await import("../../../scripts/check-signing-env.mjs")) as CheckSigningEnvModule;
}

describe("check-signing-env script", () => {
    it("parses direct platform, signing mode, and GitHub runner OS arguments", async () => {
        expect.assertions(6);

        const { parseArgs, resolveSigningPlatform } =
            await importCheckSigningEnv();

        expect(parseArgs(["--platform", "win32"])).toStrictEqual({
            platform: "win32",
            requireSigning: undefined,
            runnerOs: undefined,
        });
        expect(parseArgs(["--runner-os=macOS"])).toStrictEqual({
            platform: undefined,
            requireSigning: undefined,
            runnerOs: "macOS",
        });
        expect(parseArgs(["--require-signing"])).toStrictEqual({
            platform: undefined,
            requireSigning: true,
            runnerOs: undefined,
        });
        expect(parseArgs(["--optional-signing"])).toStrictEqual({
            platform: undefined,
            requireSigning: false,
            runnerOs: undefined,
        });
        expect(resolveSigningPlatform({ runnerOs: "Windows" })).toBe("win32");
        expect(resolveSigningPlatform({ platform: "darwin" })).toBe("darwin");
    });

    it("reports Windows signing variables before the build starts", async () => {
        expect.assertions(2);

        const { getSigningPreflightReport, runSigningPreflight } =
            await importCheckSigningEnv();
        const output = {
            error: vi.fn<(message: string) => void>(),
            log: vi.fn<(message: string) => void>(),
        };

        expect(
            getSigningPreflightReport({ REQUIRE_CODE_SIGNING: "true" }, "win32")
        ).toStrictEqual({
            errors: [
                "one of WIN_CSC_LINK or CSC_LINK is required",
                "CSC_KEY_PASSWORD is required",
            ],
            platform: "win32",
            signingRequired: true,
            valid: false,
        });
        expect(
            runSigningPreflight(
                ["--runner-os", "Windows"],
                { REQUIRE_CODE_SIGNING: "true" },
                output
            )
        ).toBe(1);
    });

    it("allows required signing checks without mutating the caller environment", async () => {
        expect.assertions(3);

        const { getSigningPreflightReport, runSigningPreflight } =
            await importCheckSigningEnv();
        const environment = { REQUIRE_CODE_SIGNING: "false" };
        const output = {
            error: vi.fn<(message: string) => void>(),
            log: vi.fn<(message: string) => void>(),
        };

        expect(
            getSigningPreflightReport(environment, "win32", {
                requireSigning: true,
            })
        ).toMatchObject({
            platform: "win32",
            signingRequired: true,
            valid: false,
        });
        expect(
            runSigningPreflight(
                [
                    "--platform",
                    "win32",
                    "--require-signing",
                ],
                environment,
                output
            )
        ).toBe(1);
        expect(environment.REQUIRE_CODE_SIGNING).toBe("false");
    });

    it("accepts macOS notarization credential alternatives", async () => {
        expect.assertions(1);

        const { getSigningPreflightReport } = await importCheckSigningEnv();

        expect(
            getSigningPreflightReport(
                {
                    APPLE_KEYCHAIN_PROFILE: "notary-profile",
                    CSC_INSTALLER_KEY_PASSWORD: "installer-password",
                    CSC_INSTALLER_LINK: "installer.p12",
                    CSC_KEY_PASSWORD: "password",
                    CSC_LINK: "application.p12",
                    REQUIRE_CODE_SIGNING: "true",
                },
                "darwin"
            )
        ).toMatchObject({
            errors: [],
            platform: "darwin",
            signingRequired: true,
            valid: true,
        });
    });

    it("skips Linux and unsigned local builds without requiring secrets", async () => {
        expect.assertions(6);

        const { getSigningPreflightReport, runSigningPreflight } =
            await importCheckSigningEnv();
        const output = {
            error: vi.fn<(message: string) => void>(),
            log: vi.fn<(message: string) => void>(),
        };

        expect(
            getSigningPreflightReport({ REQUIRE_CODE_SIGNING: "true" }, "linux")
        ).toStrictEqual({
            errors: [],
            platform: "linux",
            signingRequired: false,
            valid: true,
        });
        expect(
            runSigningPreflight(
                ["--runner-os", "Linux"],
                { REQUIRE_CODE_SIGNING: "true" },
                output
            )
        ).toBe(0);
        expect(output.error).not.toHaveBeenCalled();
        expect(output.log).toHaveBeenCalledWith(
            "[signing] Code signing is not required for linux; skipping preflight."
        );
        expect(
            runSigningPreflight(
                ["--platform", "win32"],
                { REQUIRE_CODE_SIGNING: "false" },
                output
            )
        ).toBe(0);
        expect(output.log).toHaveBeenCalledWith(
            "[signing] Code signing is not required for win32; skipping preflight."
        );
    });
});
