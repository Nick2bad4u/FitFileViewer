import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

type CommandRunner = (
    command: string,
    args: string[],
    options: {
        cwd: string;
        stdio: string;
    }
) => { error?: Error; status: number | null };

type VerificationResult = {
    args: string[];
    command: string;
    error?: string;
    path: string;
    status: number | null;
};

type VerifySignedArtifactsModule = {
    appendSigningVerificationSummary: (
        summaryPath: string | undefined,
        report: {
            artifactCount: number;
            artifacts: Array<{ path: string; type: string }>;
            error?: string;
            platform: string;
            releaseDir: string;
            signingRequired: boolean;
            status: string;
            verificationResults: VerificationResult[];
        }
    ) => boolean;
    collectSigningVerificationArtifacts: (
        releaseDir: string,
        platform: string
    ) => string[];
    createSigningVerificationCommand: (
        artifactPath: string,
        platform: string
    ) => {
        args: string[];
        command: string;
    };
    parseArgs: (argv: string[]) => {
        platform: string;
        releaseDir: string;
        reportPath: string;
        runnerOs: string | undefined;
    };
    resolvePlatform: (options?: {
        platform?: string;
        runnerOs?: string;
    }) => string;
    verifySignedArtifacts: (
        argv?: string[],
        environment?: NodeJS.ProcessEnv,
        commandRunner?: CommandRunner,
        logger?: (message: string) => void
    ) => number;
    writeSigningVerificationReport: (
        reportPath: string,
        report: {
            artifacts: string[];
            error?: string;
            platform: string;
            releaseDir: string;
            signingRequired: boolean;
            status: string;
            verificationResults?: VerificationResult[];
        }
    ) => {
        artifactCount: number;
        artifacts: Array<{ path: string; type: string }>;
        error?: string;
        generatedAt: string;
        platform: string;
        releaseDir: string;
        signingRequired: boolean;
        status: string;
        verificationResults: VerificationResult[];
    };
};

const temporaryDirectories: string[] = [];

async function importVerifySignedArtifacts(): Promise<VerifySignedArtifactsModule> {
    return (await import("../../../scripts/verify-signed-artifacts.mjs")) as VerifySignedArtifactsModule;
}

function createTemporaryReleaseDir() {
    const releaseDir = fs.mkdtempSync(
        path.join(os.tmpdir(), "ffv-signed-artifacts-")
    );
    temporaryDirectories.push(releaseDir);
    return releaseDir;
}

afterEach(() => {
    for (const temporaryDirectory of temporaryDirectories.splice(0)) {
        fs.rmSync(temporaryDirectory, { force: true, recursive: true });
    }
});

