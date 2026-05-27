import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

type OrganizeDistributablesModule = {
    artifactSubdirectories: string[];
    getArtifactPlatformArch: (artifactDirectoryName: string) => string;
    isTopLevelDistributable: (fileName: string) => boolean;
    organizeDistributables: (options?: {
        artifactsDirectory?: string;
        outputDirectory?: string;
    }) => {
        copiedDirectories: { from: string; to: string }[];
        copiedFiles: { from: string; to: string }[];
        processedArtifacts: string[];
    };
    parseArgs: (args: string[]) => {
        artifactsDirectory: string;
        help: boolean;
        outputDirectory: string;
    };
};

const temporaryRoots: string[] = [];

async function importOrganizeDistributables(): Promise<OrganizeDistributablesModule> {
    return (await import("../../../scripts/organize-distributables.mjs")) as OrganizeDistributablesModule;
}

function makeTemporaryRoot(): string {
    const temporaryRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), "ffv-organize-distributables-")
    );

    temporaryRoots.push(temporaryRoot);

    return temporaryRoot;
}

function writeArtifact(
    root: string,
    relativePath: string,
    content = "artifact"
): void {
    const filePath = path.join(root, relativePath);

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
}

afterEach(() => {
    for (const temporaryRoot of temporaryRoots.splice(0)) {
        fs.rmSync(temporaryRoot, { force: true, recursive: true });
    }
});

describe("organize-distributables script", () => {
    it("derives platform and arch from artifact directory names", async () => {
        expect.assertions(2);

        const { getArtifactPlatformArch } =
            await importOrganizeDistributables();

        expect(getArtifactPlatformArch("dist-windows-latest-x64")).toBe(
            "windows-latest-x64"
        );
        expect(getArtifactPlatformArch("other")).toBe("");
    });

    it("matches the workflow's top-level distributable file patterns", async () => {
        expect.assertions(4);

        const { isTopLevelDistributable } =
            await importOrganizeDistributables();

        expect(isTopLevelDistributable("Fit-File-Viewer-nsis-x64.exe")).toBe(
            true
        );
        expect(
            isTopLevelDistributable("fitfileviewer-30.0.0-x64.nsis.7z")
        ).toBe(true);
        expect(isTopLevelDistributable("latest.yml")).toBe(true);
        expect(isTopLevelDistributable("debug.log")).toBe(false);
    });

    it("copies distributables and selected updater directories into release-dist", async () => {
        expect.assertions(9);

        const { artifactSubdirectories, organizeDistributables } =
            await importOrganizeDistributables();
        const temporaryRoot = makeTemporaryRoot();
        const artifactsDirectory = path.join(temporaryRoot, "artifacts");
        const outputDirectory = path.join(temporaryRoot, "release-dist");

        writeArtifact(
            artifactsDirectory,
            path.join("dist-windows-latest-x64", "Fit-File-Viewer-nsis-x64.exe")
        );
        writeArtifact(
            artifactsDirectory,
            path.join(
                "dist-windows-latest-x64",
                "fitfileviewer-30.0.0-x64.nsis.7z"
            )
        );
        writeArtifact(
            artifactsDirectory,
            path.join("dist-windows-latest-x64", "latest.yml")
        );
        writeArtifact(
            artifactsDirectory,
            path.join("dist-windows-latest-x64", "debug.log")
        );
        writeArtifact(
            artifactsDirectory,
            path.join(
                "dist-windows-latest-x64",
                "nsis-web",
                "latest-nsis-web.yml"
            )
        );

        const result = organizeDistributables({
            artifactsDirectory,
            outputDirectory,
        });

        expect(artifactSubdirectories).toContain("nsis-web");
        expect(result.processedArtifacts).toHaveLength(1);
        expect(result.copiedFiles).toHaveLength(3);
        expect(result.copiedDirectories).toHaveLength(1);
        expect(
            fs.existsSync(
                path.join(outputDirectory, "windows-latest-x64", "debug.log")
            )
        ).toBe(false);
        expect(
            fs.existsSync(
                path.join(
                    outputDirectory,
                    "windows-latest-x64",
                    "Fit-File-Viewer-nsis-x64.exe"
                )
            )
        ).toBe(true);
        expect(
            fs.existsSync(
                path.join(outputDirectory, "windows-latest-x64", "latest.yml")
            )
        ).toBe(true);
        expect(
            fs.existsSync(
                path.join(
                    outputDirectory,
                    "windows-latest-x64",
                    "nsis-web",
                    "latest-nsis-web.yml"
                )
            )
        ).toBe(true);
        expect(result.copiedDirectories[0]?.to).toContain("nsis-web");
    });

    it("renames mac latest metadata and removes generic latest-mac copies", async () => {
        expect.assertions(4);

        const { organizeDistributables } = await importOrganizeDistributables();
        const temporaryRoot = makeTemporaryRoot();
        const artifactsDirectory = path.join(temporaryRoot, "artifacts");
        const outputDirectory = path.join(temporaryRoot, "release-dist");
        const latestMacSource = path.join(
            artifactsDirectory,
            "dist-macos-latest-arm64",
            "latest-mac.yml"
        );

        writeArtifact(
            artifactsDirectory,
            path.join("dist-macos-latest-arm64", "latest-mac.yml"),
            "latest-mac"
        );

        const result = organizeDistributables({
            artifactsDirectory,
            outputDirectory,
        });

        expect(fs.existsSync(latestMacSource)).toBe(false);
        expect(
            fs.existsSync(
                path.join(
                    outputDirectory,
                    "macos-latest-arm64",
                    "latest-mac.yml"
                )
            )
        ).toBe(false);
        expect(
            fs.readFileSync(
                path.join(
                    outputDirectory,
                    "macos-latest-arm64",
                    "latest-macos-latest-arm64.yml"
                ),
                "utf8"
            )
        ).toBe("latest-mac");
        expect(
            result.copiedFiles.some((file) =>
                file.to.includes("latest-macos-latest-arm64.yml")
            )
        ).toBe(true);
    });

    it("returns an empty result when the artifacts directory is missing", async () => {
        expect.assertions(1);

        const { organizeDistributables } = await importOrganizeDistributables();
        const temporaryRoot = makeTemporaryRoot();

        expect(
            organizeDistributables({
                artifactsDirectory: path.join(temporaryRoot, "missing"),
                outputDirectory: path.join(temporaryRoot, "release-dist"),
            })
        ).toStrictEqual({
            copiedDirectories: [],
            copiedFiles: [],
            processedArtifacts: [],
        });
    });

    it("parses artifacts and output directory arguments", async () => {
        expect.assertions(1);

        const { parseArgs } = await importOrganizeDistributables();

        expect(
            parseArgs([
                "--artifacts-directory=tmp/artifacts",
                "--output-directory",
                "tmp/release-dist",
            ])
        ).toStrictEqual({
            artifactsDirectory: "tmp/artifacts",
            help: false,
            outputDirectory: "tmp/release-dist",
        });
    });

    it("rejects missing output directory values", async () => {
        expect.assertions(1);

        const { parseArgs } = await importOrganizeDistributables();

        expect(() => parseArgs(["--output-directory"])).toThrow(
            "--output-directory requires a value"
        );
    });
});
