import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    repositoryRoot,
    rootReleaseDistAbsolutePath,
} from "./lib/workspaces.mjs";

const windowsSignedArtifactExtensions = new Set([".exe", ".msi"]);
const signingVerificationReportFileName = "signing-verification-report.json";

export function parseArgs(argv = []) {
    let platform;
    let reportPath;
    let releaseDir = rootReleaseDistAbsolutePath;
    let runnerOs;

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];

        if (arg === "--platform") {
            platform = argv[index + 1];
            if (!platform || platform.startsWith("-")) {
                throw new Error("--platform requires a value");
            }
            index += 1;
            continue;
        }

        if (arg.startsWith("--platform=")) {
            platform = arg.slice("--platform=".length);
            if (!platform) {
                throw new Error("--platform must not be empty");
            }
            continue;
        }

        if (arg === "--release-dir") {
            const nextReleaseDir = argv[index + 1];
            if (!nextReleaseDir || nextReleaseDir.startsWith("-")) {
                throw new Error("--release-dir requires a value");
            }
            releaseDir = path.resolve(nextReleaseDir);
            index += 1;
            continue;
        }

        if (arg.startsWith("--release-dir=")) {
            const nextReleaseDir = arg.slice("--release-dir=".length);
            if (!nextReleaseDir) {
                throw new Error("--release-dir must not be empty");
            }
            releaseDir = path.resolve(nextReleaseDir);
            continue;
        }

        if (arg === "--report") {
            const nextReportPath = argv[index + 1];
            if (!nextReportPath || nextReportPath.startsWith("-")) {
                throw new Error("--report requires a value");
            }
            reportPath = path.resolve(nextReportPath);
            index += 1;
            continue;
        }

        if (arg.startsWith("--report=")) {
            const nextReportPath = arg.slice("--report=".length);
            if (!nextReportPath) {
                throw new Error("--report must not be empty");
            }
            reportPath = path.resolve(nextReportPath);
            continue;
        }

        if (arg === "--runner-os") {
            runnerOs = argv[index + 1];
            if (!runnerOs || runnerOs.startsWith("-")) {
                throw new Error("--runner-os requires a value");
            }
            index += 1;
            continue;
        }

        if (arg.startsWith("--runner-os=")) {
            runnerOs = arg.slice("--runner-os=".length);
            if (!runnerOs) {
                throw new Error("--runner-os must not be empty");
            }
            continue;
        }

        throw new Error(`Unknown argument: ${arg}`);
    }

    return {
        platform: resolvePlatform({ platform, runnerOs }),
        releaseDir,
        reportPath:
            reportPath ??
            path.join(releaseDir, signingVerificationReportFileName),
        runnerOs,
    };
}

export function resolvePlatform({ platform, runnerOs } = {}) {
    if (platform) {
        return platform;
    }

    if (runnerOs === "Windows") {
        return "win32";
    }

    if (runnerOs === "macOS") {
        return "darwin";
    }

    if (runnerOs === "Linux") {
        return "linux";
    }

    return process.platform;
}

export function collectSigningVerificationArtifacts(releaseDir, platform) {
    if (platform === "win32") {
        return walkReleaseDir(releaseDir)
            .filter((artifactPath) =>
                windowsSignedArtifactExtensions.has(
                    path.extname(artifactPath).toLowerCase()
                )
            )
            .sort();
    }

    if (platform === "darwin") {
        return walkReleaseDir(releaseDir, { includeDirectories: true })
            .filter((artifactPath) => artifactPath.endsWith(".app"))
            .sort();
    }

    return [];
}

export function createSigningVerificationCommand(artifactPath, platform) {
    if (platform === "win32") {
        return {
            args: [
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-Command",
                '$signature = Get-AuthenticodeSignature -LiteralPath $args[0]; if ($signature.Status -ne \'Valid\') { Write-Error ("Invalid signature: {0} [{1}]" -f $args[0], $signature.Status); exit 1 }; Write-Host ("Valid signature: {0}" -f $args[0])',
                artifactPath,
            ],
            command: "powershell.exe",
        };
    }

    if (platform === "darwin") {
        return {
            args: [
                "--verify",
                "--deep",
                "--strict",
                "--verbose=2",
                artifactPath,
            ],
            command: "codesign",
        };
    }

    throw new Error(`Signing verification is not supported on ${platform}`);
}

