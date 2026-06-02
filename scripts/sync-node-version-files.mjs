#!/usr/bin/env node

/**
 * Synchronize repository Node version files.
 *
 * Source of truth:
 *
 * - Current runtime version by default (`process.versions.node`)
 * - Optional `--version x.y.z` override for automation.
 *
 * Files managed:
 *
 * - `.node-version`
 * - `.nvmrc`.
 */

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const packageJsonPath = fileURLToPath(
    new URL("../package.json", import.meta.url)
);
const nodeVersionFilePath = fileURLToPath(
    new URL("../.node-version", import.meta.url)
);
const nvmrcFilePath = fileURLToPath(new URL("../.nvmrc", import.meta.url));

/**
 * Normalize a Node.js version string to exact `x.y.z` form.
 *
 * @param {unknown} version
 *
 * @returns {string}
 *
 * @throws {TypeError} If version is not a string or does not match x.y.z format
 */
const normalizeNodeVersion = (version) => {
    if (typeof version !== "string") {
        throw new TypeError("Expected a string Node.js version.");
    }

    const trimmedVersion = version.trim().replace(/^v/iu, "");

    if (!/^\d+\.\d+\.\d+$/v.test(trimmedVersion)) {
        throw new TypeError(
            `Expected an exact Node.js version in x.y.z form, received: ${version}`
        );
    }

    return trimmedVersion;
};

/**
 * Check whether an unknown value is a non-null object record.
 *
 * @param {unknown} value
 *
 * @returns {value is Record<string, unknown>}
 */
const isRecord = (value) => typeof value === "object" && value !== null;

/**
 * Parse command-line arguments.
 *
 * Supported options:
 *
 * - `--check`: validate file existence and synchronization only
 * - `--check-current`: validate files match current runtime version exactly
 * - `--version x.y.z` or `--version=x.y.z`: explicit version override.
 *
 * @param {readonly string[]} argumentList
 *
 * @returns {{
 *     checkOnly: boolean;
 *     checkCurrent: boolean;
 *     explicitVersion: string | null;
 * }}
 *
 * @throws {TypeError} If arguments are invalid or conflicting options are
 *   provided
 */
const parseArguments = (argumentList) => {
    /** @type {boolean} */
    let checkOnly = false;
    /** @type {boolean} */
    let checkCurrent = false;
    /** @type {string | null} */
    let explicitVersion = null;

    for (let index = 0; index < argumentList.length; index += 1) {
        const argument = argumentList[index];

        if (typeof argument !== "string") {
            throw new TypeError(
                `Expected a string command-line argument at index ${index}.`
            );
        }

        if (argument === "--check") {
            checkOnly = true;
        } else if (argument === "--check-current") {
            checkCurrent = true;
        } else if (argument === "--version") {
            const nextArgument = argumentList[index + 1];

            if (typeof nextArgument !== "string") {
                throw new TypeError("Expected a version after --version.");
            }

            explicitVersion = normalizeNodeVersion(nextArgument);
            index += 1;
        } else if (argument.startsWith("--version=")) {
            explicitVersion = normalizeNodeVersion(
                argument.slice("--version=".length)
            );
        } else {
            throw new TypeError(`Unknown argument: ${argument}`);
        }
    }

    if (checkOnly && checkCurrent) {
        throw new TypeError(
            "Use either --check or --check-current, but not both together."
        );
    }

    return {
        checkCurrent,
        checkOnly,
        explicitVersion,
    };
};

/**
 * Read and parse package.json.
 *
 * @returns {Promise<Record<string, unknown>>}
 */
const readPackageJson = async () => {
    const packageJsonContent = await readFile(packageJsonPath, "utf8");

    return /** @type {Record<string, unknown>} */ (
        JSON.parse(packageJsonContent)
    );
};

/**
 * Extract the minimum supported Node.js version when `engines.node` uses the
 * repository's current `>=x.y.z` form.
 *
 * @param {unknown} enginesValue
 *
 * @returns {string | null}
 */
const resolveMinimumEngineVersion = (enginesValue) => {
    if (!isRecord(enginesValue) || typeof enginesValue["node"] !== "string") {
        return null;
    }

    const nodeEngineRange = enginesValue["node"].trim();
    const match = /^>=\s*(\d+\.\d+\.\d+)$/v.exec(nodeEngineRange);

    return match?.[1] ?? null;
};

/**
 * Compare two exact semver versions.
 *
 * @param {string} leftVersion
 * @param {string} rightVersion
 *
 * @returns {number}
 */
