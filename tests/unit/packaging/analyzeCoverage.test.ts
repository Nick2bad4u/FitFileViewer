import path from "node:path";

import { describe, expect, it } from "vitest";

import {
    analyzeCoverage,
    createCoverageCandidatePaths,
    findCoveragePath,
    parseCoverageData,
} from "../../../scripts/analyze-coverage.mjs";
import {
    appSourceAbsolutePath,
    repositoryPath,
    repositoryRoot,
} from "../../../scripts/lib/workspaces.mjs";

describe("analyze-coverage script", () => {
    it("builds coverage file candidates from root-owned workspace paths", () => {
        expect.assertions(4);

        const candidates = createCoverageCandidatePaths({
            environmentCoverageDirectory: "custom-coverage",
            temporaryDirectory: "tmp-root",
        });

        expect(candidates[0]).toBe(
            path.join("custom-coverage", "coverage-final.json")
        );
        expect(candidates[1]).toBe(
            path.join("tmp-root", "ffv-vitest-coverage", "coverage-final.json")
        );
        expect(candidates[2]).toBe(
            repositoryPath("coverage", "coverage-final.json")
        );
        expect(candidates[3]).toBe(
            appSourceAbsolutePath("coverage", "coverage-final.json")
        );
    });

    it("returns the first existing coverage file candidate", async () => {
        expect.assertions(1);

        const missingCoveragePath = repositoryPath(
            "coverage",
            "missing-coverage-final.json"
        );
        const existingCoveragePath = appSourceAbsolutePath(
            "coverage",
            "coverage-final.json"
        );

        await expect(
            findCoveragePath({
                candidatePaths: [missingCoveragePath, existingCoveragePath],
                pathExistsFunction: async (candidatePath) =>
                    candidatePath === existingCoveragePath,
            })
        ).resolves.toBe(existingCoveragePath);
    });

    it("throws a clear error when coverage output is missing", async () => {
        expect.assertions(1);

        await expect(
            findCoveragePath({
                candidatePaths: [],
                pathExistsFunction: async () => false,
            })
        ).rejects.toThrow(
            "coverage-final.json not found. Checked VITEST_COVERAGE_DIR, OS temp ffv-vitest-coverage, root coverage, and electron-app/coverage."
        );
    });

    it("derives line coverage from statement maps when lcov line counts are absent", () => {
        expect.assertions(1);

        const coveredSource = path.join(
            repositoryRoot,
            "electron-app",
            "main.ts"
        );
        const coverageData = parseCoverageData({
            [coveredSource]: {
                b: {
                    0: [0, 1],
                    1: [0, 0],
                },
                f: {
                    0: 1,
                    1: 0,
                },
                s: {
                    0: 1,
                    1: 0,
                },
                statementMap: {
                    0: {
                        end: { line: 11 },
                        start: { line: 10 },
                    },
                    1: {
                        start: { line: 12 },
                    },
                },
            },
        });

        expect(analyzeCoverage(coverageData, repositoryRoot)).toStrictEqual([
            {
                branches: {
                    covered: 1,
                    percentage: 50,
                    total: 2,
                },
                file: path.join("electron-app", "main.ts"),
                functions: {
                    covered: 1,
                    percentage: 50,
                    total: 2,
                },
                lines: {
                    covered: 2,
                    percentage: 66.66666666666666,
                    total: 3,
                },
                statements: {
                    covered: 1,
                    percentage: 50,
                    total: 2,
                },
            },
        ]);
    });
});
