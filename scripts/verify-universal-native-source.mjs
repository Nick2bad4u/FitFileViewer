import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

function readJson(directory, name) {
    return JSON.parse(fs.readFileSync(path.join(directory, name), "utf8"));
}

function isPackageVersion(value) {
    if (typeof value !== "string") return false;
    const [core, ...prerelease] = value.split("-");
    return (
        /^\d+\.\d+\.\d+$/u.test(core) &&
        (prerelease.length === 0 ||
            /^[\dA-Za-z.-]+$/u.test(prerelease.join("-")))
    );
}

function isSha256Digest(value) {
    return typeof value === "string" && /^[0-9a-f]{64}$/u.test(value);
}

function validateExpectedSource(options) {
    if (!isPackageVersion(options.version))
        throw new Error("Invalid Universal verification package version");
    const required = [
        [
            options.sourceSha,
            /^[0-9a-f]{40}$/u,
            "source SHA",
        ],
        [
            options.runId,
            /^[1-9]\d*$/u,
            "workflow run ID",
        ],
        [
            options.runAttempt,
            /^[1-9]\d*$/u,
            "workflow run attempt",
        ],
    ];
    for (const [
        value,
        pattern,
        description,
    ] of required) {
        if (typeof value !== "string" || !pattern.test(value))
            throw new Error(`Invalid Universal verification ${description}`);
    }
    if (options.expectedVersion && options.expectedVersion !== options.version)
        throw new Error(
            "Universal source package does not match the release version"
        );
}

function verifySourceManifest(source, options) {
    if (
        source?.sourceSha !== options.sourceSha ||
        source?.version !== options.version ||
        source?.runId !== options.runId ||
        source?.runAttempt !== options.runAttempt
    ) {
        throw new Error(
            "Universal artifact does not match this source revision and workflow run"
        );
    }
}

function getArm64SmokeArtifact(report, version) {
    if (
        report?.version !== version ||
        report?.platform !== "darwin" ||
        report?.arch !== "universal" ||
        !Array.isArray(report.artifacts) ||
        report.artifacts.length !== 1
    ) {
        throw new Error(
            "Universal ARM64 smoke report has an unexpected version or artifact set"
        );
    }
    return report.artifacts[0];
}

function verifyArm64Report(report, version, artifactName) {
    const artifact = getArm64SmokeArtifact(report, version);
    if (
        artifact?.artifact !== artifactName ||
        artifact?.passed !== true ||
        artifact?.signatureVerified !== true ||
        artifact?.launchServicesVerified !== true ||
        JSON.stringify(artifact?.architectures) !== '["arm64"]' ||
        !isSha256Digest(artifact?.sha256)
    ) {
        throw new Error(
            "Universal DMG lacks successful native ARM64 and LaunchServices evidence"
        );
    }
    return artifact.sha256;
}

export function verifyUniversalNativeSource(options) {
    validateExpectedSource(options);
    const directory = options.artifactDirectory;
    verifySourceManifest(
        readJson(directory, "universal-native-source.json"),
        options
    );
    const artifact = `Fit-File-Viewer-dmg-universal-${options.version}.dmg`;
    const sha256 = verifyArm64Report(
        readJson(directory, "distributable-smoke-darwin-universal.json"),
        options.version,
        artifact
    );
    const signing = readJson(directory, "signing-verification-report.json");
    if (signing?.status !== "verified" || signing?.platform !== "darwin")
        throw new Error("Universal source signing verification did not pass");
    const actual = createHash("sha256")
        .update(fs.readFileSync(path.join(directory, artifact)))
        .digest("hex");
    if (actual !== sha256)
        throw new Error(
            "Universal DMG hash differs from the ARM64-tested artifact"
        );
    return {
        artifact,
        sha256,
        sourceSha: options.sourceSha,
        version: options.version,
        runId: options.runId,
        runAttempt: options.runAttempt,
        verifiedArchitectures: ["arm64"],
    };
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const result = verifyUniversalNativeSource({
        artifactDirectory: path.resolve("source-artifact"),
        sourceSha: process.env.SOURCE_SHA,
        expectedVersion: process.env.EXPECTED_VERSION,
        version: readJson(process.cwd(), "package.json").version,
        runId: process.env.GITHUB_RUN_ID,
        runAttempt: process.env.GITHUB_RUN_ATTEMPT,
    });
    console.log(JSON.stringify(result, null, 2));
}
