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

function getPathStates(
    root: string,
    relativePaths: string[]
): Record<string, "missing" | "present"> {
    return Object.fromEntries(
        relativePaths.map((relativePath) => [
            relativePath,
            fs.existsSync(path.join(root, relativePath))
                ? "present"
                : "missing",
        ])
    );
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
        expect.assertions(1);

        const { isTopLevelDistributable } =
            await importOrganizeDistributables();

        expect(
            [
                "Fit-File-Viewer-nsis-x64.exe",
                "fitfileviewer-30.0.0-x64.nsis.7z",
                "latest.yml",
                "debug.log",
            ].map((fileName) => ({
                fileName,
                isDistributable: isTopLevelDistributable(fileName),
            }))
        ).toStrictEqual([
            {
                fileName: "Fit-File-Viewer-nsis-x64.exe",
                isDistributable: true,
            },
            {
                fileName: "fitfileviewer-30.0.0-x64.nsis.7z",
                isDistributable: true,
            },
            { fileName: "latest.yml", isDistributable: true },
            { fileName: "debug.log", isDistributable: false },
        ]);
    });

    it("copies distributables and selected updater directories into release-dist", async () => {
        expect.assertions(1);

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

        expect({
            copiedDirectoryNames: result.copiedDirectories.map(({ to }) =>
                path.basename(to)
            ),
            copiedFileNames: result.copiedFiles.map(({ to }) =>
                path.basename(to)
            ),
            pathStates: getPathStates(outputDirectory, [
                path.join("windows-latest-x64", "debug.log"),
                path.join("windows-latest-x64", "Fit-File-Viewer-nsis-x64.exe"),
                path.join("windows-latest-x64", "latest.yml"),
                path.join(
                    "windows-latest-x64",
                    "nsis-web",
                    "latest-nsis-web.yml"
                ),
            ]),
            processedArtifactCount: result.processedArtifacts.length,
            selectedUpdaterDirectories: artifactSubdirectories,
        }).toStrictEqual({
            copiedDirectoryNames: ["nsis-web"],
            copiedFileNames: [
                "Fit-File-Viewer-nsis-x64.exe",
                "fitfileviewer-30.0.0-x64.nsis.7z",
                "latest.yml",
            ],
            pathStates: {
                [path.join(
                    "windows-latest-x64",
                    "Fit-File-Viewer-nsis-x64.exe"
                )]: "present",
                [path.join("windows-latest-x64", "debug.log")]: "missing",
                [path.join("windows-latest-x64", "latest.yml")]: "present",
                [path.join(
                    "windows-latest-x64",
                    "nsis-web",
                    "latest-nsis-web.yml"
                )]: "present",
            },
            processedArtifactCount: 1,
            selectedUpdaterDirectories: [
                "nsis-web",
                "squirrel-windows",
                "squirrel-windows-ia32",
            ],
        });
    });

    it("renames mac latest metadata and removes generic latest-mac copies", async () => {
        expect.assertions(1);

        const { organizeDistributables } = await importOrganizeDistributables();
        const temporaryRoot = makeTemporaryRoot();
        const artifactsDirectory = path.join(temporaryRoot, "artifacts");
        const outputDirectory = path.join(temporaryRoot, "release-dist");
        const latestMacSource = path.join(
            "dist-macos-latest-arm64",
            "latest-mac.yml"
        );
        const latestMacOutput = path.join(
            "macos-latest-arm64",
            "latest-mac.yml"
        );
        const renamedLatestMacOutput = path.join(
            "macos-latest-arm64",
            "latest-macos-latest-arm64.yml"
        );

        writeArtifact(artifactsDirectory, latestMacSource, "latest-mac");

        const result = organizeDistributables({
            artifactsDirectory,
            outputDirectory,
        });

        expect({
            copiedFileNames: result.copiedFiles.map(({ to }) =>
                path.basename(to)
            ),
            outputPathStates: getPathStates(outputDirectory, [
                latestMacOutput,
                renamedLatestMacOutput,
            ]),
            renamedLatestMacContent: fs.readFileSync(
                path.join(outputDirectory, renamedLatestMacOutput),
                "utf8"
            ),
            sourcePathStates: getPathStates(artifactsDirectory, [
                latestMacSource,
            ]),
        }).toStrictEqual({
            copiedFileNames: [
                "latest-mac.yml",
                "latest-macos-latest-arm64.yml",
            ],
            outputPathStates: {
                [latestMacOutput]: "missing",
                [renamedLatestMacOutput]: "present",
            },
            renamedLatestMacContent: "latest-mac",
            sourcePathStates: {
                [latestMacSource]: "missing",
            },
        });
    });

    it("returns an empty result when the artifacts directory is missing", async () => {
        expect.assertions(2);

        const { organizeDistributables } = await importOrganizeDistributables();
        const temporaryRoot = makeTemporaryRoot();
        const outputDirectory = path.join(temporaryRoot, "release-dist");

        expect(
            organizeDistributables({
                artifactsDirectory: path.join(temporaryRoot, "missing"),
                outputDirectory,
            })
        ).toStrictEqual({
            copiedDirectories: [],
            copiedFiles: [],
            processedArtifacts: [],
        });
        expect(fs.existsSync(outputDirectory)).toBe(false);
    });

    it("does not create output when artifacts contain no dist directories", async () => {
        expect.assertions(2);

        const { organizeDistributables } = await importOrganizeDistributables();
        const temporaryRoot = makeTemporaryRoot();
        const artifactsDirectory = path.join(temporaryRoot, "artifacts");
        const outputDirectory = path.join(temporaryRoot, "release-dist");

        writeArtifact(
            artifactsDirectory,
            path.join("logs", "debug.log"),
            "ignore"
        );

        expect(
            organizeDistributables({
                artifactsDirectory,
                outputDirectory,
            })
        ).toStrictEqual({
            copiedDirectories: [],
            copiedFiles: [],
            processedArtifacts: [],
        });
        expect(fs.existsSync(outputDirectory)).toBe(false);
    });

    it("does not create output for dist artifacts without distributables", async () => {
        expect.assertions(3);

        const { organizeDistributables } = await importOrganizeDistributables();
        const temporaryRoot = makeTemporaryRoot();
        const artifactsDirectory = path.join(temporaryRoot, "artifacts");
        const outputDirectory = path.join(temporaryRoot, "release-dist");

        writeArtifact(
            artifactsDirectory,
            path.join("dist-windows-latest-x64", "debug.log"),
            "ignore"
        );

        expect(
            organizeDistributables({
                artifactsDirectory,
                outputDirectory,
            })
        ).toStrictEqual({
            copiedDirectories: [],
            copiedFiles: [],
            processedArtifacts: [],
        });
        expect(fs.existsSync(outputDirectory)).toBe(false);
        expect(
            fs.existsSync(path.join(outputDirectory, "windows-latest-x64"))
        ).toBe(false);
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
