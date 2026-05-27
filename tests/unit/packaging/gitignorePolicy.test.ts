import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

function checkIgnore(path: string): boolean {
    const result = spawnSync(
        "git",
        [
            "check-ignore",
            "-q",
            "--",
            path,
        ],
        {
            cwd: process.cwd(),
        }
    );

    return result.status === 0;
}

describe("gitignore policy", () => {
    it("keeps root script helpers trackable while ignoring generated release output", () => {
        expect.assertions(4);

        expect(checkIgnore("scripts/lib/new-helper.mjs")).not.toBe(true);
        expect(checkIgnore("artifacts/file")).toBe(true);
        expect(checkIgnore("release-dist/file")).toBe(true);
        expect(checkIgnore("html/index.html")).toBe(true);
    });
});
