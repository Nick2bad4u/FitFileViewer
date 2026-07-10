import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { extractZipArchive } from "../../../scripts/ensure-electron-binary.mjs";

describe("ensure Electron binary", () => {
    const temporaryDirectories: string[] = [];

    afterEach(async () => {
        await Promise.all(
            temporaryDirectories
                .splice(0)
                .map(async (directory) =>
                    rm(directory, { force: true, recursive: true })
                )
        );
    });

    it("extracts Windows archive paths without passing them through tar", async () => {
        expect.assertions(1);

        const extract = vi.fn(async () => undefined);

        await extractZipArchive(
            String.raw`C:\npm\cache\electron-v42.3.3-win32-x64.zip`,
            String.raw`D:\a\FitFileViewer\node_modules\electron\dist`,
            extract
        );

        expect(extract).toHaveBeenCalledExactlyOnceWith(
            String.raw`C:\npm\cache\electron-v42.3.3-win32-x64.zip`,
            { dir: String.raw`D:\a\FitFileViewer\node_modules\electron\dist` }
        );
    });

    it("settles after extracting a real ZIP archive", async () => {
        expect.assertions(1);

        const temporaryDirectory = await mkdtemp(
            join(tmpdir(), "ffv-electron-zip-")
        );
        const archivePath = join(temporaryDirectory, "electron.zip");
        const destination = join(temporaryDirectory, "dist");
        temporaryDirectories.push(temporaryDirectory);

        await writeFile(
            archivePath,
            Buffer.from(
                "UEsDBBQAAAAIAAuN6lwA5N8nCAAAAAYAAAAHAAAAdmVyc2lvbjMx0jPWMwYAUEsBAhQAFAAAAAgAC43qXADk3ycIAAAABgAAAAcAAAAAAAAAAAAAAAAAAAAAAHZlcnNpb25QSwUGAAAAAAEAAQA1AAAALQAAAAAA",
                "base64"
            )
        );

        await extractZipArchive(archivePath, destination);

        await expect(
            readFile(join(destination, "version"), "utf8")
        ).resolves.toBe("42.3.3");
    });
});
