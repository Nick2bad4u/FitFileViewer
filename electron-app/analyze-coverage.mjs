/**
 * Analyzes code coverage statistics from a coverage-final.json file.
 *
 * @remarks
 * This script reads the Istanbul coverage-final.json file from the coverage
 * directory, analyzes statement, function, and branch coverage for each file,
 * and prints a summary of files with the lowest coverage. It is intended to
 * help developers identify files that need more tests.
 *
 * @example Run this script from the project root using Node.js:
 *
 * ```bash
 * node scripts/analyze-coverage.mjs
 * ```
 *
 * @param input - Coverage/coverage-final.json: Istanbul JSON coverage report.
 *
 * @returns Console output listing files with low function and branch coverage,
 *   and a summary.
 */

import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
// Small ANSI color helpers (avoid extra deps)
const colors = {
    reset: (/** @type {any} */ s) => `\u001B[0m${s}\u001B[0m`,
    bold: (/** @type {any} */ s) => `\u001B[1m${s}\u001B[22m`,
    red: (/** @type {any} */ s) => `\u001B[31m${s}\u001B[39m`,
    green: (/** @type {any} */ s) => `\u001B[32m${s}\u001B[39m`,
    yellow: (/** @type {any} */ s) => `\u001B[33m${s}\u001B[39m`,
    cyan: (/** @type {any} */ s) => `\u001B[36m${s}\u001B[39m`,
};

// Read the coverage file
const { dirname } = import.meta;

// Resolve coverage-final.json from multiple candidate locations
function findCoveragePath() {
    // 1) Explicit env override
    if (process.env.VITEST_COVERAGE_DIR) {
        const p = path.join(process.env.VITEST_COVERAGE_DIR, "coverage-final.json");
        if (fs.existsSync(p)) return p;
    }
    // 2) Vitest config may redirect to OS temp on Windows/Dropbox
    const tmpCandidate = path.join(os.tmpdir(), "ffv-vitest-coverage", "coverage-final.json");
    if (fs.existsSync(tmpCandidate)) return tmpCandidate;
    // 3) Default local coverage directory under electron-app
    const localCandidate = path.join(dirname, "..", "electron-app", "coverage", "coverage-final.json");
    if (fs.existsSync(localCandidate)) return localCandidate;
    // 4) Fallback: try project root coverage folder
    const rootCandidate = path.join(dirname, "..", "coverage", "coverage-final.json");
    if (fs.existsSync(rootCandidate)) return rootCandidate;
    throw new Error(
        "coverage-final.json not found. Checked VITEST_COVERAGE_DIR, OS temp ffv-vitest-coverage, electron-app/coverage, and project coverage."
    );
}

const coveragePath = findCoveragePath();

const coverageData = JSON.parse(
     
    fs.readFileSync(coveragePath, "utf8")
);

// --------- Configurable defaults (tweak these at top of file) ---------
const DEFAULTS = {
    coverageRelativePath: path.join("coverage", "coverage-final.json"),
    projectRoot: path.resolve(import.meta.dirname, ".."),
    fileDisplayLimit: Number(process.env.COVERAGE_FILE_LIMIT) || 15,
    minFileColumnWidth: 30,
    numericColumnWidth: 20,
    truncateFilePath: 80, // Max characters in File column; longer paths will be ellipsized
    defaultFormat: "table", // 'table' | 'csv' | 'json'
};

// CLI flags
const noColor = process.argv.includes("--no-color");
const formatIndex = process.argv.indexOf("--format");
const outputFormat = formatIndex === -1 ? DEFAULTS.defaultFormat : process.argv[formatIndex + 1];
const limitArgIndex2 = process.argv.indexOf("--limit");
const limitOverride = limitArgIndex2 === -1 ? null : Number(process.argv[limitArgIndex2 + 1]);

// Respect --no-color by overriding color helpers to pass-through
if (noColor) {
    for (const k of Object.keys(colors)) {
        // @ts-expect-error
        colors[k] = (/** @type {any} */ s) => s;
    }
}

// Analyze each file
const fileAnalysis = [];
const { projectRoot, numericColumnWidth, truncateFilePath, minFileColumnWidth } = DEFAULTS;

