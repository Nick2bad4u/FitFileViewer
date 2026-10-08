// @vitest-environment node

import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

type VerificationOptions = {
    artifactDirectory: string;
    expectedVersion?: string;
    runAttempt: string;
    runId: string;
    sourceSha: string;
    version: string;
};

type ArtifactReport = {
    architectures: string[];
    artifact: string;
    launchServicesVerified: boolean;
    passed: boolean;
    sha256: string;
    signatureVerified: boolean;
};

type Fixture = {
    artifact: ArtifactReport;
    options: VerificationOptions;
    report: {
        arch: string;
        artifacts: ArtifactReport[];
        platform: string;
        version: string;
    };
};

const temporaryDirectories: string[] = [];

async function verifier(): Promise<
    (options: VerificationOptions) => Record<string, unknown>
> {
    const module =
        (await import("../../../scripts/verify-universal-native-source.mjs")) as {
            verifyUniversalNativeSource: (
                options: VerificationOptions
            ) => Record<string, unknown>;
        };
    return module.verifyUniversalNativeSource;
}

function writeJson(directory: string, name: string, value: unknown): void {
    fs.writeFileSync(path.join(directory, name), JSON.stringify(value));
}

function createFixture(): Fixture {
    const directory = fs.mkdtempSync(
        path.join(os.tmpdir(), "ffv-native-source-")
    );
    temporaryDirectories.push(directory);
    const options: VerificationOptions = {
        artifactDirectory: directory,
        expectedVersion: "30.0.3",
        runAttempt: "2",
        runId: "37708098988",
        sourceSha: "a".repeat(40),
        version: "30.0.3",
    };
    const bytes = Buffer.from("The exact Universal DMG bytes tested on ARM64");
    const artifact: ArtifactReport = {
        architectures: ["arm64"],
        artifact: "Fit-File-Viewer-dmg-universal-30.0.3.dmg",
        launchServicesVerified: true,
        passed: true,
        sha256: createHash("sha256").update(bytes).digest("hex"),
        signatureVerified: true,
    };
    const report = {
        arch: "universal",
        artifacts: [artifact],
        platform: "darwin",
        version: options.version,
    };
    fs.writeFileSync(path.join(directory, artifact.artifact), bytes);
    writeJson(directory, "universal-native-source.json", options);
    writeJson(directory, "distributable-smoke-darwin-universal.json", report);
    writeJson(directory, "signing-verification-report.json", {
        platform: "darwin",
        status: "verified",
    });
    return { artifact, options, report };
}

afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) {
        fs.rmSync(directory, { force: true, recursive: true });
    }
});

describe("Universal native artifact handoff", () => {
    it("accepts only the source-bound DMG bytes covered by successful ARM64 smoke", async () => {
        expect.assertions(1);
        const fixture = createFixture();
        const verify = await verifier();
        expect(verify(fixture.options)).toEqual({
            artifact: fixture.artifact.artifact,
            runAttempt: "2",
            runId: "37708098988",
            sha256: fixture.artifact.sha256,
            sourceSha: "a".repeat(40),
            verifiedArchitectures: ["arm64"],
            version: "30.0.3",
        });
    });

    it("rejects changed DMG bytes even when the reports still claim success", async () => {
        expect.assertions(1);
        const fixture = createFixture();
        fs.appendFileSync(
            path.join(
                fixture.options.artifactDirectory,
                fixture.artifact.artifact
            ),
            "changed"
        );
        const verify = await verifier();
        expect(() => verify(fixture.options)).toThrow("hash differs");
    });

    it.each([
        { field: "sourceSha", value: "b".repeat(40) },
        { field: "version", value: "30.0.2" },
        { field: "runId", value: "37708098989" },
        { field: "runAttempt", value: "1" },
    ])("rejects a handoff from another $field", async ({ field, value }) => {
        expect.assertions(1);
        const fixture = createFixture();
        writeJson(
            fixture.options.artifactDirectory,
            "universal-native-source.json",
            { ...fixture.options, [field]: value }
        );
        const verify = await verifier();
        expect(() => verify(fixture.options)).toThrow(
            "does not match this source revision and workflow run"
        );
    });

    it.each([
        { label: "wrong architecture", override: { architectures: ["x64"] } },
        { label: "missing native coverage", override: { architectures: [] } },
        { label: "failed smoke", override: { passed: false } },
        { label: "failed signature", override: { signatureVerified: false } },
        {
            label: "missing LaunchServices",
            override: { launchServicesVerified: false },
        },
        {
            label: "different filename",
            override: { artifact: "../unexpected.dmg" },
        },
        { label: "invalid digest", override: { sha256: "not-a-digest" } },
    ])("rejects $label in the producer report", async ({ override }) => {
        expect.assertions(1);
        const fixture = createFixture();
        writeJson(
            fixture.options.artifactDirectory,
            "distributable-smoke-darwin-universal.json",
            {
                ...fixture.report,
                artifacts: [{ ...fixture.artifact, ...override }],
            }
        );
        const verify = await verifier();
        expect(() => verify(fixture.options)).toThrow(
            "lacks successful native ARM64 and LaunchServices evidence"
        );
    });

    it.each([
        { arch: "arm64" },
        { artifacts: [] },
        { platform: "win32" },
        { version: "30.0.2" },
    ])("rejects an incompatible producer report %j", async (override) => {
        expect.assertions(1);
        const fixture = createFixture();
        writeJson(
            fixture.options.artifactDirectory,
            "distributable-smoke-darwin-universal.json",
            { ...fixture.report, ...override }
        );
        const verify = await verifier();
        expect(() => verify(fixture.options)).toThrow(
            "unexpected version or artifact set"
        );
    });

    it("rejects a failed signing report", async () => {
        expect.assertions(1);
        const fixture = createFixture();
        writeJson(
            fixture.options.artifactDirectory,
            "signing-verification-report.json",
            { platform: "darwin", status: "failed" }
        );
        const verify = await verifier();
        expect(() => verify(fixture.options)).toThrow(
            "signing verification did not pass"
        );
    });

    it.each([
        { sourceSha: "main" },
        { version: "../30.0.3" },
        { runId: "0" },
        { runAttempt: "-1" },
    ])("rejects malformed expected identity %j", async (override) => {
        expect.assertions(1);
        const fixture = createFixture();
        const verify = await verifier();
        expect(() => verify({ ...fixture.options, ...override })).toThrow(
            "Invalid Universal verification"
        );
    });

    it("requires the checked-out package version to equal the bumped release version", async () => {
        expect.assertions(1);
        const fixture = createFixture();
        const verify = await verifier();
        expect(() =>
            verify({ ...fixture.options, expectedVersion: "30.0.4" })
        ).toThrow("does not match the release version");
    });
});
