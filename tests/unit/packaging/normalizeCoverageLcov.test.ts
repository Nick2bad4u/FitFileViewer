import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import {
    createCoverageCandidateDirs,
    findSourceDir,
    normalizeCoverage,
} from "../../../scripts/normalize-coverage-lcov.mjs";
import { rootCoverageAbsolutePath } from "../../../scripts/lib/workspaces.mjs";

const temporaryRoots: string[] = [];

function makeTemporaryRoot(): string {
    const temporaryRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), "ffv-normalize-coverage-")
    );
    temporaryRoots.push(temporaryRoot);

    return temporaryRoot;
}

afterEach(() => {
    for (const temporaryRoot of temporaryRoots.splice(0)) {
        fs.rmSync(temporaryRoot, { force: true, recursive: true });
    }
});

describe("normalize-coverage-lcov script", () => {
    it("builds candidate directories from env, temp, and root coverage paths", () => {
        expect.assertions(3);

        const candidates = createCoverageCandidateDirs({
            environmentCoverageDir: "custom-coverage",
            temporaryDirectory: "tmp-root",
            targetDirectory: rootCoverageAbsolutePath,
        });

        expect(candidates[0]).toBe(path.resolve("custom-coverage"));
        expect(candidates[1]).toBe(
            path.join("tmp-root", "ffv-vitest-coverage")
        );
        expect(candidates[2]).toBe(rootCoverageAbsolutePath);
    });

    it("finds the first candidate containing coverage output", () => {
        expect.assertions(2);

        const temporaryRoot = makeTemporaryRoot();
        const emptyCoverageDir = path.join(temporaryRoot, "empty");
        const sourceCoverageDir = path.join(temporaryRoot, "source");

        fs.mkdirSync(emptyCoverageDir, { recursive: true });
        fs.mkdirSync(sourceCoverageDir, { recursive: true });
        fs.writeFileSync(
            path.join(sourceCoverageDir, "coverage-final.json"),
            "{}"
        );

        expect(
            findSourceDir({
                candidateDirectories: [emptyCoverageDir, sourceCoverageDir],
            })
        ).toBe(sourceCoverageDir);
        expect(
            findSourceDir({ candidateDirectories: [emptyCoverageDir] })
        ).toBeNull();
    });

    it("copies lcov output and normalizes source file paths relative to root", () => {
        expect.assertions(2);

        const temporaryRoot = makeTemporaryRoot();
        const repositoryRoot = path.join(temporaryRoot, "repo");
        const sourceCoverageDir = path.join(temporaryRoot, "coverage-source");
        const targetCoverageDir = path.join(repositoryRoot, "coverage");
        const sourceFile = path.join(repositoryRoot, "electron-app", "main.ts");

        fs.mkdirSync(sourceCoverageDir, { recursive: true });
        fs.writeFileSync(
            path.join(sourceCoverageDir, "lcov.info"),
            `TN:\nSF:${sourceFile}\nend_of_record\n`
        );

        normalizeCoverage({
            candidateDirectories: [sourceCoverageDir],
            root: repositoryRoot,
            targetDirectory: targetCoverageDir,
        });

        expect(fs.existsSync(path.join(targetCoverageDir, "lcov.info"))).toBe(
            true
        );
        expect(
            fs.readFileSync(path.join(targetCoverageDir, "lcov.info"), "utf8")
        ).toBe("TN:\nSF:electron-app/main.ts\nend_of_record\n");
    });

    it("logs and skips normalization when no coverage directory exists", () => {
        expect.assertions(2);

        const temporaryRoot = makeTemporaryRoot();
        const targetCoverageDir = path.join(temporaryRoot, "coverage");
        const logger = vi.fn<(message: string) => void>();

        normalizeCoverage({
            candidateDirectories: [],
            logger,
            targetDirectory: targetCoverageDir,
        });

        expect({
            targetCoverageDirectoryExists: fs.existsSync(targetCoverageDir),
        }).toStrictEqual({ targetCoverageDirectoryExists: false });
        expect(logger).toHaveBeenCalledWith(
            "normalize-coverage-lcov: no coverage directory found. Skipping normalization."
        );
    });
});
