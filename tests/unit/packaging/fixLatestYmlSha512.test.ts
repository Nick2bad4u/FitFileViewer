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
        expect.assertions(5);

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
        const topLevelSha512Line = updatedLatestYml
            .split("\n")
            .find((line) => line.startsWith("sha512:"));

        expect(summary).toStrictEqual({
            file: normalizeTestPath(latestYmlFile),
            fileCount: 2,
            missingCount: 0,
            updatedCount: 2,
        });
        expect(updatedLatestYml).toContain(`    sha512: ${firstHash}`);
        expect(updatedLatestYml).toContain(`    sha512: ${secondHash}`);
        expect(updatedLatestYml).toContain(
            "path: Fit-File-Viewer-30.0.0-x64.exe"
        );
        expect(topLevelSha512Line).toBe(`sha512: ${firstHash}`);
    });

    it("blanks missing file hashes without changing top-level metadata", async () => {
        expect.assertions(4);

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
        expect(updatedLatestYml).toContain("    sha512: \n");
        expect(updatedLatestYml).toContain("path: original.exe");
        expect(updatedLatestYml).toContain("sha512: original-top-level");
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

        const summaries = fixLatestYmlSha512(releaseDistDirectory);

        expect(summaries).toHaveLength(2);
        expect(
            fs.readFileSync(
                path.join(
                    releaseDistDirectory,
                    "windows-latest-x64",
                    "latest.yml"
                ),
                "utf8"
            )
        ).toContain(sha512Base64("x64"));
        expect(
            fs.readFileSync(
                path.join(
                    releaseDistDirectory,
                    "windows-latest-ia32",
                    "latest-win32.yml"
                ),
                "utf8"
            )
        ).toContain(sha512Base64("ia32"));
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
