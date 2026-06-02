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

function escapeRegExp(value: string): string {
    return value.replaceAll(/[.*+?^${}()|[\]\\]/gu, String.raw`\$&`);
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
    it("keeps root script helpers trackable", () => {
        expect.assertions(3);

        const scriptHelperIgnoreStatus = checkIgnore(
            "scripts/lib/new-helper.mjs",
            "-q"
        );
        const scriptHelperTrace = checkIgnore(
            "scripts/lib/new-helper.mjs",
            "-v"
        );

        expect(scriptHelperIgnoreStatus).toStrictEqual({
            status: 1,
            stderr: "",
            stdout: "",
        });
        expect(scriptHelperIgnoreStatus.status).not.toBe(0);
        expect(scriptHelperTrace.stdout).toMatch(
            /\.gitignore:\d+:!scripts\/lib\/\*\*\s+scripts\/lib\/new-helper\.mjs/u
        );
    });

    it("keeps root-specific generated outputs ignored by git", () => {
        expect.assertions(1);

        const generatedOutputIgnores = [
            ["artifacts/", "artifacts/file"],
            ["flatpak-build-dir/", "flatpak-build-dir/file"],
            ["flatpak-repo/", "flatpak-repo/file"],
            ["FitFileViewer*.flatpak", "FitFileViewer.flatpak"],
            ["FitFileViewer*.flatpak.zip", "FitFileViewer.flatpak.zip"],
            ["html/", "html/index.html"],
            ["playwright-report/", "playwright-report/index.html"],
            ["release-dist/", "release-dist/file"],
            ["temp/", "temp/file"],
            ["test-results/", "test-results/results.json"],
            ["types/", "types/main.d.ts"],
        ] as const;

        const generatedOutputTraceResults = generatedOutputIgnores.map(
            ([pattern, probePath]) => {
                const trace = checkIgnore(probePath, "-v");
                const gitignoreTracePattern = new RegExp(
                    String.raw`\.gitignore:\d+:${escapeRegExp(pattern)}\s+${escapeRegExp(probePath)}`,
                    "u"
                );

                return {
                    matchesExpectedPattern: gitignoreTracePattern.test(
                        trace.stdout
                    ),
                    probePath,
                    status: trace.status,
                    stderr: trace.stderr,
                };
            }
        );

        expect(generatedOutputTraceResults).toStrictEqual(
            generatedOutputIgnores.map(([, probePath]) => ({
                matchesExpectedPattern: true,
                probePath,
                status: 0,
                stderr: "",
            }))
        );
    });

    it("keeps cleanup targets ignored by git", () => {
        expect.assertions(2);

        const cleanupTargetProbeResults = cleanupTargets.map((target) => {
            const probePath = createCleanupProbePath(target);
            const ignoreResult = checkIgnore(probePath, "-q");

            return {
                ignoreResult,
                probePath,
                target,
            };
        });
        const gitIgnoreErrors = cleanupTargetProbeResults
            .filter(({ ignoreResult }) => ignoreResult.stderr !== "")
            .map(
                ({ ignoreResult, probePath, target }) =>
                    `${target} -> ${probePath}: ${ignoreResult.stderr.trim()}`
            );
        const unignoredCleanupTargets = cleanupTargetProbeResults
            .filter(({ ignoreResult }) => ignoreResult.status !== 0)
            .map(({ probePath, target }) => `${target} -> ${probePath}`);

        expect(gitIgnoreErrors).toStrictEqual([]);
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
