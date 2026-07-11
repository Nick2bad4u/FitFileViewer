import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

type FixLatestYmlSha512Module = {
    defaultReleaseDistDirectory: string;
    findLatestYmlFiles: (rootDirectory: string) => string[];
    fixLatestYmlSha512: (releaseDistDirectory?: string) => {
        file: string;
        fileCount: number;
        missingCount: number;
        updatedCount: number;
    }[];
    parseArgs: (args: string[]) => {
        help: boolean;
        releaseDistDirectory: string;
    };
    toSha512Base64: (filePath: string) => string;
    updateLatestYmlSha512: (latestYmlFile: string) => {
        file: string;
        fileCount: number;
        missingCount: number;
        updatedCount: number;
    };
};

const temporaryRoots: string[] = [];

async function importFixLatestYmlSha512(): Promise<FixLatestYmlSha512Module> {
    return (await import("../../../scripts/fix-latest-yml-sha512.mjs")) as FixLatestYmlSha512Module;
}

function makeTemporaryRoot(): string {
    const temporaryRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), "ffv-fix-latest-yml-sha512-")
    );

    temporaryRoots.push(temporaryRoot);

    return temporaryRoot;
}

function writeFile(
    root: string,
    relativePath: string,
    content: string
): string {
    const filePath = path.join(root, relativePath);

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);

    return filePath;
}

function sha512Base64(content: string): string {
    return crypto.createHash("sha512").update(content).digest("base64");
}

function normalizeTestPath(filePath: string): string {
    return filePath.split(path.sep).join("/");
}

afterEach(() => {
    for (const temporaryRoot of temporaryRoots.splice(0)) {
        fs.rmSync(temporaryRoot, { force: true, recursive: true });
    }
});

