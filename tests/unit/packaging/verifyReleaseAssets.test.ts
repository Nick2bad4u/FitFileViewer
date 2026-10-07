// @vitest-environment node

import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";
import { stringify as stringifyYaml } from "yaml";

type ReleaseAsset = {
    digest: string;
    name: string;
    size: number;
    state: string;
};

type VerifyReleaseAssetsModule = {
    fetchReleaseByTag: (options: {
        apiUrl: string;
        fetchImplementation: typeof fetch;
        repository: string;
        requireDraft?: boolean;
        tag: string;
        token: string;
    }) => Promise<unknown>;
    parseArgs: (
        args: string[],
        environment?: Record<string, string | undefined>
    ) => {
        releaseDistDirectory: string;
        repository?: string;
        requireDraft: boolean;
        tag?: string;
        version?: string;
    };
    requiredUpdaterMetadataNames: string[];
    verifyReleaseAssets: (options: {
        expectedVersion: string;
        release: { assets: ReleaseAsset[]; draft: boolean };
        releaseDistDirectory: string;
        requireDraft?: boolean;
    }) => {
        metadataCount: number;
        referencedAssetCount: number;
    };
};

type ReleaseFixture = {
    assets: ReleaseAsset[];
    metadataPaths: Record<string, string>;
    releaseDistDirectory: string;
};

const temporaryRoots: string[] = [];

async function importVerifyReleaseAssets(): Promise<VerifyReleaseAssetsModule> {
    return (await import("../../../scripts/verify-release-assets.mjs")) as VerifyReleaseAssetsModule;
}

function createReleaseFixture(version = "30.0.0"): ReleaseFixture {
    const releaseDistDirectory = fs.mkdtempSync(
        path.join(os.tmpdir(), "ffv-verify-release-assets-")
    );
    temporaryRoots.push(releaseDistDirectory);

    const updaterTargets = [
        {
            directory: "windows-x64",
            metadataName: "latest.yml",
            targetName: `Fit-File-Viewer-nsis-x64-${version}.exe`,
        },
        {
            directory: "windows-ia32",
            metadataName: "latest-win32.yml",
            targetName: `Fit-File-Viewer-nsis-ia32-${version}.exe`,
        },
        {
            directory: ".",
            metadataName: "latest-mac.yml",
            targetName: `Fit-File-Viewer-darwin-universal-${version}.zip`,
        },
        {
            directory: "linux-x64",
            metadataName: "latest-linux.yml",
            targetName: `Fit-File-Viewer-appimage-x86_64-${version}.AppImage`,
        },
    ];
    const assets: ReleaseAsset[] = [];
    const metadataPaths: Record<string, string> = {};

    for (const target of updaterTargets) {
        const directoryPath = path.join(releaseDistDirectory, target.directory);
        const targetPath = path.join(directoryPath, target.targetName);
        const metadataPath = path.join(directoryPath, target.metadataName);
        const targetContents = Buffer.from(`artifact:${target.targetName}`);

        fs.mkdirSync(directoryPath, { recursive: true });
        fs.writeFileSync(targetPath, targetContents);

        const sha512 = createHash("sha512")
            .update(targetContents)
            .digest("base64");
        fs.writeFileSync(
            metadataPath,
            stringifyYaml({
                files: [
                    {
                        sha512,
                        size: targetContents.length,
                        url: target.targetName,
                    },
                ],
                path: target.targetName,
                sha512,
                version,
            })
        );
        metadataPaths[target.metadataName] = metadataPath;
        assets.push(
            createReleaseAsset(targetPath, target.targetName),
            createReleaseAsset(metadataPath, target.metadataName)
        );
    }

    return { assets, metadataPaths, releaseDistDirectory };
}

function createReleaseAsset(filePath: string, name: string): ReleaseAsset {
    const contents = fs.readFileSync(filePath);

    return {
        digest: `sha256:${createHash("sha256").update(contents).digest("hex")}`,
        name,
        size: contents.length,
        state: "uploaded",
    };
}

