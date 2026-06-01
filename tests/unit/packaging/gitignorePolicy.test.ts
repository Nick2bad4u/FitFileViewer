import { spawnSync } from "node:child_process";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { cleanupTargets } from "../../../scripts/clean-workspace.mjs";

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

function createCleanupProbePath(target: string): string {
    const normalizedTarget = target.replaceAll(path.sep, "/");
    const basename = path.posix.basename(normalizedTarget);
    const fileLikeTarget =
        path.posix.extname(normalizedTarget) !== "" &&
        !basename.startsWith(".");

    return fileLikeTarget
        ? normalizedTarget
        : path.posix.join(normalizedTarget, ".ffv-clean-probe");
}

describe("gitignore policy", () => {
    it("keeps root script helpers trackable while ignoring generated release output", () => {
        expect.assertions(9);

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

        expect(scriptHelperIgnoreStatus).toStrictEqual({
            status: 1,
            stderr: "",
            stdout: "",
        });
        expect(scriptHelperIgnoreStatus.status).not.toBe(0);
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

    it("keeps cleanup targets ignored by git", () => {
        expect.assertions(1);

        const unignoredCleanupTargets = cleanupTargets
            .map((target) => ({
                probePath: createCleanupProbePath(target),
                target,
            }))
            .filter(
                ({ probePath }) => checkIgnore(probePath, "-q").status !== 0
            )
            .map(({ probePath, target }) => `${target} -> ${probePath}`);

        expect(unignoredCleanupTargets).toStrictEqual([]);
    });

    it("keeps local-only editor and AI helper files ignored", () => {
        expect.assertions(3);

        const copilotTrace = checkIgnore(
            ".github/copilot-instructions.md",
            "-v"
        );
        const codacyTrace = checkIgnore(".codacy/cli.sh", "-v");
        const mcpTrace = checkIgnore(".vscode/mcp.json", "-v");

        expect(copilotTrace.stdout).toMatch(
            /\.gitignore:\d+:\.github\/copilot-instructions\.md\s+\.github\/copilot-instructions\.md/u
        );
        expect(codacyTrace.stdout).toMatch(
            /\.gitignore:\d+:\.codacy\/cli\.sh\s+\.codacy\/cli\.sh/u
        );
        expect(mcpTrace.stdout).toMatch(
            /\.gitignore:\d+:\.vscode\/\*\s+\.vscode\/mcp\.json/u
        );
    });
});