describe("fix-latest-yml-sha512 script", () => {
    it("discovers latest yml files recursively in stable order", async () => {
        expect.assertions(1);

        const { findLatestYmlFiles } = await importFixLatestYmlSha512();
        const releaseDistDirectory = makeTemporaryRoot();

        writeFile(
            releaseDistDirectory,
            path.join("windows-latest-x64", "latest.yml"),
            "latest"
        );
        writeFile(
            releaseDistDirectory,
            path.join("windows-latest-x64", "nsis-web", "latest-nsis-web.yml"),
            "latest"
        );
        writeFile(
            releaseDistDirectory,
            path.join("windows-latest-x64", "debug.yml"),
            "ignore"
        );

        expect(
            findLatestYmlFiles(releaseDistDirectory).map((file) =>
                path.relative(releaseDistDirectory, file)
            )
        ).toStrictEqual([
            path.join("windows-latest-x64", "latest.yml"),
            path.join("windows-latest-x64", "nsis-web", "latest-nsis-web.yml"),
        ]);
    });

    it("rewrites files section hashes and top-level updater metadata", async () => {
        expect.assertions(2);

        const { updateLatestYmlSha512 } = await importFixLatestYmlSha512();
        const releaseDistDirectory = makeTemporaryRoot();
        const latestYmlFile = writeFile(
            releaseDistDirectory,
            path.join("windows-latest-x64", "latest.yml"),
            [
                "version: 30.0.0",
                "files:",
                "  - url: Fit-File-Viewer-30.0.0-x64.exe",
                "    sha512: old",
                "      size: 123",
                "  - url: fitfileviewer-30.0.0-x64.nsis.7z",
                "    sha512: old",
                "    size: 456",
                "path: old.exe",
                "sha512: old-top-level",
                "releaseDate: 2026-05-27T00:00:00.000Z",
                "",
            ].join("\n")
        );

        writeFile(
            releaseDistDirectory,
            path.join("windows-latest-x64", "Fit-File-Viewer-30.0.0-x64.exe"),
            "installer"
        );
        writeFile(
            releaseDistDirectory,
            path.join("windows-latest-x64", "fitfileviewer-30.0.0-x64.nsis.7z"),
            "package"
        );

        const firstHash = sha512Base64("installer");
        const secondHash = sha512Base64("package");
        const summary = updateLatestYmlSha512(latestYmlFile);
        const updatedLatestYml = fs.readFileSync(latestYmlFile, "utf8");

        expect(summary).toStrictEqual({
            file: normalizeTestPath(latestYmlFile),
            fileCount: 2,
            missingCount: 0,
            updatedCount: 2,
        });
        expect(updatedLatestYml).toBe(
            [
                "version: 30.0.0",
                "files:",
                "  - url: Fit-File-Viewer-30.0.0-x64.exe",
                `    sha512: ${firstHash}`,
                "    size: 123",
                "  - url: fitfileviewer-30.0.0-x64.nsis.7z",
                `    sha512: ${secondHash}`,
                "    size: 456",
                "path: Fit-File-Viewer-30.0.0-x64.exe",
                `sha512: ${firstHash}`,
                "releaseDate: 2026-05-27T00:00:00.000Z",
                "",
            ].join("\n")
        );
    });

    it("blanks missing file hashes without changing top-level metadata", async () => {
        expect.assertions(2);

        const { updateLatestYmlSha512 } = await importFixLatestYmlSha512();
        const releaseDistDirectory = makeTemporaryRoot();
        const latestYmlFile = writeFile(
            releaseDistDirectory,
            path.join("windows-latest-ia32", "latest-win32.yml"),
            [
                "files:",
                "  - url: missing.exe",
                "    sha512: old",
                "    size: 123",
                "path: original.exe",
                "sha512: original-top-level",
            ].join("\n")
        );

        const summary = updateLatestYmlSha512(latestYmlFile);
        const updatedLatestYml = fs.readFileSync(latestYmlFile, "utf8");

        expect(summary).toStrictEqual({
            file: normalizeTestPath(latestYmlFile),
            fileCount: 1,
            missingCount: 1,
            updatedCount: 0,
        });
        expect(updatedLatestYml).toBe(
            [
                "files:",
                "  - url: missing.exe",
                "    sha512: ",
                "    size: 123",
                "path: original.exe",
                "sha512: original-top-level",
            ].join("\n")
        );
    });

    it("updates every latest yml file under release-dist", async () => {
        expect.assertions(3);

        const { fixLatestYmlSha512 } = await importFixLatestYmlSha512();
        const releaseDistDirectory = makeTemporaryRoot();

        writeFile(
            releaseDistDirectory,
            path.join("windows-latest-x64", "app.exe"),
            "x64"
        );
        writeFile(
            releaseDistDirectory,
            path.join("windows-latest-x64", "latest.yml"),
            [
                "files:",
                "  - url: app.exe",
                "    sha512: old",
            ].join("\n")
        );
        writeFile(
            releaseDistDirectory,
            path.join("windows-latest-ia32", "app.exe"),
            "ia32"
        );
        writeFile(
            releaseDistDirectory,
            path.join("windows-latest-ia32", "latest-win32.yml"),
            [
                "files:",
                "  - url: app.exe",
                "    sha512: old",
            ].join("\n")
        );

        const x64LatestYmlFile = path.join(
            releaseDistDirectory,
            "windows-latest-x64",
            "latest.yml"
        );
        const ia32LatestYmlFile = path.join(
            releaseDistDirectory,
            "windows-latest-ia32",
            "latest-win32.yml"
        );
        const summaries = fixLatestYmlSha512(releaseDistDirectory);

        expect(summaries).toStrictEqual([
            {
                file: normalizeTestPath(ia32LatestYmlFile),
                fileCount: 1,
                missingCount: 0,
                updatedCount: 1,
            },
            {
                file: normalizeTestPath(x64LatestYmlFile),
                fileCount: 1,
                missingCount: 0,
                updatedCount: 1,
            },
        ]);
        expect(fs.readFileSync(x64LatestYmlFile, "utf8")).toBe(
            [
                "files:",
                "  - url: app.exe",
                `    sha512: ${sha512Base64("x64")}`,
            ].join("\n")
        );
        expect(fs.readFileSync(ia32LatestYmlFile, "utf8")).toBe(
            [
                "files:",
                "  - url: app.exe",
                `    sha512: ${sha512Base64("ia32")}`,
            ].join("\n")
        );
    });

    it("resolves uniquely named updater payloads from nested release directories", async () => {
        expect.assertions(2);

        const { fixLatestYmlSha512 } = await importFixLatestYmlSha512();
        const releaseDistDirectory = makeTemporaryRoot();
        const zipName = "Fit-File-Viewer-darwin-universal-30.0.0.zip";
        const dmgName = "Fit-File-Viewer-dmg-universal-30.0.0.dmg";
        const latestMacFile = writeFile(
            releaseDistDirectory,
            "latest-mac.yml",
            [
                "version: 30.0.0",
                "files:",
                `  - url: ${zipName}`,
                "    sha512: ",
                "    size: 3",
                `  - url: ${dmgName}`,
                "    sha512: ",
                "    size: 3",
                `path: ${zipName}`,
                "sha512: old",
            ].join("\n")
        );

        writeFile(
            releaseDistDirectory,
            path.join("macos-universal", zipName),
            "zip"
        );
        writeFile(
            releaseDistDirectory,
            path.join("macos-universal", dmgName),
            "dmg"
        );

        expect(fixLatestYmlSha512(releaseDistDirectory)).toStrictEqual([
            {
                file: normalizeTestPath(latestMacFile),
                fileCount: 2,
                missingCount: 0,
                updatedCount: 2,
            },
        ]);
        expect(fs.readFileSync(latestMacFile, "utf8")).toContain(
            [
                `    sha512: ${sha512Base64("zip")}`,
                "    size: 3",
                `  - url: ${dmgName}`,
                `    sha512: ${sha512Base64("dmg")}`,
            ].join("\n")
        );
    });

    it("returns an empty result when release-dist is missing", async () => {
        expect.assertions(1);

        const { fixLatestYmlSha512 } = await importFixLatestYmlSha512();
        const temporaryRoot = makeTemporaryRoot();

        expect(
            fixLatestYmlSha512(path.join(temporaryRoot, "missing"))
        ).toStrictEqual([]);
    });

    it("parses release-dist directory arguments", async () => {
        expect.assertions(2);

        const { defaultReleaseDistDirectory, parseArgs } =
            await importFixLatestYmlSha512();

        expect(parseArgs([])).toStrictEqual({
            help: false,
            releaseDistDirectory: defaultReleaseDistDirectory,
        });
        expect(
            parseArgs(["--release-dist-directory=tmp/release-dist"])
        ).toStrictEqual({
            help: false,
            releaseDistDirectory: "tmp/release-dist",
        });
    });

    it("rejects missing release-dist directory values", async () => {
        expect.assertions(1);

        const { parseArgs } = await importFixLatestYmlSha512();

        expect(() => parseArgs(["--release-dist-directory"])).toThrow(
            "--release-dist-directory requires a value"
        );
    });

    it("computes sha512 in base64 form", async () => {
        expect.assertions(1);

        const { toSha512Base64 } = await importFixLatestYmlSha512();
        const temporaryRoot = makeTemporaryRoot();
        const artifactPath = writeFile(
            temporaryRoot,
            "artifact.bin",
            "artifact"
        );

        expect(toSha512Base64(artifactPath)).toBe(sha512Base64("artifact"));
    });
});
