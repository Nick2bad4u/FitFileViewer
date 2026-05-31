import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

function readPreCommitConfig(): string {
    return readFileSync(
        path.join(process.cwd(), ".pre-commit-config.yaml"),
        "utf8"
    );
}

describe("pre-commit configuration", () => {
    it("uses root-owned npm tooling instead of a separate ESLint mirror", () => {
        expect.assertions(2);

        const config = readPreCommitConfig();

        expect(config).not.toContain("pre-commit/mirrors-eslint");
        expect(config).toEqual(
            expect.stringContaining("entry: node scripts/run-eslint.mjs root")
        );
    });

    it("covers Electron and Docusaurus code through the root ESLint wrapper", () => {
        expect.assertions(1);

        const config = readPreCommitConfig();

        expect({
            docusaurus: config.includes(
                "entry: node scripts/run-eslint.mjs docusaurus"
            ),
            electronApp: config.includes(
                "entry: node scripts/run-eslint.mjs electronApp"
            ),
        }).toStrictEqual({
            docusaurus: true,
            electronApp: true,
        });
    });
});
