/**
 * Analyze Istanbul coverage-final.json output and print the lowest-coverage
 * files in table, CSV, or JSON form.
 */

import { access, readFile } from "node:fs/promises";
import os from "node:os";
import * as path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { rootCoverageAbsolutePath, repositoryRoot } from "./lib/workspaces.mjs";

/** @typedef {"csv" | "json" | "table"} OutputFormat */
/** @typedef {(text: string) => string} Colorize */

/**
 * @typedef {Record<string, number>} CountMap
 */

/**
 * @typedef {{ line: number }} IstanbulPosition
 */

/**
 * @typedef {{ end?: IstanbulPosition; start?: IstanbulPosition }} IstanbulLocation
 */

/**
 * @typedef {Record<string, IstanbulLocation>} StatementMap
 */

/**
 * @typedef {{
 *     b?: Record<string, number | number[]>;
 *     f?: CountMap;
 *     l?: CountMap;
 *     s?: CountMap;
 *     statementMap?: StatementMap;
 * }} IstanbulFileCoverage
 */

/**
 * @typedef {Record<string, IstanbulFileCoverage>} IstanbulCoverage
 */

/**
 * @typedef {{ covered: number; percentage: number; total: number }} CoverageMetric
 */

/**
 * @typedef {{
 *     branches: CoverageMetric;
 *     file: string;
 *     functions: CoverageMetric;
 *     lines: CoverageMetric;
 *     statements: CoverageMetric;
 * }} FileCoverageAnalysis
 */

/**
 * @typedef {{
 *     coveragePath: string;
 *     debugFile: string | undefined;
 *     fileDisplayLimit: number;
 *     noColor: boolean;
 *     outputFormat: OutputFormat;
 *     projectRoot: string;
 *     truncateFilePath: number;
 * }} AnalyzeOptions
 */

const DEFAULT_FILE_DISPLAY_LIMIT = 15;
const DEFAULT_TRUNCATE_FILE_PATH = 80;
const FILE_COLUMN_MIN_WIDTH = 30;
const NUMERIC_COLUMN_WIDTH = 14;
const COVERAGE_FILE_NAME = "coverage-final.json";
const LOW_COVERAGE_THRESHOLD = 90;

/** @type {Record<string, Colorize>} */
const ANSI_COLORS = {
    bold: (text) => `\u001B[1m${text}\u001B[22m`,
    cyan: (text) => `\u001B[36m${text}\u001B[39m`,
    green: (text) => `\u001B[32m${text}\u001B[39m`,
    red: (text) => `\u001B[31m${text}\u001B[39m`,
    yellow: (text) => `\u001B[33m${text}\u001B[39m`,
};

/** @type {Record<string, Colorize>} */
const PLAIN_COLORS = {
    bold: (text) => text,
    cyan: (text) => text,
    green: (text) => text,
    red: (text) => text,
    yellow: (text) => text,
};

/**
 * @param {IstanbulCoverage} coverageData
 * @param {string} projectRoot
 *
 * @returns {FileCoverageAnalysis[]}
 */
export function analyzeCoverage(coverageData, projectRoot) {
    return Object.entries(coverageData).map(([filePath, data]) => {
        const lines = deriveLineCounts(
            data.l ?? {},
            data.s ?? {},
            data.statementMap ?? {}
        );

        return {
            branches: calculateBranchCoverage(data.b ?? {}),
            file: path.relative(projectRoot, filePath),
            functions: calculateCountCoverage(data.f ?? {}),
            lines: calculateCountCoverage(lines),
            statements: calculateCountCoverage(data.s ?? {}),
        };
    });
}

/**
 * @param {Record<string, number | number[]>} branches
 *
 * @returns {CoverageMetric}
 */
function calculateBranchCoverage(branches) {
    const total = Object.keys(branches).length;
    const covered = Object.values(branches).filter((branchCount) =>
        isBranchCovered(branchCount)
    ).length;
    return {
        covered,
        percentage: total > 0 ? (covered / total) * 100 : 100,
        total,
    };
}

/**
 * @param {CountMap} counts
 *
 * @returns {CoverageMetric}
 */
function calculateCountCoverage(counts) {
    const total = Object.keys(counts).length;
    const covered = Object.values(counts).filter((count) => count > 0).length;
    return {
        covered,
        percentage: total > 0 ? (covered / total) * 100 : 100,
        total,
    };
}

/**
 * @param {CoverageMetric} metric
 * @param {Record<string, Colorize>} colors
 *
 * @returns {string}
 */
