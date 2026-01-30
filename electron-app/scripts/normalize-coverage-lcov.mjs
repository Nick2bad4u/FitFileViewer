import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const electronAppDir = fileURLToPath(new URL("..", import.meta.url));
const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const repoRootPosix = repoRoot.replaceAll("\\", "/");
const coverageTargetDir = path.join(electronAppDir, "coverage");

const candidateDirs = [
    process.env.VITEST_COVERAGE_DIR
        ? path.resolve(process.env.VITEST_COVERAGE_DIR)
        : null,
    path.join(os.tmpdir(), "ffv-vitest-coverage"),
    coverageTargetDir,
].filter(Boolean);

/**
 * Determine the directory that actually contains the generated lcov report.
 *
 * @returns {string | null}
 */
function findSourceDir() {
    for (const dir of candidateDirs) {
        if (!dir) continue;
        try {
            const stats = fs.statSync(dir, { throwIfNoEntry: false });
            if (!stats || !stats.isDirectory()) {
                continue;
            }
            const lcovPath = path.join(dir, "lcov.info");
            const coverageJsonPath = path.join(dir, "coverage-final.json");
            if (fs.existsSync(lcovPath) || fs.existsSync(coverageJsonPath)) {
                return dir;
            }
        } catch (error) {
            if (error?.code !== "ENOENT") {
                console.warn(
                    `normalize-coverage-lcov: failed to inspect ${dir}:`,
                    error
                );
            }
        }
    }
    return null;
}

function normalizeCoverage() {
    const sourceDir = findSourceDir();

    if (!sourceDir) {
        console.warn(
            "normalize-coverage-lcov: no coverage directory found. Skipping normalization."
        );
        return;
    }

    if (!fs.existsSync(coverageTargetDir)) {
        fs.mkdirSync(coverageTargetDir, { recursive: true });
    }

    if (path.resolve(sourceDir) !== path.resolve(coverageTargetDir)) {
        fs.cpSync(sourceDir, coverageTargetDir, {
            recursive: true,
            force: true,
        });
    }

    const lcovPath = path.join(coverageTargetDir, "lcov.info");
    if (!fs.existsSync(lcovPath)) {
        console.warn(
            `normalize-coverage-lcov: ${lcovPath} not found. Nothing to normalize.`
        );
        return;
    }

    const rawLcov = fs.readFileSync(lcovPath, "utf8");
    const normalized = rawLcov
        .split(/\r?\n/)
        .map((line) => {
            if (!line.startsWith("SF:")) {
                return line;
            }

            const filePath = line.slice(3).replaceAll("\\", "/");
            const absolutePosixPath = path
                .resolve(repoRoot, filePath)
                .replaceAll("\\", "/");
            const relativePath = path.posix.relative(
                repoRootPosix,
                absolutePosixPath
            );
            const normalizedPosixPath = path.posix.normalize(relativePath);

            return `SF:${normalizedPosixPath}`;
        })
        .join("\n");

    fs.writeFileSync(lcovPath, normalized, "utf8");
}

try {
    normalizeCoverage();
} catch (error) {
    console.error(
        "normalize-coverage-lcov: failed to normalize coverage report",
        error
    );
    process.exitCode = 1;
}
``;
