import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { describe, expect, it } from "vitest";

const requireFromTest = createRequire(import.meta.url);
const repositoryRoot = process.cwd();
const sharedFileListPath = path.join(
    repositoryRoot,
    "electron-builder.files.json"
);

type ElectronBuilderConfig = {
    files: string[];
};

type Win7BuildModule = {
    appPackageFiles: string[];
    parseElectronBuilderFiles: (parsed: unknown) => string[];
    readElectronBuilderFiles: () => string[];
};

function readSharedFileList(): string[] {
    return JSON.parse(readFileSync(sharedFileListPath, "utf8")) as string[];
}

describe("electron-builder file list", () => {
    it("keeps normal and Win7 package surfaces aligned to the root file list", async () => {
        expect.assertions(4);

        const sharedFileList = readSharedFileList();
        const builderConfig = requireFromTest(
            "../../../../electron-builder.config.cjs"
        ) as ElectronBuilderConfig;
        const win7Build =
            (await import("../../../../scripts/build-win7.mjs")) as Win7BuildModule;

        expect(sharedFileList).toStrictEqual([
            "dist/**",
            "elevProfile.css",
            "icons/**",
            "index.html",
            "package.json",
            "style.css",
        ]);
        expect(builderConfig.files).toStrictEqual(sharedFileList);
        expect(win7Build.readElectronBuilderFiles()).toStrictEqual(
            sharedFileList
        );
        expect(win7Build.appPackageFiles).toStrictEqual(sharedFileList);
    });

    it("rejects invalid package file lists", async () => {
        expect.assertions(1);

        const win7Build =
            (await import("../../../../scripts/build-win7.mjs")) as Win7BuildModule;

        expect(() => {
            win7Build.parseElectronBuilderFiles(["dist/**", 42]);
        }).toThrow(
            "electron-builder.files.json must contain an array of file pattern strings"
        );
    });
});