function colorizeMetric(metric, colors) {
    const text = formatMetric(metric);
    if (metric.percentage >= 90) {
        return colors.green(text);
    }

    return metric.percentage >= 75 ? colors.yellow(text) : colors.red(text);
}

/**
 * @param {string} value
 *
 * @returns {string}
 */
function csvEscape(value) {
    return value.includes(",") || value.includes('"') || value.includes("\n")
        ? `"${value.replaceAll('"', '""')}"`
        : value;
}

/**
 * @param {CountMap} lines
 * @param {CountMap} statements
 * @param {StatementMap} statementMap
 *
 * @returns {CountMap}
 */
function deriveLineCounts(lines, statements, statementMap) {
    if (
        Object.keys(lines).length > 0 ||
        Object.keys(statementMap).length === 0
    ) {
        return lines;
    }

    /** @type {CountMap} */
    const derivedLines = {};
    for (const [statementId, location] of Object.entries(statementMap)) {
        const startLine = location.start.line;
        const endLine = location.end?.line ?? startLine;
        const covered = (statements[statementId] ?? 0) > 0 ? 1 : 0;
        for (
            let lineNumber = startLine;
            lineNumber <= endLine;
            lineNumber += 1
        ) {
            const lineKey = String(lineNumber);
            const currentLineCount = derivedLines[lineKey] ?? 0;
            derivedLines[lineKey] = currentLineCount + covered;
        }
    }

    return derivedLines;
}

/**
 * @param {string} text
 * @param {number} maxLength
 *
 * @returns {string}
 */
function ellipsize(text, maxLength) {
    if (maxLength <= 0 || text.length <= maxLength) {
        return text;
    }

    if (maxLength <= 4) {
        return text.slice(-maxLength);
    }

    const headLength = Math.ceil(maxLength * 0.4);
    const tailLength = maxLength - headLength - 3;
    return `${text.slice(0, headLength)}...${text.slice(-tailLength)}`;
}

export function createCoverageCandidatePaths({
    environmentCoverageDirectory = getEnvironmentValue("VITEST_COVERAGE_DIR"),
    rootCoverageDirectory = rootCoverageAbsolutePath,
    temporaryDirectory = os.tmpdir(),
} = {}) {
    return [
        environmentCoverageDirectory === undefined
            ? undefined
            : path.join(environmentCoverageDirectory, COVERAGE_FILE_NAME),
        path.join(
            temporaryDirectory,
            "ffv-vitest-coverage",
            COVERAGE_FILE_NAME
        ),
        path.join(rootCoverageDirectory, COVERAGE_FILE_NAME),
    ].filter((candidatePath) => candidatePath !== undefined);
}

/**
 * @returns {Promise<string>}
 */
export async function findCoveragePath({
    candidatePaths = createCoverageCandidatePaths(),
    pathExistsFunction = pathExists,
} = {}) {
    const candidates = candidatePaths;

    const results = await Promise.all(
        candidates.map(async (candidatePath) => ({
            candidatePath,
            exists: await pathExistsFunction(candidatePath),
        }))
    );
    const found = results.find((result) => result.exists);
    if (found !== undefined) {
        return found.candidatePath;
    }

    throw new Error(
        "coverage-final.json not found. Checked VITEST_COVERAGE_DIR, OS temp ffv-vitest-coverage, and root coverage."
    );
}

/**
 * @param {CoverageMetric} metric
 *
 * @returns {string}
 */
function formatMetric(metric) {
    return `${metric.covered}/${metric.total} (${metric.percentage.toFixed(2)}%)`;
}

/**
 * @param {string} key
 *
 * @returns {string | undefined}
 */
function getEnvironmentValue(key) {
    const processValue = Reflect.get(globalThis, "process");
    if (typeof processValue !== "object" || !("env" in processValue)) {
        return undefined;
    }

    const envValue = Reflect.get(processValue, "env");
    if (typeof envValue !== "object") {
        return undefined;
    }

    const value = Reflect.get(envValue, key);
    return typeof value === "string" ? value : undefined;
}

/**
 * @param {number | number[]} branchCount
 *
 * @returns {boolean}
 */
function isBranchCovered(branchCount) {
    return Array.isArray(branchCount)
        ? branchCount.some((count) => count > 0)
        : branchCount > 0;
}

/**
 * @param {unknown} value
 *
 * @returns {value is IstanbulPosition}
 */