for (const [filePath, data] of Object.entries(coverageData)) {
    const relativePath = path.relative(projectRoot, filePath);

    // Calculate coverage percentages (guard missing maps)
    const statements = data.s ?? {};
    const functions = data.f ?? {};
    const branches = data.b ?? {};
    const lines = data.l ?? {};

    // Calculate statement coverage
    const totalStatements = Object.keys(statements).length;
    // In Istanbul format, statements map values are counts (0 = missed, >0 = covered)
    const coveredStatements = Object.values(statements).filter((count) => Number(count) > 0).length;
    const statementCoverage = totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 100;

    // Calculate line coverage
    // If l (lines) map is missing or empty, try to derive per-line coverage from statementMap
    const statementMap = data.statementMap ?? data.statementMap ?? {};
    let derivedLines = lines;
    if (Object.keys(derivedLines).length === 0 && statementMap && Object.keys(statementMap).length > 0) {
        // Build a map of line -> coveredCount based on statements covering those lines
        derivedLines = {};
        for (const [stmtId, loc] of Object.entries(statementMap)) {
            // Loc has start.line and end.line typically
            const startLine = loc && loc.start && loc.start.line ? loc.start.line : null;
            const endLine = loc && loc.end && loc.end.line ? loc.end.line : startLine;
            if (startLine === null || startLine === undefined) continue;
            const covered = Number(statements[stmtId]) > 0 ? 1 : 0;
            for (let ln = startLine; ln <= (endLine ?? startLine); ln++) {
                // Accumulate coverage counts per line
                derivedLines[ln] = (derivedLines[ln] || 0) + covered;
            }
        }
    }

    const totalLines = Object.keys(derivedLines).length;
    // Line map values are counts as well (or derived counts)
    const coveredLines = Object.values(derivedLines).filter((count) => Number(count) > 0).length;
    const lineCoverage = totalLines > 0 ? (coveredLines / totalLines) * 100 : 100;

    // Calculate function coverage
    const totalFunctions = Object.keys(functions).length;
    const coveredFunctions = Object.values(functions).filter((count) => count > 0).length;
    const functionCoverage = totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 100;

    // Helper to determine if a branch is covered
    /**
     * Determines if a branch is covered based on its coverage array or count.
     *
     * @param {number | number[]} branchArray - The branch coverage data, either
     *   a number or an array of numbers.
     *
     * @returns {boolean} True if the branch is covered, false otherwise.
     */
    function isBranchCovered(branchArray) {
        return Array.isArray(branchArray) ? branchArray.some((count) => count > 0) : branchArray > 0;
    }

    // Calculate branch coverage
    const totalBranches = Object.keys(branches).length;
    const coveredBranches = Object.values(branches).filter((element) => isBranchCovered(element)).length;
    const branchCoverage = totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 100;

    /**
     * Represents coverage analysis for a single file.
     *
     * @property {string} file - Relative path to the file.
     * @property {Object} statements - Statement coverage details.
     * @property {number} statements.total - Total number of statements.
     * @property {number} statements.covered - Number of covered statements.
     * @property {number} statements.percentage - Percentage of covered
     *   statements.
     * @property {Object} functions - Function coverage details.
     * @property {number} functions.total - Total number of functions.
     * @property {number} functions.covered - Number of covered functions.
     * @property {number} functions.percentage - Percentage of covered
     *   functions.
     * @property {Object} branches - Branch coverage details.
     * @property {number} branches.total - Total number of branches.
     * @property {number} branches.covered - Number of covered branches.
     * @property {number} branches.percentage - Percentage of covered branches.
     *
     *   The analysis object summarizes coverage statistics for each file.
     */
    fileAnalysis.push({
        file: relativePath,
        statements: {
            total: totalStatements,
            covered: coveredStatements,
            percentage: statementCoverage,
        },
        functions: {
            total: totalFunctions,
            covered: coveredFunctions,
            percentage: functionCoverage,
        },
        branches: {
            total: totalBranches,
            covered: coveredBranches,
            percentage: branchCoverage,
        },
        lines: {
            total: totalLines,
            covered: coveredLines,
            percentage: lineCoverage,
        },
    });
}

// Sort by function coverage (lowest first) using immutable operation
const sortedByFunctionCoverage = fileAnalysis.toSorted((a, b) => a.functions.percentage - b.functions.percentage);

// Get limit from CLI argument or environment variable
const fileDisplayLimit = limitOverride ?? DEFAULTS.fileDisplayLimit;

// Debug flag: --debug <relative/path/to/file>
const debugIndex = process.argv.indexOf("--debug");
const debugFile = debugIndex === -1 ? null : process.argv[debugIndex + 1];