const compareExactVersions = (leftVersion, rightVersion) => {
    const leftSegments = leftVersion.split(".").map(Number);
    const rightSegments = rightVersion.split(".").map(Number);

    for (
        let index = 0;
        index < Math.max(leftSegments.length, rightSegments.length);
        index += 1
    ) {
        const leftSegment = leftSegments[index] ?? 0;
        const rightSegment = rightSegments[index] ?? 0;

        if (leftSegment !== rightSegment) {
            return leftSegment - rightSegment;
        }
    }

    return 0;
};

/**
 * Ensure the preferred version does not fall below the minimum supported
 * engine.
 *
 * @param {string} preferredVersion
 * @param {string | null} minimumEngineVersion
 *
 * @returns {void}
 *
 * @throws {RangeError} If preferred version is below the minimum supported
 *   engine
 */
const assertPreferredVersionSupported = (
    preferredVersion,
    minimumEngineVersion
) => {
    if (minimumEngineVersion === null) {
        return;
    }

    if (compareExactVersions(preferredVersion, minimumEngineVersion) < 0) {
        throw new RangeError(
            [
                "Preferred Node.js version is below package.json engines.node.",
                `Preferred: ${preferredVersion}.`,
                `Minimum engine: ${minimumEngineVersion}.`,
            ].join(" ")
        );
    }
};

/**
 * Read a managed version file if it exists.
 *
 * @param {string} filePath
 *
 * @returns {Promise<string | null>}
 */
const readOptionalVersionFile = async (filePath) => {
    try {
        return await readFile(filePath, "utf8");
    } catch (error) {
        if (
            error instanceof Error &&
            "code" in error &&
            error.code === "ENOENT"
        ) {
            return null;
        }

        throw error;
    }
};

/**
 * Write the managed version files.
 *
 * @param {string} preferredVersion
 *
 * @returns {Promise<void>}
 */
const writeVersionFiles = async (preferredVersion) => {
    const fileContent = `${preferredVersion}\n`;

    await Promise.all([
        writeFile(nodeVersionFilePath, fileContent, "utf8"),
        writeFile(nvmrcFilePath, fileContent, "utf8"),
    ]);
};

/**
 * Validate the managed version files.
 *
 * @param {{ expectedVersion: string | null }} options
 *
 * @returns {Promise<void>}
 */
const validateVersionFiles = async ({ expectedVersion }) => {
    const nodeVersionFileContent =
        await readOptionalVersionFile(nodeVersionFilePath);
    const nvmrcFileContent = await readOptionalVersionFile(nvmrcFilePath);

    if (nodeVersionFileContent === null || nvmrcFileContent === null) {
        throw new TypeError(
            "Expected both .node-version and .nvmrc to exist in the repository root."
        );
    }

    const normalizedNodeVersionFile = normalizeNodeVersion(
        nodeVersionFileContent
    );
    const normalizedNvmrcFile = normalizeNodeVersion(nvmrcFileContent);

    if (normalizedNodeVersionFile !== normalizedNvmrcFile) {
        throw new TypeError(
            [
                "Node version files are out of sync.",
                `.node-version=${normalizedNodeVersionFile}`,
                `.nvmrc=${normalizedNvmrcFile}`,
            ].join(" ")
        );
    }

    if (
        expectedVersion !== null &&
        normalizedNodeVersionFile !== expectedVersion
    ) {
        throw new TypeError(
            [
                "Node version files do not match the expected version.",
                `Expected: ${expectedVersion}.`,
                `Actual: ${normalizedNodeVersionFile}.`,
            ].join(" ")
        );
    }

    console.log(
        `Node version files are synchronized: ${normalizedNodeVersionFile}`
    );
};

const main = async () => {
    const { checkCurrent, checkOnly, explicitVersion } = parseArguments(
        process.argv.slice(2)
    );
    const packageJson = await readPackageJson();
    const minimumEngineVersion = resolveMinimumEngineVersion(
        packageJson["engines"]
    );
    const preferredVersion =
        explicitVersion ?? normalizeNodeVersion(process.versions.node);

    assertPreferredVersionSupported(preferredVersion, minimumEngineVersion);

    if (checkOnly) {
        await validateVersionFiles({ expectedVersion: null });
        return;
    }

    if (checkCurrent) {
        await validateVersionFiles({ expectedVersion: preferredVersion });
        return;
    }

    await writeVersionFiles(preferredVersion);
    console.log(`Synchronized .node-version and .nvmrc to ${preferredVersion}`);
};

try {
    await main();
} catch (error) {
    console.error("Failed to synchronize Node version files:", error);
    process.exitCode = 1;
}
