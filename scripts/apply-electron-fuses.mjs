import {
    flipFuses,
    FuseState,
    FuseV1Options,
    FuseVersion,
    getCurrentFuseWire,
} from "@electron/fuses";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

import {
    repositoryRoot,
    rootReleaseDistAbsolutePath,
} from "./lib/workspaces.mjs";

const fallbackProductName = "Fit File Viewer";

export const electronFuseConfig = Object.freeze({
    [FuseV1Options.EnableCookieEncryption]: true,
    [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
    [FuseV1Options.EnableNodeCliInspectArguments]: false,
    [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
    [FuseV1Options.GrantFileProtocolExtraPrivileges]: true,
    [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]: false,
    [FuseV1Options.OnlyLoadAppFromAsar]: true,
    [FuseV1Options.RunAsNode]: false,
    [FuseV1Options.WasmTrapHandlers]: true,
    strictlyRequireAllFuses: true,
    version: FuseVersion.V1,
});

export const expectedElectronFuseStates = Object.freeze({
    [FuseV1Options.EnableCookieEncryption]: FuseState.ENABLE,
    [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: FuseState.ENABLE,
    [FuseV1Options.EnableNodeCliInspectArguments]: FuseState.DISABLE,
    [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: FuseState.DISABLE,
    [FuseV1Options.GrantFileProtocolExtraPrivileges]: FuseState.ENABLE,
    [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]: FuseState.DISABLE,
    [FuseV1Options.OnlyLoadAppFromAsar]: FuseState.ENABLE,
    [FuseV1Options.RunAsNode]: FuseState.DISABLE,
    [FuseV1Options.WasmTrapHandlers]: FuseState.ENABLE,
});

const unpackedBuildDirectoryNames = [
    "linux-arm64-unpacked",
    "linux-ia32-unpacked",
    "linux-unpacked",
    "mac",
    "mac-arm64",
    "mas",
    "mas-dev",
    "win-arm64-unpacked",
    "win-ia32-unpacked",
    "win-unpacked",
];

/**
 * @typedef {object} ElectronBuilderAfterPackContext
 *
 * @property {string} appOutDir
 * @property {string} [electronPlatformName]
 * @property {{
 *     appInfo?: {
 *         productFilename?: string;
 *         productName?: string;
 *     };
 * }} [packager]
 */

/**
 * @typedef {(message: string) => void} Logger
 *
 * @typedef {(
 *     executablePath: string,
 *     fuseConfig: typeof electronFuseConfig
 * ) => Promise<void>} FlipFusesImpl
 *
 * @typedef {(executablePath: string) => Promise<Record<string, FuseState>>} GetCurrentFuseWireImpl
 */

/**
 * @param {{
 *     executablePaths?: readonly string[];
 *     flipFusesImpl?: FlipFusesImpl;
 *     getCurrentFuseWireImpl?: GetCurrentFuseWireImpl;
 *     logger?: Logger;
 * }} [options]
 *
 * @returns {Promise<readonly string[]>}
 */
export async function applyElectronFuses({
    executablePaths,
    flipFusesImpl = flipFuses,
    getCurrentFuseWireImpl = getCurrentFuseWire,
    logger = writeLog,
} = {}) {
    const targets =
        executablePaths ?? (await findPackagedElectronExecutablePaths());

    if (targets.length === 0) {
        throw new Error(
            `No unpacked Electron executable found in ${rootReleaseDistAbsolutePath}`
        );
    }

    await Promise.all(
        targets.map(async (executablePath) => {
            logger(`[apply-electron-fuses] ${executablePath}`);
            await flipFusesImpl(executablePath, electronFuseConfig);
            await assertElectronFuseState(
                executablePath,
                getCurrentFuseWireImpl
            );
        })
    );

    return targets;
}

/**
 * @param {{ productName?: string; releaseDistPath?: string }} [options]
 *
 * @returns {Promise<string[]>}
 */
export async function findPackagedElectronExecutablePaths({
    productName,
    releaseDistPath,
} = {}) {
    const candidates = getPackagedElectronExecutableCandidates({
        productName: productName ?? (await readRootPackageProductName()),
        releaseDistPath,
    });
    const existenceResults = await Promise.all(
        candidates.map(async (candidate) => ({
            candidate,
            exists: await pathExists(candidate),
        }))
    );

    return existenceResults
        .filter((result) => result.exists)
        .map((result) => result.candidate);
}

/**
 * @param {{ productName?: string; releaseDistPath?: string }} [options]
 *
 * @returns {string[]}
 */
export function getPackagedElectronExecutableCandidates({
    productName = fallbackProductName,
    releaseDistPath = rootReleaseDistAbsolutePath,
} = {}) {
    const productExecutableName = productName;

    return unpackedBuildDirectoryNames.flatMap((directoryName) => {
        const directoryPath = path.join(releaseDistPath, directoryName);

        if (directoryName.startsWith("win-")) {
            return [path.join(directoryPath, `${productExecutableName}.exe`)];
        }

        if (directoryName.startsWith("linux-")) {
            return [path.join(directoryPath, productExecutableName)];
        }

        return [
            path.join(
                directoryPath,
                `${productExecutableName}.app`,
                "Contents",
                "MacOS",
                productExecutableName
            ),
        ];
    });
}

/**
 * @param {ElectronBuilderAfterPackContext} context
 *
 * @returns {string}
 */
export function getElectronBuilderAfterPackExecutablePath(context) {
    if (
        !context ||
        typeof context !== "object" ||
        typeof context.appOutDir !== "string" ||
        context.appOutDir.length === 0
    ) {
        throw new TypeError(
            "electron-builder afterPack context is missing appOutDir"
        );
    }

    const productExecutableName =
        context.packager?.appInfo?.productFilename ??
        context.packager?.appInfo?.productName ??
        fallbackProductName;
    const platform =
        context.electronPlatformName ??
        inferElectronBuilderPlatformFromAppOutDir(context.appOutDir);

    if (platform === "win32") {
        return path.join(context.appOutDir, `${productExecutableName}.exe`);
    }

    if (platform === "linux") {
        return path.join(context.appOutDir, productExecutableName);
    }

    return path.join(
        context.appOutDir,
        `${productExecutableName}.app`,
        "Contents",
        "MacOS",
        productExecutableName
    );
}

/**
 * @param {string} appOutDir
 *
 * @returns {"darwin" | "linux" | "win32"}
 */
function inferElectronBuilderPlatformFromAppOutDir(appOutDir) {
    const directoryName = path.basename(appOutDir);

    if (directoryName.startsWith("win-")) {
        return "win32";
    }

    if (directoryName.startsWith("linux-")) {
        return "linux";
    }

    return "darwin";
}

/**
 * @param {string} executablePath
 * @param {GetCurrentFuseWireImpl} getCurrentFuseWireImpl
 *
 * @returns {Promise<void>}
 */
async function assertElectronFuseState(executablePath, getCurrentFuseWireImpl) {
    const currentFuseWire = await getCurrentFuseWireImpl(executablePath);
    const mismatches = Object.entries(expectedElectronFuseStates).filter(
        ([fuseOption, expectedState]) =>
            currentFuseWire[fuseOption] !== expectedState
    );

    if (mismatches.length > 0) {
        throw new Error(
            `Electron fuse verification failed for ${executablePath}: ${mismatches
                .map(
                    ([fuseOption, expectedState]) =>
                        `${fuseOption}=${currentFuseWire[fuseOption]} expected ${expectedState}`
                )
                .join(", ")}`
        );
    }
}

/**
 * @param {unknown} parsed
 *
 * @returns {{ productName: string }}
 */
function getRootPackageShape(parsed) {
    if (
        typeof parsed !== "object" ||
        parsed === null ||
        !("productName" in parsed) ||
        typeof parsed.productName !== "string"
    ) {
        throw new TypeError(
            "Expected root package metadata to include a string productName"
        );
    }

    return { productName: parsed.productName };
}

/**
 * @param {string} targetPath
 *
 * @returns {Promise<boolean>}
 */
async function pathExists(targetPath) {
    try {
        await fs.access(targetPath);

        return true;
    } catch {
        return false;
    }
}

/**
 * @returns {Promise<string>}
 */
async function readRootPackageProductName() {
    const parsed = /** @type {unknown} */ (
        JSON.parse(await fs.readFile(path.join(repositoryRoot, "package.json")))
    );

    return getRootPackageShape(parsed).productName;
}

/**
 * @param {string} message
 *
 * @returns {void}
 */
function writeLog(message) {
    process.stdout.write(`${message}\n`);
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    await applyElectronFuses();
}
