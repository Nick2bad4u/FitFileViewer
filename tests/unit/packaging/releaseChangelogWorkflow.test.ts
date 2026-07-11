import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("release changelog workflow", () => {
    it("uses the maintained release job instead of a duplicate workflow", () => {
        expect.assertions(6);

        const workflow = fs.readFileSync(
            path.join(process.cwd(), ".github/workflows/Build.yml"),
            "utf8"
        );

        expect(workflow).toContain("name: Update Changelogs");
        expect(workflow).toContain("node-version-file: .node-version");
        expect(workflow).not.toContain('node-version: "20"');
        expect(workflow).toContain(
            "npm ci --ignore-scripts --no-audit --no-fund"
        );
        expect(workflow).toContain("run: npm run changelog:workflow");
        expect(
            fs.existsSync(
                path.join(
                    process.cwd(),
                    ".github/workflows/updateChangeLogs.yml"
                )
            )
        ).toBe(false);
    });
});
