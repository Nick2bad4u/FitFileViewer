import { readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
    appSourcePath,
    rootReleaseDistPath,
} from "../../../scripts/lib/workspaces.mjs";

const repositoryRoot = process.cwd();
const electronAppRoot = appSourcePath;

type ElectronBuilderConfig = {
    directories: {
        output: string;
    };
    files: string[];
};

async function loadBuilderConfig(): Promise<ElectronBuilderConfig> {
    const imported = (await import("../../../electron-builder.config.cjs")) as {
        default: ElectronBuilderConfig;
    };

    return imported.default;
}

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
    it("keeps the normal package surface aligned to the root builder config", async () => {
        expect.assertions(1);

        const builderConfig = await loadBuilderConfig();
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