function isIstanbulPosition(value) {
    return isRecord(value) && typeof value.line === "number";
}

/**
 * @param {unknown} value
 *
 * @returns {value is Record<string, unknown>}
 */
function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function main() {
    const options = await parseOptions();
    const coverageData = await readCoverageData(options.coveragePath);
    const fileAnalysis = analyzeCoverage(coverageData, options.projectRoot);

    if (
        printDebugEntry(
            options.debugFile,
            fileAnalysis,
            coverageData,
            options.projectRoot
        )
    ) {
        return;
    }

    if (options.outputFormat === "json") {
        printJson(fileAnalysis);
        return;
    }

    if (options.outputFormat === "csv") {
        printCsv(fileAnalysis);
        return;
    }

    printTable(fileAnalysis, options);
}

/**
 * @param {string} text
 * @param {number} width
 *
 * @returns {string}
 */
function padLeft(text, width) {
    return text.length >= width
        ? text
        : `${" ".repeat(width - text.length)}${text}`;
}

/**
 * @param {string} text
 * @param {number} width
 *
 * @returns {string}
 */
function padRight(text, width) {
    return text.length >= width
        ? text
        : `${text}${" ".repeat(width - text.length)}`;
}

/**
 * @param {unknown} value
 *
 * @returns {IstanbulCoverage}
 */
export function parseCoverageData(value) {
    if (!isRecord(value)) {
        throw new Error("coverage-final.json must contain an object.");
    }

    /** @type {IstanbulCoverage} */
    const coverageData = {};
    for (const [filePath, rawCoverage] of Object.entries(value)) {
        if (isRecord(rawCoverage)) {
            coverageData[filePath] = {
                b: toBranchMap(Reflect.get(rawCoverage, "b")),
                f: toCountMap(Reflect.get(rawCoverage, "f")),
                l: toCountMap(Reflect.get(rawCoverage, "l")),
                s: toCountMap(Reflect.get(rawCoverage, "s")),
                statementMap: toStatementMap(
                    Reflect.get(rawCoverage, "statementMap")
                ),
            };
        }
    }

    return coverageData;
}

/**
 * @returns {Promise<AnalyzeOptions>}
 */
async function parseOptions() {
    const argv = process.argv.slice(2);
    const coveragePath = await findCoveragePath();
    const formatValue = readFlagValue(argv, "--format") ?? "table";
    const limitValue =
        readFlagValue(argv, "--limit") ??
        getEnvironmentValue("COVERAGE_FILE_LIMIT");

    return {
        coveragePath,
        debugFile: readFlagValue(argv, "--debug"),
        fileDisplayLimit: parsePositiveInteger(
            limitValue,
            DEFAULT_FILE_DISPLAY_LIMIT
        ),
        noColor: argv.includes("--no-color"),
        outputFormat: parseOutputFormat(formatValue),
        projectRoot: repositoryRoot,
        truncateFilePath: DEFAULT_TRUNCATE_FILE_PATH,
    };
}

/**
 * @param {string} value
 *
 * @returns {OutputFormat}
 */
function parseOutputFormat(value) {
    if (value === "csv" || value === "json" || value === "table") {
        return value;
    }

    throw new Error(
        `Unsupported coverage output format "${value}". Use table, csv, or json.`
    );
}

/**
 * @param {string | undefined} value
 * @param {number} fallback
 *
 * @returns {number}
 */
