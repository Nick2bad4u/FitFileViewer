import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const DIRECT_PROCESS_ENV_PATTERN = /\bprocess\.env\b/u;

const SCANNED_SOURCE_ROOTS = [
    "electron-app/preload",
    "electron-app/renderer",
    "electron-app/ui",
    "electron-app/utils",
];

const EXCLUDED_RELATIVE_PATHS = new Set([
    "electron-app/utils/runtime/processEnvironment.ts",
]);

const SOURCE_EXTENSIONS = new Set([".js", ".ts"]);

function collectSourceFiles(relativeDirectory: string): string[] {
    const absoluteDirectory = path.join(process.cwd(), relativeDirectory);
    const entries = readdirSync(absoluteDirectory);
    const sourceFiles: string[] = [];

    for (const entry of entries) {
        const absoluteEntry = path.join(absoluteDirectory, entry);
        const relativeEntry = path
            .relative(process.cwd(), absoluteEntry)
            .replaceAll(path.sep, "/");
        const stat = statSync(absoluteEntry);

        if (stat.isDirectory()) {
            sourceFiles.push(...collectSourceFiles(relativeEntry));
            continue;
        }

        if (!SOURCE_EXTENSIONS.has(path.extname(entry))) {
            continue;
        }
        if (relativeEntry.endsWith(".test.ts")) {
            continue;
        }
        if (EXCLUDED_RELATIVE_PATHS.has(relativeEntry)) {
            continue;
        }

        sourceFiles.push(relativeEntry);
    }

    return sourceFiles;
}

describe("renderer process environment policy", () => {
    it("keeps renderer-adjacent source off direct process.env reads", () => {
        expect.assertions(2);

        const directProcessEnvAccesses = SCANNED_SOURCE_ROOTS.flatMap(
            collectSourceFiles
        )
            .map((relativeFile) => ({
                content: readFileSync(
                    path.join(process.cwd(), relativeFile),
                    "utf8"
                ),
                relativeFile,
            }))
            .filter(({ content }) => DIRECT_PROCESS_ENV_PATTERN.test(content))
            .map(({ relativeFile }) => relativeFile);

        expect(directProcessEnvAccesses).not.toContain(
            "electron-app/utils/runtime/processEnvironment.ts"
        );
        expect(directProcessEnvAccesses).toStrictEqual([]);
    });
});
