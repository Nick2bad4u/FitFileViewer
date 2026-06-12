import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
    appSourcePath,
    repositoryPath,
    rootElectronBuilderConfigPath,
    rootReleaseDistPath,
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
    it("keeps the normal package surface aligned to the root builder config", () => {
        expect.assertions(1);

        const builderConfig = requireFromTest(
            repositoryPath(rootElectronBuilderConfigPath)
        ) as ElectronBuilderConfig;
        const sharedFileList = builderConfig.files;

        expect({
            forbiddenNestedAppPackageFiles: sharedFileList.filter(
                (filePattern) => filePattern.startsWith("electron-app/")
            ),
            normalBuilderFiles: sharedFileList,
            normalBuilderOutput: builderConfig.directories.output,
        }).toStrictEqual({
            forbiddenNestedAppPackageFiles: [],
            normalBuilderFiles: ["dist/**", "package.json"],
            normalBuilderOutput: rootReleaseDistPath,
        });
    });

    it("keeps app package markdown out of the app source directory", () => {
        expect.assertions(1);

        expect(findMarkdownFiles(electronAppRoot)).toStrictEqual([]);
    });
});
