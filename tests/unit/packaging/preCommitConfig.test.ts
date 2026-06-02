import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { rootPreCommitConfigPath } from "../../../scripts/lib/workspaces.mjs";

const requiredRootEslintHookEntries = [
    "id: root-eslint",
    "entry: node scripts/run-eslint.mjs root",
    "id: app-eslint",
    "entry: node scripts/run-eslint.mjs app",
    "id: docusaurus-eslint",
    "entry: node scripts/run-eslint.mjs docusaurus",
] as const;

const disallowedSeparateToolRepos = [
    "pre-commit/mirrors-eslint",
    "pre-commit/mirrors-prettier",
    "pre-commit/mirrors-stylelint",
] as const;

function readPreCommitConfig(): string {
    return readFileSync(
        path.join(process.cwd(), rootPreCommitConfigPath),
        "utf8"
    );
}

describe("pre-commit configuration", () => {
    it("uses root-owned npm tooling instead of a separate ESLint mirror", () => {
        expect.assertions(4);

        const config = readPreCommitConfig();

        expect(config).not.toContain("pre-commit/mirrors-eslint");
        expect(
            disallowedSeparateToolRepos.filter((repo) => config.includes(repo))
        ).toStrictEqual([]);
        expect(
            requiredRootEslintHookEntries.filter(
                (entry) => !config.includes(entry)
            )
        ).toStrictEqual([]);
        expect(config.match(/language: system/gu)).toHaveLength(3);
    });

    it("covers Electron and Docusaurus code through the root ESLint wrapper", () => {
        expect.assertions(2);

        const config = readPreCommitConfig();
        const requiredRootEntries = [
            "entry: node scripts/run-eslint.mjs docusaurus",
            "entry: node scripts/run-eslint.mjs app",
        ];

        expect(
            requiredRootEntries.filter((entry) => !config.includes(entry))
        ).toStrictEqual([]);
        expect(config.match(/pass_filenames: false/gu)).toHaveLength(3);
    });
});
