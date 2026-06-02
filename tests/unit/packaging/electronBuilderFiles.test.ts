import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
    appSourcePath,
    repositoryPath,
    rootElectronBuilderConfigPath,
    rootReleaseDistPath,
    rootWin7ReleaseDistPath,
} from "../../../scripts/lib/workspaces.mjs";

const requireFromTest = createRequire(import.meta.url);
const repositoryRoot = process.cwd();
const electronAppRoot = appSourcePath;

type ElectronBuilderConfig = {
    directories: {
        output: string;
    };
    files: string[];
};

type Win7BuildModule = {
    outputDir: string;
    parseElectronBuilderFiles: (parsed: unknown) => string[];
    readElectronBuilderFiles: () => string[];
    rootPackageFiles: string[];
};

function findMarkdownFiles(directory: string): string[] {
    const entries = readdirSync(directory, { withFileTypes: true });
    const markdownFiles: string[] = [];

    for (const entry of entries) {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === "dist" || entry.name === "node_modules") {
                continue;
            }
            markdownFiles.push(...findMarkdownFiles(entryPath));
            continue;
        }

        if (entry.isFile() && path.extname(entry.name) === ".md") {
            markdownFiles.push(
                path.relative(repositoryRoot, entryPath).replaceAll("\\", "/")
            );
        }
    }

    return markdownFiles.sort();
}

describe("electron-builder file list", () => {
    it("keeps normal and Win7 package surfaces aligned to the root builder config", async () => {
        expect.assertions(1);

        const builderConfig = requireFromTest(
            repositoryPath(rootElectronBuilderConfigPath)
        ) as ElectronBuilderConfig;
        const win7Build =
            (await import("../../../scripts/build-win7.mjs")) as Win7BuildModule;
        const sharedFileList = builderConfig.files;

        expect({
            forbiddenNestedAppPackageFiles: sharedFileList.filter(
                (filePattern) => filePattern.startsWith("electron-app/")
            ),
            normalBuilderFiles: sharedFileList,
            normalBuilderOutput: builderConfig.directories.output,
            win7Output: win7Build.outputDir,
            win7ReadBuilderFiles: win7Build.readElectronBuilderFiles(),
            win7RootPackageFiles: win7Build.rootPackageFiles,
        }).toStrictEqual({
            forbiddenNestedAppPackageFiles: [],
            normalBuilderFiles: ["dist/**", "package.json"],
            normalBuilderOutput: rootReleaseDistPath,
            win7Output: rootWin7ReleaseDistPath,
            win7ReadBuilderFiles: ["dist/**", "package.json"],
            win7RootPackageFiles: ["dist/**", "package.json"],
        });
    });

    it("rejects invalid package file lists", async () => {
        expect.assertions(1);

        const win7Build =
            (await import("../../../scripts/build-win7.mjs")) as Win7BuildModule;

        expect(() => {
            win7Build.parseElectronBuilderFiles(["dist/**", 42]);
        }).toThrow(
            "electron-builder config files must be an array of file pattern strings"
        );
    });

    it("keeps app package markdown out of the app source directory", () => {
        expect.assertions(1);

        expect(findMarkdownFiles(electronAppRoot)).toStrictEqual([]);
    });
});
