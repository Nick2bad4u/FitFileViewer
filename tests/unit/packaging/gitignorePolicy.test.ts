import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

type GitIgnoreResult = {
    status: number | null;
    stderr: string;
    stdout: string;
};

function checkIgnore(path: string, mode: "-q" | "-v"): GitIgnoreResult {
    const result = spawnSync(
        "git",
        [
            "check-ignore",
            mode,
            "--",
            path,
        ],
        {
            cwd: process.cwd(),
            encoding: "utf8",
        }
    );

    return {
        status: result.status,
        stderr: result.stderr,
        stdout: result.stdout,
    };
}

describe("gitignore policy", () => {
    it("keeps root script helpers trackable while ignoring generated release output", () => {
        expect.assertions(8);

        const scriptHelperIgnoreStatus = checkIgnore(
            "scripts/lib/new-helper.mjs",
            "-q"
        );
        const scriptHelperTrace = checkIgnore(
            "scripts/lib/new-helper.mjs",
            "-v"
        );
        const artifactTrace = checkIgnore("artifacts/file", "-v");
        const releaseTrace = checkIgnore("release-dist/file", "-v");
        const htmlTrace = checkIgnore("html/index.html", "-v");

        expect(scriptHelperIgnoreStatus).toMatchObject({
            status: 1,
            stderr: "",
            stdout: "",
        });
        expect(scriptHelperTrace.stdout).toMatch(
            /\.gitignore:\d+:!scripts\/lib\/\*\*\s+scripts\/lib\/new-helper\.mjs/u
        );
        expect({
            stderr: artifactTrace.stderr,
            status: artifactTrace.status,
        }).toStrictEqual({ stderr: "", status: 0 });
        expect(artifactTrace.stdout).toMatch(
            /\.gitignore:\d+:artifacts\/\s+artifacts\/file/u
        );
        expect({
            stderr: releaseTrace.stderr,
            status: releaseTrace.status,
        }).toStrictEqual({ stderr: "", status: 0 });
        expect(releaseTrace.stdout).toMatch(
            /\.gitignore:\d+:release-dist\/\s+release-dist\/file/u
        );
        expect({
            stderr: htmlTrace.stderr,
            status: htmlTrace.status,
        }).toStrictEqual({ stderr: "", status: 0 });
        expect(htmlTrace.stdout).toMatch(
            /\.gitignore:\d+:html\/\s+html\/index\.html/u
        );
    });
});
