import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const electronAppDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(electronAppDir, "..");
const coverageTargetDir = path.join(electronAppDir, "coverage");

const candidateDirs = [];

if (process.env.VITEST_COVERAGE_DIR) {
    candidateDirs.push(path.resolve(process.env.VITEST_COVERAGE_DIR));
}

candidateDirs.push(path.join(os.tmpdir(), "ffv-vitest-coverage"));
candidateDirs.push(coverageTargetDir);

/**
 * Determine the directory that actually contains the generated lcov report.
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
            if ((error)?.code !== "ENOENT") {
                console.warn(`normalize-coverage-lcov: failed to inspect ${dir}:`, error);
            }
        }
    }
    return null;
}

const sourceDir = findSourceDir();

if (!sourceDir) {
    console.warn("normalize-coverage-lcov: no coverage directory found. Skipping normalization.");
    process.exit(0);
}

if (!fs.existsSync(coverageTargetDir)) {
    fs.mkdirSync(coverageTargetDir, { recursive: true });
}

if (path.resolve(sourceDir) !== path.resolve(coverageTargetDir)) {
    fs.cpSync(sourceDir, coverageTargetDir, { recursive: true, force: true });
}

const lcovPath = path.join(coverageTargetDir, "lcov.info");
if (!fs.existsSync(lcovPath)) {
    console.warn(`normalize-coverage-lcov: ${lcovPath} not found. Nothing to normalize.`);
    process.exit(0);
}

const rawLcov = fs.readFileSync(lcovPath, "utf8");
const normalized = rawLcov
    .split(/\r?\n/)
    .map((line) => {
        if (line.startsWith("SF:")) {
            const filePath = line.slice(3).replace(/\\/g, "/");
            const normalizedPath = path.posix.normalize(filePath);
            const resolved = path.posix.join(
                // Ensure the path is relative to the repository root using POSIX separators
                path.posix.relative(
                    repoRoot.replace(/\\/g, "/"),
                    path.resolve(repoRoot, filePath).replace(/\\/g, "/")
                )
            );
            return `SF:${resolved}`;
        }
        return line;
    })
    .join("\n");

fs.writeFileSync(lcovPath, normalized, "utf8");
``