// If debug flag provided, print the matching processed entry and raw coverage entry and exit
if (debugFile) {
    const match = fileAnalysis.find((f) => f.file === debugFile || f.file.endsWith(debugFile));
    if (match) {
        console.log("\n=== DEBUG COVERAGE ENTRY (processed) ===");
        console.log(JSON.stringify(match, null, 2));
        // Find raw coverage key
        const rawKey = Object.keys(coverageData).find((k) => {
            const rel = path.relative(projectRoot, k);
            return rel === debugFile || rel.endsWith(debugFile);
        });
        if (rawKey) {
            console.log("\n=== DEBUG RAW COVERAGE ===");
            console.log(JSON.stringify(coverageData[rawKey], null, 2));
        }
        // eslint-disable-next-line n/no-process-exit
        process.exit(0);
    } else {
        console.log(`\nNo coverage entry found for debug file: ${debugFile}`);
        // eslint-disable-next-line n/no-process-exit
        process.exit(1);
    }
}

// Helper: format a fixed-width table for coverage sections
/**
 * @param {any[]} displayed
 */
function computeColWidths(displayed) {
    // File column width + four numeric columns
    const minFileCol = 30;
    const fileCol = Math.max(
        minFileCol,
        ...displayed.map((/** @type {{ file: string | any[] }} */ f) => f.file.length)
    );
    // Other columns get a reasonable width
    const numCol = numericColumnWidth ?? 20;
    return [fileCol, numCol, numCol, numCol, numCol];
}

// Shorten long paths by keeping head and tail with ellipsis in the middle
/**
 * @param {any} s
 * @param {number} max
 */
function ellipsize(s, max) {
    const str = String(s);
    if (!max || str.length <= max) return str;
    if (max <= 4) return str.slice(-max);
    const head = Math.ceil(max * 0.4);
    const tail = max - head - 3; // For '...'
    return `${str.slice(0, head)}...${str.slice(-tail)}`;
}

/**
 * @param {string} s
 * @param {number} width
 */
function padLeft(s, width) {
    const str = String(s);
    if (str.length >= width) return str;
    return " ".repeat(width - str.length) + str;
}

// Small helpers for padding
/**
 * @param {string} s
 * @param {number} width
 */
function padRight(s, width) {
    const str = String(s);
    if (str.length >= width) return str;
    return str + " ".repeat(width - str.length);
}

/**
 * Print a table section with aligned headers and numeric columns.
 *
 * @param {string} header - The section title
 * @param {any[]} files - Array of file analysis objects
 */
function printCoverageSection(header, files) {
    console.log(colors.bold(`=== ${header} ===`));

    const displayed = files.slice(0, fileDisplayLimit);
    // Try to require cli-table3 synchronously so we avoid top-level await lint warnings
    try {
        const requireC = createRequire(import.meta.url);
        // @ts-ignore require possibly missing in some environments
        const Table = requireC("cli-table3");

        const table = new Table({
            head: ["File", "Functions", "Branches", "Statements", "Lines"].map((h) => colors.bold(h)),
            style: { head: [], border: [] },
            colWidths: computeColWidths(displayed),
        });

        for (const f of displayed) {
            const fmt = (/** @type {{ percentage: number; covered: any; total: any }} */ cov) => {
                if (!cov) return "-";
                const pct = cov.percentage ?? 0;
                const pctStr = `${pct.toFixed(2)}%`;
                const text = `${cov.covered}/${cov.total} (${pctStr})`;
                return pct >= 90 ? colors.green(text) : pct >= 75 ? colors.yellow(text) : colors.red(text);
            };
            table.push([
                ellipsize(f.file, truncateFilePath),
                fmt(f.functions),
                fmt(f.branches),
                fmt(f.statements),
                fmt(f.lines),
            ]);
        }

        console.log(table.toString());
        console.log();
        return;
    } catch {
        // If cli-table3 isn't installed, fall back to the pad-based renderer
    }

    // Fallback: pad-based renderer (keeps previous behavior)
    const minFileCol = minFileColumnWidth;
    const fileCol = Math.max(minFileCol, ...displayed.map((f) => ellipsize(f.file, truncateFilePath).length));
    const hdr = `${padRight("File", fileCol)}  ${padLeft("Functions", 14)}  ${padLeft("Branches", 14)}  ${padLeft("Statements", 14)}  ${padLeft("Lines", 14)}`;
    console.log(colors.bold(hdr));

    for (const f of displayed) {
        const rFile = padRight(ellipsize(f.file, truncateFilePath), fileCol);
        const cell = (/** @type {{ percentage: number; covered: any; total: any }} */ cov) => {
            if (!cov) return padLeft("-", 14);
            const pct = cov.percentage ?? 0;
            const pctStr = `${pct.toFixed(2)}%`;
            const plain = `${cov.covered}/${cov.total} (${pctStr})`;
            const padded = padLeft(plain, 14);
            const colored = pct >= 90 ? colors.green(padded) : pct >= 75 ? colors.yellow(padded) : colors.red(padded);
            return colored;
        };

        console.log(
            `${colors.cyan(rFile)}  ${cell(f.functions)}  ${cell(f.branches)}  ${cell(f.statements)}  ${cell(f.lines)}`
        );
    }
    console.log();
}

