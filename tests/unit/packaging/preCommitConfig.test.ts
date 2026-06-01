import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { rootPreCommitConfigPath } from "../../../scripts/lib/workspaces.mjs";

function readPreCommitConfig(): string {
    return readFileSync(
        path.join(process.cwd(), rootPreCommitConfigPath),
        "utf8"
    );
}

describe("pre-commit configuration", () => {
    it("uses root-owned npm tooling instead of a separate ESLint mirror", () => {
        expect.assertions(2);

        const config = readPreCommitConfig();
        const requiredRootEntries = ["entry: node scripts/run-eslint.mjs root"];

        expect(config).not.toContain("pre-commit/mirrors-eslint");
        expect(
            requiredRootEntries.filter((entry) => !config.includes(entry))
        ).toStrictEqual([]);
    });

    it("covers Electron and Docusaurus code through the root ESLint wrapper", () => {
        expect.assertions(1);

        const config = readPreCommitConfig();
        const requiredRootEntries = [
            "entry: node scripts/run-eslint.mjs docusaurus",
            "entry: node scripts/run-eslint.mjs electronApp",
        ];

        expect(
            requiredRootEntries.filter((entry) => !config.includes(entry))
        ).toStrictEqual([]);
    });
});