export function verifySignedArtifacts(
    argv = process.argv.slice(2),
    environment = process.env,
    commandRunner = spawnSync,
    logger = console.log
) {
    const { platform, releaseDir, reportPath } = parseArgs(argv);

    if (environment.REQUIRE_CODE_SIGNING !== "true" || platform === "linux") {
        const report = writeSigningVerificationReport(reportPath, {
            artifacts: [],
            platform,
            releaseDir,
            signingRequired: environment.REQUIRE_CODE_SIGNING === "true",
            status: "skipped",
        });
        appendSigningVerificationSummary(
            environment.GITHUB_STEP_SUMMARY,
            report
        );
        logger("[signing] Artifact signature verification skipped.");
        return 0;
    }

    const artifacts = collectSigningVerificationArtifacts(releaseDir, platform);
    const verificationResults = [];
    if (artifacts.length === 0) {
        const report = writeSigningVerificationReport(reportPath, {
            artifacts: [],
            error: `No signed artifact candidates found in ${releaseDir} for ${platform}`,
            platform,
            releaseDir,
            signingRequired: true,
            status: "failed",
        });
        appendSigningVerificationSummary(
            environment.GITHUB_STEP_SUMMARY,
            report
        );
        throw new Error(
            `No signed artifact candidates found in ${releaseDir} for ${platform}`
        );
    }

    for (const artifactPath of artifacts) {
        const { args, command } = createSigningVerificationCommand(
            artifactPath,
            platform
        );
        const result = commandRunner(command, args, {
            cwd: repositoryRoot,
            stdio: "inherit",
        });
        const verificationResult = {
            args: args.map((arg) =>
                arg === artifactPath
                    ? path.relative(releaseDir, artifactPath)
                    : arg
            ),
            command,
            path: artifactPath,
            status: result.status,
        };
        verificationResults.push(
            result.error
                ? { ...verificationResult, error: result.error.message }
                : verificationResult
        );

        if (result.error) {
            const report = writeSigningVerificationReport(reportPath, {
                artifacts,
                error: result.error.message,
                platform,
                releaseDir,
                signingRequired: true,
                status: "failed",
                verificationResults,
            });
            appendSigningVerificationSummary(
                environment.GITHUB_STEP_SUMMARY,
                report
            );
            throw result.error;
        }

        if ((result.status ?? 1) !== 0) {
            const report = writeSigningVerificationReport(reportPath, {
                artifacts,
                error: `Signing verification command exited with status ${result.status ?? 1}`,
                platform,
                releaseDir,
                signingRequired: true,
                status: "failed",
                verificationResults,
            });
            appendSigningVerificationSummary(
                environment.GITHUB_STEP_SUMMARY,
                report
            );
            return result.status ?? 1;
        }
    }

    const report = writeSigningVerificationReport(reportPath, {
        artifacts,
        platform,
        releaseDir,
        signingRequired: true,
        status: "verified",
        verificationResults,
    });
    appendSigningVerificationSummary(environment.GITHUB_STEP_SUMMARY, report);
    logger(`[signing] Verified ${artifacts.length} signed artifact(s).`);
    return 0;
}

export function appendSigningVerificationSummary(summaryPath, report) {
    if (!summaryPath) {
        return false;
    }

    const lines = [
        "## Signing Verification",
        "",
        `- Status: \`${report.status}\``,
        `- Platform: \`${report.platform}\``,
        `- Signing required: \`${String(report.signingRequired)}\``,
        `- Artifact count: \`${String(report.artifactCount)}\``,
    ];

    if (report.error) {
        lines.push(`- Error: \`${report.error}\``);
    }

    if (report.artifacts.length > 0) {
        lines.push("", "### Artifacts");
        for (const artifact of report.artifacts) {
            lines.push(`- \`${artifact.path}\` (${artifact.type})`);
        }
    }

    if (report.verificationResults.length > 0) {
        lines.push("", "### Verification Commands");
        for (const result of report.verificationResults) {
            lines.push(
                `- \`${result.command}\` for \`${result.path}\`: \`${String(result.status)}\``
            );
        }
    }

    fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
    fs.appendFileSync(summaryPath, `${lines.join("\n")}\n\n`);
    return true;
}

export function writeSigningVerificationReport(reportPath, report) {
    const releaseDir = report.releaseDir;
    const artifacts = report.artifacts.map((artifactPath) => ({
        path: path.relative(releaseDir, artifactPath),
        type: fs.existsSync(artifactPath)
            ? fs.statSync(artifactPath).isDirectory()
                ? "directory"
                : "file"
            : "missing",
    }));
    const payload = {
        artifactCount: artifacts.length,
        artifacts,
        error: report.error,
        generatedAt: new Date().toISOString(),
        platform: report.platform,
        releaseDir,
        signingRequired: report.signingRequired,
        status: report.status,
        verificationResults: (report.verificationResults ?? []).map(
            (result) => ({
                ...result,
                path: path.relative(releaseDir, result.path),
            })
        ),
    };
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, `${JSON.stringify(payload, null, 2)}\n`);
    return payload;
}

function walkReleaseDir(releaseDir, options = {}) {
    if (!fs.existsSync(releaseDir)) {
        return [];
    }

    const entries = [];
    for (const directoryEntry of fs.readdirSync(releaseDir, {
        withFileTypes: true,
    })) {
        const entryPath = path.join(releaseDir, directoryEntry.name);
        if (directoryEntry.isDirectory()) {
            if (options.includeDirectories) {
                entries.push(entryPath);
            }
            entries.push(...walkReleaseDir(entryPath, options));
            continue;
        }

        if (directoryEntry.isFile()) {
            entries.push(entryPath);
        }
    }

    return entries;
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    process.exitCode = verifySignedArtifacts();
}