// Show files with function coverage < 90%
const lowFunctionCoverage = sortedByFunctionCoverage.filter((file) => file.functions.percentage < 90);
// If output format is JSON or CSV, emit that and exit early for tooling/CI
if (outputFormat === "json") {
    // Emit the full analysis as JSON
    console.log(JSON.stringify(fileAnalysis, null, 2));
    // eslint-disable-next-line n/no-process-exit
    process.exit(0);
}

if (outputFormat === "csv") {
    // Build CSV header
    const hdr = [
        "file",
        "functions_total",
        "functions_covered",
        "functions_pct",
        "branches_total",
        "branches_covered",
        "branches_pct",
        "statements_total",
        "statements_covered",
        "statements_pct",
        "lines_total",
        "lines_covered",
        "lines_pct",
    ].join(",");
    console.log(hdr);
    for (const f of fileAnalysis) {
        const csvEscape = (/** @type {string | null | undefined} */ v) => {
            if (v === null || v === undefined) return "";
            const s = String(v);
            if (s.includes(",") || s.includes('"') || s.includes("\n")) {
                return `"${s.replaceAll('"', '""')}"`;
            }
            return s;
        };
        const row = [
            csvEscape(f.file),
            f.functions.total,
            f.functions.covered,
            f.functions.percentage.toFixed(2),
            f.branches.total,
            f.branches.covered,
            f.branches.percentage.toFixed(2),
            f.statements.total,
            f.statements.covered,
            f.statements.percentage.toFixed(2),
            f.lines.total,
            f.lines.covered,
            f.lines.percentage.toFixed(2),
        ].join(",");
        console.log(row);
    }
    // eslint-disable-next-line n/no-process-exit
    process.exit(0);
}

// Default: table output
printCoverageSection("FILES WITH LOWEST FUNCTION COVERAGE", lowFunctionCoverage);

// Sort by branch coverage using immutable operation
const sortedByBranchCoverage = fileAnalysis.toSorted((a, b) => a.branches.percentage - b.branches.percentage);
const lowBranchCoverage = sortedByBranchCoverage.filter((file) => file.branches.percentage < 90);
printCoverageSection("FILES WITH LOWEST BRANCH COVERAGE", lowBranchCoverage);

// Sort by statement coverage using immutable operation
const sortedByStatementCoverage = fileAnalysis.toSorted((a, b) => a.statements.percentage - b.statements.percentage);
const lowStatementCoverage = sortedByStatementCoverage.filter((file) => file.statements.percentage < 90);
printCoverageSection("FILES WITH LOWEST STATEMENT COVERAGE", lowStatementCoverage);

// Sort by line coverage using immutable operation
const sortedByLineCoverage = fileAnalysis.toSorted(
    (a, b) => (a.lines?.percentage ?? 100) - (b.lines?.percentage ?? 100)
);
const lowLineCoverage = sortedByLineCoverage.filter((file) => (file.lines?.percentage ?? 100) < 90);
printCoverageSection("FILES WITH LOWEST LINE COVERAGE", lowLineCoverage);

console.log("\n=== SUMMARY ===");
console.log(`Total files analyzed: ${fileAnalysis.length}`);
console.log(`Files with <90% function coverage: ${fileAnalysis.filter((f) => f.functions.percentage < 90).length}`);
console.log(`Files with <90% branch coverage: ${fileAnalysis.filter((f) => f.branches.percentage < 90).length}`);
