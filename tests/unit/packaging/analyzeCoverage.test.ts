import path from "node:path";

import { describe, expect, it } from "vitest";

import {
    analyzeCoverage,
    createCoverageCandidatePaths,
    findCoveragePath,
    parseCoverageData,
} from "../../../scripts/analyze-coverage.mjs";
import {
    repositoryRoot,
    rootCoverageAbsolutePath,
} from "../../../scripts/lib/workspaces.mjs";

describe("analyze-coverage script", () => {
    it("builds coverage file candidates from root-owned workspace paths", () => {
        expect.assertions(1);

        const candidates = createCoverageCandidatePaths({
            environmentCoverageDirectory: "custom-coverage",
            temporaryDirectory: "tmp-root",
        });

        expect(candidates).toStrictEqual([
            path.join("custom-coverage", "coverage-final.json"),
            path.join("tmp-root", "ffv-vitest-coverage", "coverage-final.json"),
            path.join(rootCoverageAbsolutePath, "coverage-final.json"),
        ]);
    });

    it("returns the first existing coverage file candidate", async () => {
        expect.assertions(2);

        const missingCoveragePath = path.join(
            rootCoverageAbsolutePath,
            "missing-coverage-final.json"
        );
        const existingCoveragePath = path.join(
            rootCoverageAbsolutePath,
            "coverage-final.json"
        );
        const checkedCandidatePaths: string[] = [];

        await expect(
            findCoveragePath({
                candidatePaths: [missingCoveragePath, existingCoveragePath],
                pathExistsFunction: async (candidatePath) => {
                    checkedCandidatePaths.push(candidatePath);
                    return candidatePath === existingCoveragePath;
                },
            })
        ).resolves.toBe(existingCoveragePath);
        expect(checkedCandidatePaths).toStrictEqual([
            missingCoveragePath,
            existingCoveragePath,
        ]);
    });

    it("throws a clear error when coverage output is missing", async () => {
        expect.assertions(2);

        const candidatePaths = createCoverageCandidatePaths({
            environmentCoverageDirectory: "custom-coverage",
            rootCoverageDirectory: "root-coverage",
            temporaryDirectory: "tmp-root",
        });
        const checkedCandidatePaths: string[] = [];

        await expect(
            findCoveragePath({
                candidatePaths,
                pathExistsFunction: async (candidatePath) => {
                    checkedCandidatePaths.push(candidatePath);
                    return false;
                },
            })
        ).rejects.toThrow(
            "coverage-final.json not found. Checked VITEST_COVERAGE_DIR, OS temp ffv-vitest-coverage, and root coverage."
        );
        expect(checkedCandidatePaths).toStrictEqual(candidatePaths);
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
