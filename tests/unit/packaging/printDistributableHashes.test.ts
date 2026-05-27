import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

type PrintDistributableHashesModule = {
    findDistributableFiles: (rootDirectory: string) => string[];
    formatHashLine: (filePath: string, baseDirectory?: string) => string;
    isDistributableFile: (fileName: string) => boolean;
    parseArgs: (args: string[]) => {
        directory: string | undefined;
        help: boolean;
    };
    printDistributableHashes: (
        rootDirectory: string,
        logger?: (line: string) => void
    ) => string[];
};

const temporaryRoots: string[] = [];

async function importPrintDistributableHashes(): Promise<PrintDistributableHashesModule> {
    return (await import("../../../scripts/print-distributable-hashes.mjs")) as PrintDistributableHashesModule;
}

function makeTemporaryRoot(): string {
    const temporaryRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), "ffv-distributable-hashes-")
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

afterEach(() => {
    for (const temporaryRoot of temporaryRoots.splice(0)) {
        fs.rmSync(temporaryRoot, { force: true, recursive: true });
    }
});

describe("print-distributable-hashes script", () => {
    it("detects distributable file names by release extension", async () => {
        expect.assertions(4);

        const { isDistributableFile } = await importPrintDistributableHashes();

        expect(isDistributableFile("Fit-File-Viewer-30.0.0.exe")).toBe(true);
        expect(isDistributableFile("latest.yml")).toBe(true);
        expect(isDistributableFile("Fit-File-Viewer-30.0.0.tar.xz")).toBe(true);
        expect(isDistributableFile("debug.log")).toBe(false);
    });

    it("finds distributable files recursively in sorted order", async () => {
        expect.assertions(1);

        const { findDistributableFiles } =
            await importPrintDistributableHashes();
        const temporaryRoot = makeTemporaryRoot();
        const zipPath = writeFile(temporaryRoot, "nested/app.zip", "zip");
        const ymlPath = writeFile(temporaryRoot, "latest.yml", "latest");

        writeFile(temporaryRoot, "notes.txt", "ignore");

        expect(findDistributableFiles(temporaryRoot)).toStrictEqual([
            ymlPath,
            zipPath,
        ]);
    });

    it("formats SHA-512 hashes as base64 with relative display paths", async () => {
        expect.assertions(1);

        const { formatHashLine } = await importPrintDistributableHashes();
        const temporaryRoot = makeTemporaryRoot();
        const filePath = writeFile(
            temporaryRoot,
            "release/app.exe",
            "artifact"
        );
        const expectedHash = crypto
            .createHash("sha512")
            .update("artifact")
            .digest("base64");

        expect(formatHashLine(filePath, temporaryRoot)).toBe(
            `release/app.exe: ${expectedHash}`
        );
    });

    it("prints no-file output without failing missing artifact directories", async () => {
        expect.assertions(2);

        const { printDistributableHashes } =
            await importPrintDistributableHashes();
        const output: string[] = [];
        const result = printDistributableHashes("missing-directory", (line) => {
            output.push(line);
        });

        expect(result).toStrictEqual([]);
        expect(output[0]).toContain("No distributable files found");
    });

    it("parses the target directory argument", async () => {
        expect.assertions(1);

        const { parseArgs } = await importPrintDistributableHashes();

        expect(parseArgs(["electron-app/release"])).toStrictEqual({
            directory: "electron-app/release",
            help: false,
        });
    });

    it("requires a target directory unless help is requested", async () => {
        expect.assertions(2);

        const { parseArgs } = await importPrintDistributableHashes();

        expect(() => parseArgs([])).toThrow("directory argument is required");
        expect(parseArgs(["--help"])).toStrictEqual({
            directory: undefined,
            help: true,
        });
    });
});
