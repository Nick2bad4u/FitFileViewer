import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";
import JSZip from "jszip";

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

    it("rejects symlink targets outside the extraction directory", async () => {
        expect.assertions(2);

        const temporaryDirectory = await mkdtemp(
            join(tmpdir(), "ffv-electron-zip-")
        );
        const archivePath = join(temporaryDirectory, "electron.zip");
        const destination = join(temporaryDirectory, "dist");
        const outsidePath = join(temporaryDirectory, "outside.txt");
        const archive = new JSZip();
        archive.file("unsafe-link", "../outside.txt", {
            unixPermissions: 0o120777,
        });
        temporaryDirectories.push(temporaryDirectory);

        await writeFile(
            archivePath,
            await archive.generateAsync({
                platform: "UNIX",
                type: "nodebuffer",
            })
        );

        await expect(
            extractZipArchive(archivePath, destination)
        ).rejects.toThrow("unsafe-link");
        await expect(access(outsidePath)).rejects.toThrow(/ENOENT/u);
    });
});