function addWebInstallerFixture(
    fixture: ReleaseFixture,
    packageOverrides: Record<string, unknown> = {},
    installerUrl = "Fit-File-Viewer-nsis-web-x64-30.0.0.exe"
): { metadataPath: string; packagePath: string } {
    const installerName = "Fit-File-Viewer-nsis-web-x64-30.0.0.exe";
    const packageName = "fitfileviewer-30.0.0-x64.nsis.7z";
    const installerPath = path.join(
        fixture.releaseDistDirectory,
        installerName
    );
    const packagePath = path.join(fixture.releaseDistDirectory, packageName);
    const metadataName = "latest-nsis-web.yml";
    const metadataPath = path.join(fixture.releaseDistDirectory, metadataName);
    const installerContents = "web installer";
    const packageContents = "web installer payload";
    const installerSha512 = createHash("sha512")
        .update(installerContents)
        .digest("base64");
    const packageEntry = {
        file: packageName,
        path: packageName,
        sha512: createHash("sha512").update(packageContents).digest("base64"),
        size: packageContents.length,
        ...packageOverrides,
    };

    fs.writeFileSync(installerPath, installerContents);
    fs.writeFileSync(packagePath, packageContents);
    fs.writeFileSync(
        metadataPath,
        stringifyYaml({
            files: [{ sha512: installerSha512, url: installerUrl }],
            // Shared package objects exercise YAML aliases and duplicate references.
            packages: { ia32: packageEntry, x64: packageEntry },
            path: installerUrl,
            sha512: installerSha512,
            version: "30.0.0",
        })
    );
    fixture.assets.push(
        createReleaseAsset(installerPath, installerName),
        createReleaseAsset(packagePath, packageName),
        createReleaseAsset(metadataPath, metadataName)
    );
    return { metadataPath, packagePath };
}

afterEach(() => {
    for (const temporaryRoot of temporaryRoots.splice(0)) {
        fs.rmSync(temporaryRoot, { force: true, recursive: true });
    }
});

