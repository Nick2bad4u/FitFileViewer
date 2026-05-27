import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

type ListReleaseDistFilesModule = {
    createReleaseDistFileReport: (releaseDistDirectory?: string) => string;
    defaultReleaseDistDirectory: string;
    findDuplicateFilePaths: (filePaths: string[]) => string[];
    listReleaseDistFiles: (releaseDistDirectory?: string) => string[];
    parseArgs: (args: string[]) => {
        help: boolean;
        releaseDistDirectory: string;
    };
};

const temporaryRoots: string[] = [];

async function importListReleaseDistFiles(): Promise<ListReleaseDistFilesModule> {
    return (await import("../../../scripts/list-release-dist-files.mjs")) as ListReleaseDistFilesModule;
}

function makeTemporaryRoot(): string {
    const temporaryRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), "ffv-list-release-dist-files-")
    );

    temporaryRoots.push(temporaryRoot);

    return temporaryRoot;
}

function writeFile(root: string, relativePath: string): string {
    const filePath = path.join(root, relativePath);

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "asset");

    return filePath;
}

afterEach(() => {
    for (const temporaryRoot of temporaryRoots.splice(0)) {
        fs.rmSync(temporaryRoot, { force: true, recursive: true });
    }
});

describe("list-release-dist-files script", () => {
    it("lists release-dist files recursively in stable order", async () => {
        expect.assertions(1);

        const { listReleaseDistFiles } = await importListReleaseDistFiles();
        const releaseDistDirectory = makeTemporaryRoot();

        writeFile(releaseDistDirectory, path.join("windows", "latest.yml"));
        writeFile(releaseDistDirectory, path.join("macos", "latest-mac.yml"));
        writeFile(
            releaseDistDirectory,
            path.join("windows", "nsis-web", "latest.yml")
        );

        expect(
            listReleaseDistFiles(releaseDistDirectory).map((filePath) =>
                path.relative(releaseDistDirectory, filePath)
            )
        ).toStrictEqual([
            path.join("macos", "latest-mac.yml"),
            path.join("windows", "latest.yml"),
            path.join("windows", "nsis-web", "latest.yml"),
        ]);
    });

    it("returns an empty list when release-dist is missing", async () => {
        expect.assertions(1);

        const { listReleaseDistFiles } = await importListReleaseDistFiles();
        const temporaryRoot = makeTemporaryRoot();

        expect(
            listReleaseDistFiles(path.join(temporaryRoot, "missing"))
        ).toStrictEqual([]);
    });

    it("detects duplicate file paths for report compatibility", async () => {
        expect.assertions(1);

        const { findDuplicateFilePaths } = await importListReleaseDistFiles();

        expect(
            findDuplicateFilePaths([
                "release-dist/a.yml",
                "release-dist/b.yml",
                "release-dist/a.yml",
            ])
        ).toStrictEqual(["release-dist/a.yml"]);
    });

    it("renders the same report sections as the workflow debug step", async () => {
        expect.assertions(4);

        const { createReleaseDistFileReport } =
            await importListReleaseDistFiles();
        const releaseDistDirectory = makeTemporaryRoot();

        writeFile(releaseDistDirectory, path.join("windows", "latest.yml"));

        const fileListingText =
            createReleaseDistFileReport(releaseDistDirectory);

        expect(fileListingText).toContain(
            `Listing all files in ${releaseDistDirectory} before deduplication:`
        );
        expect(fileListingText).toContain("windows/latest.yml");
        expect(fileListingText).toContain(
            `Deduplicating files in ${releaseDistDirectory}...`
        );
        expect(fileListingText).toContain(
            `Final file list in ${releaseDistDirectory}:`
        );
    });

    it("parses release-dist directory arguments", async () => {
        expect.assertions(2);

        const { defaultReleaseDistDirectory, parseArgs } =
            await importListReleaseDistFiles();

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

        const { parseArgs } = await importListReleaseDistFiles();

        expect(() => parseArgs(["--release-dist-directory"])).toThrow(
            "--release-dist-directory requires a value"
        );
    });
});