describe("verify-signed-artifacts script", () => {
    it("parses release directory and GitHub runner OS arguments", async () => {
        expect.assertions(4);

        const { parseArgs, resolvePlatform } =
            await importVerifySignedArtifacts();

        expect(
            parseArgs([
                "--runner-os=Windows",
                "--release-dir",
                "release-dist",
                "--report",
                "artifacts/signing.json",
            ])
        ).toMatchObject({
            platform: "win32",
            releaseDir: path.resolve("release-dist"),
            reportPath: path.resolve("artifacts/signing.json"),
            runnerOs: "Windows",
        });
        expect(resolvePlatform({ runnerOs: "macOS" })).toBe("darwin");
        expect(resolvePlatform({ runnerOs: "Linux" })).toBe("linux");
        expect(() => parseArgs(["--release-dir"])).toThrow(
            "--release-dir requires a value"
        );
    });

    it("collects Windows signed artifact candidates", async () => {
        expect.assertions(1);

        const releaseDir = createTemporaryReleaseDir();
        const unpackedDir = path.join(releaseDir, "win-unpacked");
        fs.mkdirSync(unpackedDir, { recursive: true });
        fs.writeFileSync(path.join(releaseDir, "Fit-File-Viewer.exe"), "");
        fs.writeFileSync(path.join(unpackedDir, "Fit File Viewer.exe"), "");
        fs.writeFileSync(path.join(releaseDir, "Fit-File-Viewer.msi"), "");
        fs.writeFileSync(path.join(releaseDir, "latest.yml"), "");

        const { collectSigningVerificationArtifacts } =
            await importVerifySignedArtifacts();

        expect(
            collectSigningVerificationArtifacts(releaseDir, "win32").map(
                (artifactPath) => path.relative(releaseDir, artifactPath)
            )
        ).toStrictEqual([
            "Fit-File-Viewer.exe",
            "Fit-File-Viewer.msi",
            path.join("win-unpacked", "Fit File Viewer.exe"),
        ]);
    });

    it("collects macOS app bundles for codesign verification", async () => {
        expect.assertions(1);

        const releaseDir = createTemporaryReleaseDir();
        const appBundlePath = path.join(
            releaseDir,
            "mac",
            "Fit File Viewer.app"
        );
        fs.mkdirSync(path.join(appBundlePath, "Contents"), {
            recursive: true,
        });
        fs.writeFileSync(path.join(releaseDir, "Fit-File-Viewer.dmg"), "");

        const { collectSigningVerificationArtifacts } =
            await importVerifySignedArtifacts();

        expect(
            collectSigningVerificationArtifacts(releaseDir, "darwin").map(
                (artifactPath) => path.relative(releaseDir, artifactPath)
            )
        ).toStrictEqual([path.join("mac", "Fit File Viewer.app")]);
    });

    it("creates platform-specific signature verification commands", async () => {
        expect.assertions(4);

        const { createSigningVerificationCommand } =
            await importVerifySignedArtifacts();
        const windowsCommand = createSigningVerificationCommand(
            "release-dist/Fit-File-Viewer.exe",
            "win32"
        );
        const macosCommand = createSigningVerificationCommand(
            "release-dist/mac/Fit File Viewer.app",
            "darwin"
        );

        expect(windowsCommand.command).toBe("powershell.exe");
        expect(windowsCommand.args.join(" ")).toContain(
            "Get-AuthenticodeSignature"
        );
        expect(macosCommand.command).toBe("codesign");
        expect(macosCommand.args).toContain("--verify");
    });

    it("runs verification commands only when signing is required", async () => {
        expect.assertions(7);

        const releaseDir = createTemporaryReleaseDir();
        const reportPath = path.join(releaseDir, "signing-report.json");
        fs.writeFileSync(path.join(releaseDir, "Fit-File-Viewer.exe"), "");
        const commandRunner = vi.fn<CommandRunner>(() => ({ status: 0 }));
        const logger = vi.fn<(message: string) => void>();
        const { verifySignedArtifacts } = await importVerifySignedArtifacts();

        expect(
            verifySignedArtifacts(
                [
                    "--platform",
                    "linux",
                    "--release-dir",
                    releaseDir,
                    "--report",
                    reportPath,
                ],
                { REQUIRE_CODE_SIGNING: "true" },
                commandRunner,
                logger
            )
        ).toBe(0);
        expect(
            verifySignedArtifacts(
                [
                    "--platform",
                    "win32",
                    "--release-dir",
                    releaseDir,
                    "--report",
                    reportPath,
                ],
                { REQUIRE_CODE_SIGNING: "true" },
                commandRunner,
                logger
            )
        ).toBe(0);
        expect(commandRunner).toHaveBeenCalledOnce();
        expect(commandRunner.mock.calls[0]?.[0]).toBe("powershell.exe");
        expect(JSON.parse(fs.readFileSync(reportPath, "utf8"))).toMatchObject({
            artifactCount: 1,
            platform: "win32",
            signingRequired: true,
            status: "verified",
        });
        expect(
            JSON.parse(fs.readFileSync(reportPath, "utf8")).artifacts
        ).toStrictEqual([{ path: "Fit-File-Viewer.exe", type: "file" }]);
        expect(
            JSON.parse(fs.readFileSync(reportPath, "utf8")).verificationResults
        ).toStrictEqual([
            expect.objectContaining({
                command: "powershell.exe",
                path: "Fit-File-Viewer.exe",
                status: 0,
            }),
        ]);
    });

    it("appends a GitHub job summary when summary output is available", async () => {
        expect.assertions(4);

        const releaseDir = createTemporaryReleaseDir();
        const reportPath = path.join(releaseDir, "signing-report.json");
        const summaryPath = path.join(releaseDir, "github-step-summary.md");
        fs.writeFileSync(path.join(releaseDir, "Fit-File-Viewer.exe"), "");
        const commandRunner = vi.fn<CommandRunner>(() => ({ status: 0 }));
        const { verifySignedArtifacts } = await importVerifySignedArtifacts();

        expect(
            verifySignedArtifacts(
                [
                    "--platform",
                    "win32",
                    "--release-dir",
                    releaseDir,
                    "--report",
                    reportPath,
                ],
                {
                    GITHUB_STEP_SUMMARY: summaryPath,
                    REQUIRE_CODE_SIGNING: "true",
                },
                commandRunner
            )
        ).toBe(0);

        const summary = fs.readFileSync(summaryPath, "utf8");
        expect(summary).toContain("## Signing Verification");
        expect(summary).toContain("- Status: `verified`");
        expect(summary).toContain("`Fit-File-Viewer.exe` (file)");
    });

    it("fails required signing verification when no artifact candidates exist", async () => {
        expect.assertions(2);

        const releaseDir = createTemporaryReleaseDir();
        const reportPath = path.join(releaseDir, "signing-report.json");
        const { verifySignedArtifacts } = await importVerifySignedArtifacts();

        expect(() =>
            verifySignedArtifacts(
                [
                    "--platform",
                    "darwin",
                    "--release-dir",
                    releaseDir,
                    "--report",
                    reportPath,
                ],
                { REQUIRE_CODE_SIGNING: "true" },
                vi.fn<CommandRunner>(() => ({ status: 0 }))
            )
        ).toThrow("No signed artifact candidates found");
        expect(JSON.parse(fs.readFileSync(reportPath, "utf8"))).toMatchObject({
            artifactCount: 0,
            platform: "darwin",
            signingRequired: true,
            status: "failed",
        });
    });

    it("writes a signing verification report with relative artifact paths and verification details", async () => {
        expect.assertions(1);

        const releaseDir = createTemporaryReleaseDir();
        const appBundlePath = path.join(
            releaseDir,
            "mac",
            "Fit File Viewer.app"
        );
        const reportPath = path.join(releaseDir, "signing-report.json");
        fs.mkdirSync(appBundlePath, { recursive: true });
        const { writeSigningVerificationReport } =
            await importVerifySignedArtifacts();

        expect(
            writeSigningVerificationReport(reportPath, {
                artifacts: [appBundlePath],
                platform: "darwin",
                releaseDir,
                signingRequired: true,
                status: "verified",
                verificationResults: [
                    {
                        args: ["--verify", appBundlePath],
                        command: "codesign",
                        path: appBundlePath,
                        status: 0,
                    },
                ],
            })
        ).toMatchObject({
            artifactCount: 1,
            artifacts: [
                {
                    path: path.join("mac", "Fit File Viewer.app"),
                    type: "directory",
                },
            ],
            platform: "darwin",
            signingRequired: true,
            status: "verified",
            verificationResults: [
                {
                    args: ["--verify", appBundlePath],
                    command: "codesign",
                    path: path.join("mac", "Fit File Viewer.app"),
                    status: 0,
                },
            ],
        });
    });
});
