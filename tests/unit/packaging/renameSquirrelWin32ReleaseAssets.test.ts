import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

type RenameSquirrelWin32ReleaseAssetsModule = {
    defaultSquirrelWin32Directory: string;
    getWin32NupkgFileName: (fileName: string) => string;
    parseArgs: (args: string[]) => {
        help: boolean;
        squirrelDirectory: string;
    };
    renameSquirrelWin32ReleaseAssets: (
        squirrelDirectory?: string
    ) => { from: string; to: string }[];
};

const temporaryRoots: string[] = [];

async function importRenameSquirrelWin32ReleaseAssets(): Promise<RenameSquirrelWin32ReleaseAssetsModule> {
    return (await import("../../../scripts/rename-squirrel-win32-release-assets.mjs")) as RenameSquirrelWin32ReleaseAssetsModule;
}

function makeTemporaryRoot(): string {
    const temporaryRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), "ffv-rename-squirrel-win32-")
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

describe("rename-squirrel-win32-release-assets script", () => {
    it("derives win32 nupkg file names without double-renaming", async () => {
        expect.assertions(3);

        const { getWin32NupkgFileName } =
            await importRenameSquirrelWin32ReleaseAssets();

        expect(getWin32NupkgFileName("fitfileviewer-30.0.0-full.nupkg")).toBe(
            "fitfileviewer-30.0.0-win32-full.nupkg"
        );
        expect(
            getWin32NupkgFileName("fitfileviewer-30.0.0-win32-full.nupkg")
        ).toBe("");
        expect(getWin32NupkgFileName("Fit-File-Viewer.exe")).toBe("");
    });

    it("renames Squirrel win32 nupkg and RELEASES files", async () => {
        expect.assertions(8);

        const { renameSquirrelWin32ReleaseAssets } =
            await importRenameSquirrelWin32ReleaseAssets();
        const squirrelDirectory = makeTemporaryRoot();

        writeFile(squirrelDirectory, "fitfileviewer-30.0.0-full.nupkg");
        writeFile(squirrelDirectory, "RELEASES");
        writeFile(squirrelDirectory, "debug.log");

        const renamedFiles =
            renameSquirrelWin32ReleaseAssets(squirrelDirectory);

        expect(renamedFiles).toHaveLength(2);
        expect(
            fs.existsSync(
                path.join(squirrelDirectory, "fitfileviewer-30.0.0-full.nupkg")
            )
        ).toBe(false);
        expect(
            fs.existsSync(
                path.join(
                    squirrelDirectory,
                    "fitfileviewer-30.0.0-win32-full.nupkg"
                )
            )
        ).toBe(true);
        expect(fs.existsSync(path.join(squirrelDirectory, "RELEASES"))).toBe(
            false
        );
        expect(
            fs.existsSync(path.join(squirrelDirectory, "RELEASES-win32"))
        ).toBe(true);
        expect(fs.existsSync(path.join(squirrelDirectory, "debug.log"))).toBe(
            true
        );
        expect(renamedFiles[0]?.to).toContain(
            "fitfileviewer-30.0.0-win32-full.nupkg"
        );
        expect(renamedFiles[1]?.to).toContain("RELEASES-win32");
    });

    it("returns an empty result when the Squirrel directory is missing", async () => {
        expect.assertions(1);

        const { renameSquirrelWin32ReleaseAssets } =
            await importRenameSquirrelWin32ReleaseAssets();
        const temporaryRoot = makeTemporaryRoot();

        expect(
            renameSquirrelWin32ReleaseAssets(
                path.join(temporaryRoot, "missing")
            )
        ).toStrictEqual([]);
    });

    it("does not rename already-normalized assets", async () => {
        expect.assertions(3);

        const { renameSquirrelWin32ReleaseAssets } =
            await importRenameSquirrelWin32ReleaseAssets();
        const squirrelDirectory = makeTemporaryRoot();

        writeFile(squirrelDirectory, "fitfileviewer-30.0.0-win32-full.nupkg");
        writeFile(squirrelDirectory, "RELEASES-win32");

        expect(
            renameSquirrelWin32ReleaseAssets(squirrelDirectory)
        ).toStrictEqual([]);
        expect(
            fs.existsSync(
                path.join(
                    squirrelDirectory,
                    "fitfileviewer-30.0.0-win32-full.nupkg"
                )
            )
        ).toBe(true);
        expect(
            fs.existsSync(path.join(squirrelDirectory, "RELEASES-win32"))
        ).toBe(true);
    });

    it("parses the Squirrel directory argument", async () => {
        expect.assertions(2);

        const { defaultSquirrelWin32Directory, parseArgs } =
            await importRenameSquirrelWin32ReleaseAssets();

        expect(parseArgs([])).toStrictEqual({
            help: false,
            squirrelDirectory: defaultSquirrelWin32Directory,
        });
        expect(
            parseArgs(["--squirrel-directory=tmp/squirrel-windows-ia32"])
        ).toStrictEqual({
            help: false,
            squirrelDirectory: "tmp/squirrel-windows-ia32",
        });
    });

    it("rejects missing Squirrel directory values", async () => {
        expect.assertions(1);

        const { parseArgs } = await importRenameSquirrelWin32ReleaseAssets();

        expect(() => parseArgs(["--squirrel-directory"])).toThrow(
            "--squirrel-directory requires a value"
        );
    });
});