function parsePositiveInteger(value, fallback) {
    if (value === undefined || value.trim() === "") {
        return fallback;
    }

    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * @param {string} candidatePath
 *
 * @returns {Promise<boolean>}
 */
async function pathExists(candidatePath) {
    try {
        await access(candidatePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * @param {string} header
 * @param {FileCoverageAnalysis[]} files
 * @param {AnalyzeOptions} options
 * @param {Record<string, Colorize>} colors
 *
 * @returns {void}
 */
function printCoverageSection(header, files, options, colors) {
    writeLine(colors.bold(`=== ${header} ===`));

    const displayed = files.slice(0, options.fileDisplayLimit);
    const fileColumnWidth = Math.max(
        FILE_COLUMN_MIN_WIDTH,
        ...displayed.map(
            (file) => ellipsize(file.file, options.truncateFilePath).length
        )
    );
    writeLine(
        colors.bold(
            `${padRight("File", fileColumnWidth)}  ${padLeft("Functions", NUMERIC_COLUMN_WIDTH)}  ${padLeft("Branches", NUMERIC_COLUMN_WIDTH)}  ${padLeft("Statements", NUMERIC_COLUMN_WIDTH)}  ${padLeft("Lines", NUMERIC_COLUMN_WIDTH)}`
        )
    );

    for (const file of displayed) {
        const renderedFile = padRight(
            ellipsize(file.file, options.truncateFilePath),
            fileColumnWidth
        );
        writeLine(
            `${colors.cyan(renderedFile)}  ${padLeft(renderMetricCell(file.functions, colors), NUMERIC_COLUMN_WIDTH)}  ${padLeft(renderMetricCell(file.branches, colors), NUMERIC_COLUMN_WIDTH)}  ${padLeft(renderMetricCell(file.statements, colors), NUMERIC_COLUMN_WIDTH)}  ${padLeft(renderMetricCell(file.lines, colors), NUMERIC_COLUMN_WIDTH)}`
        );
    }
    writeLine();
}

/**
 * @param {FileCoverageAnalysis[]} fileAnalysis
 *
 * @returns {void}
 */
function printCsv(fileAnalysis) {
    writeLine(
        [
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
        ].join(",")
    );

    for (const file of fileAnalysis) {
        writeLine(
            [
                csvEscape(file.file),
                file.functions.total,
                file.functions.covered,
                file.functions.percentage.toFixed(2),
                file.branches.total,
                file.branches.covered,
                file.branches.percentage.toFixed(2),
                file.statements.total,
                file.statements.covered,
                file.statements.percentage.toFixed(2),
                file.lines.total,
                file.lines.covered,
                file.lines.percentage.toFixed(2),
            ].join(",")
        );
    }
}

/**
 * @param {string | undefined} debugFile
 * @param {FileCoverageAnalysis[]} fileAnalysis
 * @param {IstanbulCoverage} coverageData
 * @param {string} projectRoot
 *
 * @returns {boolean}
 */
function printDebugEntry(debugFile, fileAnalysis, coverageData, projectRoot) {
    if (debugFile === undefined) {
        return false;
    }

    const match = fileAnalysis.find(
        (file) => file.file === debugFile || file.file.endsWith(debugFile)
    );
    if (match === undefined) {
        writeLine(`\nNo coverage entry found for debug file: ${debugFile}`);
        process.exitCode = 1;
        return true;
    }

    writeLine("\n=== DEBUG COVERAGE ENTRY (processed) ===");
    writeLine(JSON.stringify(match, null, 2));

    const rawKey = Object.keys(coverageData).find((coverageFilePath) => {
        const relativePath = path.relative(projectRoot, coverageFilePath);
        return relativePath === debugFile || relativePath.endsWith(debugFile);
    });

    if (rawKey !== undefined) {
        writeLine("\n=== DEBUG RAW COVERAGE ===");
        writeLine(JSON.stringify(coverageData[rawKey], null, 2));
    }

    return true;
}

/**
 * @param {FileCoverageAnalysis[]} fileAnalysis
 *
 * @returns {void}
 */
function printJson(fileAnalysis) {
    writeLine(JSON.stringify(fileAnalysis, null, 2));
}

/**
 * @param {FileCoverageAnalysis[]} fileAnalysis
 * @param {AnalyzeOptions} options
 *
 * @returns {void}
 */
function printTable(fileAnalysis, options) {
    const colors = options.noColor ? PLAIN_COLORS : ANSI_COLORS;
    const lowFunctionCoverage = sortByMetric(
        fileAnalysis,
        (file) => file.functions.percentage
    ).filter((file) => file.functions.percentage < LOW_COVERAGE_THRESHOLD);
    printCoverageSection(
        "FILES WITH LOWEST FUNCTION COVERAGE",
        lowFunctionCoverage,
        options,
        colors
    );

    const lowBranchCoverage = sortByMetric(
        fileAnalysis,
        (file) => file.branches.percentage
    ).filter((file) => file.branches.percentage < LOW_COVERAGE_THRESHOLD);
    printCoverageSection(
        "FILES WITH LOWEST BRANCH COVERAGE",
        lowBranchCoverage,
        options,
        colors
    );

    const lowStatementCoverage = sortByMetric(
        fileAnalysis,
        (file) => file.statements.percentage
    ).filter((file) => file.statements.percentage < LOW_COVERAGE_THRESHOLD);
    printCoverageSection(
        "FILES WITH LOWEST STATEMENT COVERAGE",
        lowStatementCoverage,
        options,
        colors
    );

    const lowLineCoverage = sortByMetric(
        fileAnalysis,
        (file) => file.lines.percentage
    ).filter((file) => file.lines.percentage < LOW_COVERAGE_THRESHOLD);
    printCoverageSection(
        "FILES WITH LOWEST LINE COVERAGE",
        lowLineCoverage,
        options,
        colors
    );

    writeLine("\n=== SUMMARY ===");
    writeLine(`Total files analyzed: ${fileAnalysis.length}`);
    writeLine(
        `Files with <90% function coverage: ${fileAnalysis.filter((file) => file.functions.percentage < LOW_COVERAGE_THRESHOLD).length}`
    );
    writeLine(
        `Files with <90% branch coverage: ${fileAnalysis.filter((file) => file.branches.percentage < LOW_COVERAGE_THRESHOLD).length}`
    );
}

/**
 * @param {string} coveragePath
 *
 * @returns {Promise<IstanbulCoverage>}
 */
async function readCoverageData(coveragePath) {
    const coverageJson = await readFile(coveragePath, "utf8");
    return parseCoverageData(JSON.parse(coverageJson));
}

/**
 * @param {readonly string[]} argv
 * @param {string} flag
 *
 * @returns {string | undefined}
 */
function readFlagValue(argv, flag) {
    const flagIndex = argv.indexOf(flag);
    if (flagIndex === -1) {
        return undefined;
    }

    const value = argv[flagIndex + 1];
    return value === undefined || value.startsWith("--") ? undefined : value;
}

/**
 * @param {CoverageMetric} metric
 * @param {Record<string, Colorize>} colors
 *
 * @returns {string}
 */
function renderMetricCell(metric, colors) {
    return colorizeMetric(
        {
            ...metric,
            covered: metric.covered,
            percentage: metric.percentage,
            total: metric.total,
        },
        colors
    );
}

/**
 * @param {FileCoverageAnalysis[]} analyses
 * @param {(analysis: FileCoverageAnalysis) => number} selector
 *
 * @returns {FileCoverageAnalysis[]}
 */
function sortByMetric(analyses, selector) {
    /** @type {FileCoverageAnalysis[]} */
    const sorted = [];
    for (const analysis of analyses) {
        const metric = selector(analysis);
        const insertAt = sorted.findIndex(
            (sortedAnalysis) => metric < selector(sortedAnalysis)
        );
        if (insertAt === -1) {
            sorted.push(analysis);
        } else {
            sorted.splice(insertAt, 0, analysis);
        }
    }

    return sorted;
}

/**
 * @param {unknown} value
 *
 * @returns {Record<string, number | number[]>}
 */
function toBranchMap(value) {
    if (!isRecord(value)) {
        return {};
    }

    /** @type {Record<string, number | number[]>} */
    const branches = {};
    for (const [key, count] of Object.entries(value)) {
        if (typeof count === "number") {
            branches[key] = count;
        } else if (
            Array.isArray(count) &&
            count.every((entry) => typeof entry === "number")
        ) {
            branches[key] = count;
        }
    }

    return branches;
}

/**
 * @param {unknown} value
 *
 * @returns {CountMap}
 */
function toCountMap(value) {
    if (!isRecord(value)) {
        return {};
    }

    /** @type {CountMap} */
    const counts = {};
    for (const [key, count] of Object.entries(value)) {
        if (typeof count === "number") {
            counts[key] = count;
        }
    }

    return counts;
}

/**
 * @param {unknown} value
 *
 * @returns {StatementMap}
 */
function toStatementMap(value) {
    if (!isRecord(value)) {
        return {};
    }

    /** @type {StatementMap} */
    const statementMap = {};
    for (const [key, location] of Object.entries(value)) {
        if (isRecord(location)) {
            const start = Reflect.get(location, "start");
            const end = Reflect.get(location, "end");
            if (isIstanbulPosition(start)) {
                statementMap[key] = {
                    end: isIstanbulPosition(end) ? end : start,
                    start,
                };
            }
        }
    }

    return statementMap;
}

/**
 * @param {string} message
 *
 * @returns {void}
 */
function writeError(message) {
    process.stderr.write(`${message}\n`);
}

/**
 * @param {string} line
 *
 * @returns {void}
 */
function writeLine(line = "") {
    process.stdout.write(`${line}\n`);
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    main().catch(
        /**
         * @param {unknown} error
         *
         * @returns {void}
         */
        (error) => {
            writeError(error instanceof Error ? error.message : String(error));
            process.exitCode = 1;
        }
    );
}
