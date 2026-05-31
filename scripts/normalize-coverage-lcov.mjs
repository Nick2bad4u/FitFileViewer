import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
    appCoverageAbsolutePath,
    rootCoverageAbsolutePath,
    repositoryRoot,
} from "./lib/workspaces.mjs";

export const coverageTargetDir = rootCoverageAbsolutePath;
export const legacyAppCoverageDir = appCoverageAbsolutePath;

export function createCoverageCandidateDirs({
    environmentCoverageDir = process.env.VITEST_COVERAGE_DIR,
    legacyDirectory = legacyAppCoverageDir,
    temporaryDirectory = os.tmpdir(),
    targetDirectory = coverageTargetDir,
} = {}) {
    return [
        environmentCoverageDir ? path.resolve(environmentCoverageDir) : null,
        path.join(temporaryDirectory, "ffv-vitest-coverage"),
        targetDirectory,
        legacyDirectory,
    ].filter(Boolean);
}

/**
 * Determine the directory that actually contains the generated lcov report.
 *
 * @returns {string | null}
 */
export function findSourceDir({
    candidateDirectories = createCoverageCandidateDirs(),
    fileSystem = fs,
    logger = console.warn,
} = {}) {
    for (const dir of candidateDirectories) {
        if (!dir) continue;
        try {
            const stats = fileSystem.statSync(dir, { throwIfNoEntry: false });
            if (!stats || !stats.isDirectory()) {
                continue;
            }
            const lcovPath = path.join(dir, "lcov.info");
            const coverageJsonPath = path.join(dir, "coverage-final.json");
            if (
                fileSystem.existsSync(lcovPath) ||
                fileSystem.existsSync(coverageJsonPath)
            ) {
                return dir;
            }
        } catch (error) {
            if (error?.code !== "ENOENT") {
                logger(
                    `normalize-coverage-lcov: failed to inspect ${dir}:`,
                    error
                );
            }
        }
    }
    return null;
}

export function normalizeCoverage({
    candidateDirectories = createCoverageCandidateDirs(),
    fileSystem = fs,
    logger = console.warn,
    root = repositoryRoot,
    targetDirectory = coverageTargetDir,
} = {}) {
    const sourceDir = findSourceDir({
        candidateDirectories,
        fileSystem,
        logger,
    });

    if (!sourceDir) {
        logger(
            "normalize-coverage-lcov: no coverage directory found. Skipping normalization."
        );
        return;
    }

    if (!fileSystem.existsSync(targetDirectory)) {
        fileSystem.mkdirSync(targetDirectory, { recursive: true });
    }

    if (path.resolve(sourceDir) !== path.resolve(targetDirectory)) {
        fileSystem.cpSync(sourceDir, targetDirectory, {
            recursive: true,
            force: true,
        });
    }

    const lcovPath = path.join(targetDirectory, "lcov.info");
    if (!fileSystem.existsSync(lcovPath)) {
        logger(
            `normalize-coverage-lcov: ${lcovPath} not found. Nothing to normalize.`
        );
        return;
    }

    const rootPosix = root.replaceAll("\\", "/");
    const rawLcov = fileSystem.readFileSync(lcovPath, "utf8");
    const normalized = rawLcov
        .split(/\r?\n/)
        .map((line) => {
            if (!line.startsWith("SF:")) {
                return line;
            }

            const filePath = line.slice(3).replaceAll("\\", "/");
            const absolutePosixPath = path
                .resolve(root, filePath)
                .replaceAll("\\", "/");
            const relativePath = path.posix.relative(
                rootPosix,
                absolutePosixPath
            );
            const normalizedPosixPath = path.posix.normalize(relativePath);

            return `SF:${normalizedPosixPath}`;
        })
        .join("\n");

    fileSystem.writeFileSync(lcovPath, normalized, "utf8");
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    try {
        normalizeCoverage();
    } catch (error) {
        console.error(
            "normalize-coverage-lcov: failed to normalize coverage report",
            error
        );
        process.exitCode = 1;
    }
}