describe("verify-release-assets script", () => {
    it("verifies optional web channels and aliased payloads without double counting", async () => {
        expect.assertions(1);
        const { verifyReleaseAssets } = await importVerifyReleaseAssets();
        const fixture = createReleaseFixture();
        addWebInstallerFixture(fixture);

        expect(
            verifyReleaseAssets({
                expectedVersion: "30.0.0",
                release: { assets: fixture.assets, draft: true },
                releaseDistDirectory: fixture.releaseDistDirectory,
            })
        ).toStrictEqual({ metadataCount: 5, referencedAssetCount: 6 });
    });

    it.each([
        [
            "hash",
            { sha512: "incorrect" },
            "sha512 mismatch",
        ],
        [
            "size",
            { size: 999 },
            "size mismatch",
        ],
        [
            "invalid size",
            { size: "21" },
            "invalid ia32 package",
        ],
        [
            "conflicting filename",
            { file: "different.nsis.7z" },
            "invalid ia32 package",
        ],
        [
            "unsafe path",
            { file: "../payload.7z", path: "../payload.7z" },
            "invalid files entry",
        ],
    ])(
        "rejects a web package with an invalid %s",
        async (_label, overrides, message) => {
            expect.assertions(1);
            const { verifyReleaseAssets } = await importVerifyReleaseAssets();
            const fixture = createReleaseFixture();
            addWebInstallerFixture(
                fixture,
                overrides as Record<string, unknown>
            );

            expect(() =>
                verifyReleaseAssets({
                    expectedVersion: "30.0.0",
                    release: { assets: fixture.assets, draft: true },
                    releaseDistDirectory: fixture.releaseDistDirectory,
                })
            ).toThrow(String(message));
        }
    );

    it.each(["metadata", "payload"])(
        "rejects web %s omitted from uploaded assets",
        async (missing) => {
            expect.assertions(1);
            const { verifyReleaseAssets } = await importVerifyReleaseAssets();
            const fixture = createReleaseFixture();
            addWebInstallerFixture(fixture);
            const missingName =
                missing === "metadata"
                    ? "latest-nsis-web.yml"
                    : "fitfileviewer-30.0.0-x64.nsis.7z";

            expect(() =>
                verifyReleaseAssets({
                    expectedVersion: "30.0.0",
                    release: {
                        assets: fixture.assets.filter(
                            ({ name }) => name !== missingName
                        ),
                        draft: true,
                    },
                    releaseDistDirectory: fixture.releaseDistDirectory,
                })
            ).toThrow("not uploaded");
        }
    );

    it("rejects a web payload missing locally", async () => {
        expect.assertions(1);
        const { verifyReleaseAssets } = await importVerifyReleaseAssets();
        const fixture = createReleaseFixture();
        const { packagePath } = addWebInstallerFixture(fixture);
        fs.unlinkSync(packagePath);

        expect(() =>
            verifyReleaseAssets({
                expectedVersion: "30.0.0",
                release: { assets: fixture.assets, draft: true },
                releaseDistDirectory: fixture.releaseDistDirectory,
            })
        ).toThrow(
            "Expected exactly one local fitfileviewer-30.0.0-x64.nsis.7z, found 0"
        );
    });

    it.each([
        "../installer.exe",
        "https://example.test/installer.exe",
        "..\\installer.exe",
        "installer.exe?download=1",
    ])("rejects non-filename update references: %s", async (url) => {
        expect.assertions(1);
        const { verifyReleaseAssets } = await importVerifyReleaseAssets();
        const fixture = createReleaseFixture();
        addWebInstallerFixture(fixture, {}, url);

        expect(() =>
            verifyReleaseAssets({
                expectedVersion: "30.0.0",
                release: { assets: fixture.assets, draft: true },
                releaseDistDirectory: fixture.releaseDistDirectory,
            })
        ).toThrow("invalid files entry");
    });

    it("verifies canonical updater metadata against local and uploaded artifacts", async () => {
        expect.assertions(1);

        const { verifyReleaseAssets } = await importVerifyReleaseAssets();
        const fixture = createReleaseFixture();

        expect(
            verifyReleaseAssets({
                expectedVersion: "30.0.0",
                release: { assets: fixture.assets, draft: true },
                releaseDistDirectory: fixture.releaseDistDirectory,
                requireDraft: true,
            })
        ).toStrictEqual({
            metadataCount: 4,
            referencedAssetCount: 4,
        });
    });

    it("rejects a release missing a canonical updater channel", async () => {
        expect.assertions(1);

        const { verifyReleaseAssets } = await importVerifyReleaseAssets();
        const fixture = createReleaseFixture();

        expect(() =>
            verifyReleaseAssets({
                expectedVersion: "30.0.0",
                release: {
                    assets: fixture.assets.filter(
                        ({ name }) => name !== "latest-mac.yml"
                    ),
                    draft: true,
                },
                releaseDistDirectory: fixture.releaseDistDirectory,
            })
        ).toThrow(
            "Release is missing required updater metadata: latest-mac.yml"
        );
    });

    it("rejects updater hashes that do not match the distributable", async () => {
        expect.assertions(1);

        const { verifyReleaseAssets } = await importVerifyReleaseAssets();
        const fixture = createReleaseFixture();
        const latestWindowsPath = fixture.metadataPaths["latest.yml"];

        fs.writeFileSync(
            latestWindowsPath,
            fs
                .readFileSync(latestWindowsPath, "utf8")
                .replace(/sha512: .+/gu, "sha512: invalid")
        );
        fixture.assets = fixture.assets.map((asset) =>
            asset.name === "latest.yml"
                ? createReleaseAsset(latestWindowsPath, "latest.yml")
                : asset
        );

        expect(() =>
            verifyReleaseAssets({
                expectedVersion: "30.0.0",
                release: { assets: fixture.assets, draft: true },
                releaseDistDirectory: fixture.releaseDistDirectory,
            })
        ).toThrow("latest.yml sha512 mismatch");
    });

    it("requires draft state when release publication is gated", async () => {
        expect.assertions(1);

        const { verifyReleaseAssets } = await importVerifyReleaseAssets();
        const fixture = createReleaseFixture();

        expect(() =>
            verifyReleaseAssets({
                expectedVersion: "30.0.0",
                release: { assets: fixture.assets, draft: false },
                releaseDistDirectory: fixture.releaseDistDirectory,
                requireDraft: true,
            })
        ).toThrow("Release must remain a draft until verification passes");
    });

    it("parses release verification workflow arguments", async () => {
        expect.assertions(1);

        const { parseArgs } = await importVerifyReleaseAssets();

        expect(
            parseArgs(
                [
                    "--tag=v30.0.0",
                    "--version",
                    "30.0.0",
                    "--require-draft",
                    "--release-dist=tmp/release-dist",
                ],
                {
                    GH_TOKEN: "token",
                    GITHUB_REPOSITORY: "Nick2bad4u/FitFileViewer",
                }
            )
        ).toMatchObject({
            releaseDistDirectory: path.resolve("tmp/release-dist"),
            repository: "Nick2bad4u/FitFileViewer",
            requireDraft: true,
            tag: "v30.0.0",
            version: "30.0.0",
        });
    });

    it("finds an authenticated draft when tag lookup returns 404", async () => {
        expect.assertions(2);

        const { fetchReleaseByTag } = await importVerifyReleaseAssets();
        const draftRelease = {
            draft: true,
            id: 30,
            tag_name: "v30.0.0",
        };
        const fetchImplementation: typeof fetch = async (input) => {
            const url = String(input);
            if (url.includes("/releases/tags/")) {
                return new Response("Not Found", {
                    status: 404,
                    statusText: "Not Found",
                });
            }

            expect(url).toContain("/releases?per_page=100");
            return Response.json([draftRelease]);
        };

        await expect(
            fetchReleaseByTag({
                apiUrl: "https://api.github.test",
                fetchImplementation,
                repository: "Nick2bad4u/FitFileViewer",
                requireDraft: true,
                tag: "v30.0.0",
                token: "token",
            })
        ).resolves.toStrictEqual(draftRelease);
    });
});
