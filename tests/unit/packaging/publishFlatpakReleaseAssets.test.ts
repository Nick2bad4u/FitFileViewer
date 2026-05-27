import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
    rootFlatpakBundlePath,
    rootFlatpakZipPath,
} from "../../../scripts/lib/workspaces.mjs";

type CommandCall = {
    args: string[];
    command: string;
    options: {
        stdio: "inherit";
    };
};
type FlatpakReleaseAssetPaths = {
    releaseBundlePath: string;
    releaseZipPath: string;
    sourceBundlePath: string;
    sourceZipPath: string;
};
type PublishFlatpakReleaseAssetsModule = {
    getFlatpakReleaseAssetPaths: (
        root: string,
        releaseTag: string
    ) => FlatpakReleaseAssetPaths;
    parseArgs: (
        args: string[],
        environment?: Record<string, string | undefined>
    ) => {
        help: boolean;
        releaseTag: string | undefined;
        root: string;
    };
    publishFlatpakReleaseAssets: (options: {
        releaseTag: string;
        root: string;
        runCommand: (
            command: string,
            args: string[],
            options: CommandCall["options"]
        ) => void;
    }) => FlatpakReleaseAssetPaths;
};

const temporaryRoots: string[] = [];

async function importPublishFlatpakReleaseAssets(): Promise<PublishFlatpakReleaseAssetsModule> {
    return (await import("../../../scripts/publish-flatpak-release-assets.mjs")) as PublishFlatpakReleaseAssetsModule;
}

function makeTemporaryRoot(): string {
    const temporaryRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), "ffv-flatpak-assets-")
    );
    temporaryRoots.push(temporaryRoot);

    return temporaryRoot;
}

afterEach(() => {
    for (const temporaryRoot of temporaryRoots.splice(0)) {
        fs.rmSync(temporaryRoot, { force: true, recursive: true });
    }
});

describe("publish-flatpak-release-assets script", () => {
    it("computes the source and versioned release asset paths", async () => {
        expect.assertions(1);

        const { getFlatpakReleaseAssetPaths } =
            await importPublishFlatpakReleaseAssets();

        expect(
            getFlatpakReleaseAssetPaths("workspace", "v29.9.0")
        ).toStrictEqual({
            releaseBundlePath: path.join(
                "workspace",
                "FitFileViewer-v29.9.0.flatpak"
            ),
            releaseZipPath: path.join(
                "workspace",
                "FitFileViewer-v29.9.0.flatpak.zip"
            ),
            sourceBundlePath: path.join("workspace", rootFlatpakBundlePath),
            sourceZipPath: path.join("workspace", rootFlatpakZipPath),
        });
    });

    it("zips, renames, and uploads Flatpak release assets", async () => {
        expect.assertions(9);

        const { publishFlatpakReleaseAssets } =
            await importPublishFlatpakReleaseAssets();
        const root = makeTemporaryRoot();
        const sourceBundlePath = path.join(root, rootFlatpakBundlePath);
        const calls: CommandCall[] = [];

        fs.writeFileSync(sourceBundlePath, "bundle");

        const paths = publishFlatpakReleaseAssets({
            releaseTag: "v29.9.0",
            root,
            runCommand(command, args, options) {
                calls.push({ args, command, options });

                if (command === "zip") {
                    fs.writeFileSync(args[1] ?? "", "zip");
                }
            },
        });

        expect(calls).toHaveLength(2);
        expect(calls[0]?.command).toBe("zip");
        expect(calls[0]?.args).toStrictEqual([
            "-j",
            path.join(root, rootFlatpakZipPath),
            sourceBundlePath,
        ]);
        expect(calls[1]?.command).toBe("gh");
        expect(calls[1]?.args).toStrictEqual([
            "release",
            "upload",
            "v29.9.0",
            paths.releaseBundlePath,
            paths.releaseZipPath,
            "--clobber",
        ]);
        expect(calls.map((call) => call.options.stdio)).toStrictEqual([
            "inherit",
            "inherit",
        ]);
        expect(fs.existsSync(sourceBundlePath)).toBe(false);
        expect(fs.readFileSync(paths.releaseBundlePath, "utf8")).toBe("bundle");
        expect(fs.readFileSync(paths.releaseZipPath, "utf8")).toBe("zip");
    });

    it("parses release tag options and environment defaults", async () => {
        expect.assertions(4);

        const { parseArgs } = await importPublishFlatpakReleaseAssets();
        const root = makeTemporaryRoot();

        expect(
            parseArgs(["--release-tag=v1"], { RELEASE_TAG: "v0" })
        ).toMatchObject({
            help: false,
            releaseTag: "v1",
        });
        expect(
            parseArgs(["--root", root], { RELEASE_TAG: "v2" })
        ).toMatchObject({
            help: false,
            releaseTag: "v2",
            root,
        });
        expect(parseArgs(["--help"], {})).toMatchObject({ help: true });
        expect(() => parseArgs([], {})).toThrow(
            "--release-tag or RELEASE_TAG is required"
        );
    });
});
