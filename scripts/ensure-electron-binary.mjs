import { downloadArtifact } from "@electron/get";
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import yauzl from "yauzl";

const electronPackagePath = fileURLToPath(
    import.meta.resolve("electron/package.json")
);
const electronPackageDirectory = path.dirname(electronPackagePath);
const electronPackage = await readElectronPackage(electronPackagePath);
const platformPath = getElectronPlatformPath();
const electronDistPath = path.join(electronPackageDirectory, "dist");
const electronPathFile = path.join(electronPackageDirectory, "path.txt");
const electronInstallerEnvironment = process.env;

export async function ensureElectronBinary() {
    if (await isElectronBinaryReady()) {
        return;
    }

    await runElectronInstaller();
    if (await isElectronBinaryReady()) {
        return;
    }

    await extractElectronArchive();
    if (!(await isElectronBinaryReady())) {
        throw new Error("Electron binary is not available after preparation");
    }
}

async function extractElectronArchive() {
    const archivePath = await downloadArtifact({
        arch:
            electronInstallerEnvironment.ELECTRON_INSTALL_ARCH ?? process.arch,
        artifactName: "electron",
        cacheRoot: electronInstallerEnvironment.electron_config_cache,
        force: electronInstallerEnvironment.force_no_cache === "true",
        platform:
            electronInstallerEnvironment.ELECTRON_INSTALL_PLATFORM ??
            os.platform(),
        version: electronPackage.version,
    });

    await fs.rm(electronDistPath, { force: true, recursive: true });
    await fs.mkdir(electronDistPath, { recursive: true });
    await runExtractionCommand(archivePath);
    await fs.writeFile(electronPathFile, platformPath);
}

async function runExtractionCommand(archivePath) {
    if (path.extname(archivePath).toLowerCase() === ".zip") {
        await runZipExtractionCommand(archivePath);
        return;
    }

    await runCommand(
        "tar",
        [
            "-xf",
            archivePath,
            "-C",
            electronDistPath,
        ],
        {
            cwd: process.cwd(),
        }
    );
}

async function runZipExtractionCommand(archivePath) {
    await extractZipArchive(archivePath, electronDistPath);
}

/**
 * @param {string} archivePath
 * @param {string} destinationPath
 */
export async function extractZipArchive(archivePath, destinationPath) {
    await fs.mkdir(destinationPath, { recursive: true });
    const canonicalDestinationPath = await fs.realpath(destinationPath);
    const zipFile = await yauzl.openPromise(archivePath, {
        strictFileNames: true,
    });
    const symlinkPaths = [];

    for await (const entry of zipFile.eachEntry()) {
        if (entry.fileName.startsWith("__MACOSX/")) {
            continue;
        }

        const destinationEntryPath = resolveArchiveEntryPath(
            canonicalDestinationPath,
            entry.fileName
        );
        const mode = Math.floor(entry.externalFileAttributes / 65_536) % 65_536;
        const entryType = mode - (mode % 4096);
        const isSymlink = entryType === 40_960;
        const isDirectory =
            entryType === 16_384 ||
            entry.fileName.endsWith("/") ||
            (Math.floor(entry.versionMadeBy / 256) === 0 &&
                entry.externalFileAttributes === 16);

        if (isDirectory) {
            await fs.mkdir(destinationEntryPath, {
                mode: getExtractedMode(mode, true),
                recursive: true,
            });
            continue;
        }

        const parentPath = path.dirname(destinationEntryPath);
        await fs.mkdir(parentPath, { recursive: true });
        assertPathWithinDirectory(
            await fs.realpath(parentPath),
            canonicalDestinationPath,
            entry.fileName
        );

        const readStream = await zipFile.openReadStreamPromise(entry);
        if (isSymlink) {
            const symlinkTarget = await readStreamAsString(readStream);
            assertSafeSymlinkTarget(
                symlinkTarget,
                destinationEntryPath,
                canonicalDestinationPath,
                entry.fileName
            );
            await fs.symlink(symlinkTarget, destinationEntryPath);
            symlinkPaths.push(destinationEntryPath);
            continue;
        }

        await pipeline(
            readStream,
            createWriteStream(destinationEntryPath, {
                flags: "wx",
                mode: getExtractedMode(mode, false),
            })
        );
    }

    for (const symlinkPath of symlinkPaths) {
        assertPathWithinDirectory(
            await fs.realpath(symlinkPath),
            canonicalDestinationPath,
            path.relative(canonicalDestinationPath, symlinkPath)
        );
    }
}

function assertPathWithinDirectory(candidatePath, directoryPath, entryName) {
    const relativePath = path.relative(directoryPath, candidatePath);
    if (
        relativePath === ".." ||
        relativePath.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relativePath)
    ) {
        throw new Error(
            `Archive entry escapes the extraction directory: ${entryName}`
        );
    }
}

function assertSafeSymlinkTarget(
    symlinkTarget,
    symlinkPath,
    directoryPath,
    entryName
) {
    if (!symlinkTarget || path.isAbsolute(symlinkTarget)) {
        throw new Error(`Archive contains an unsafe symlink: ${entryName}`);
    }

    const resolvedTarget = path.resolve(
        path.dirname(symlinkPath),
        symlinkTarget
    );
    assertPathWithinDirectory(resolvedTarget, directoryPath, entryName);
}

function getExtractedMode(entryMode, isDirectory) {
    return (entryMode || (isDirectory ? 0o755 : 0o644)) % 512;
}

async function readStreamAsString(readStream) {
    const chunks = [];
    for await (const chunk of readStream) {
        chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks).toString("utf8");
}

function resolveArchiveEntryPath(directoryPath, entryName) {
    const entryPath = path.resolve(
        directoryPath,
        ...entryName.split("/").filter(Boolean)
    );
    assertPathWithinDirectory(entryPath, directoryPath, entryName);

    return entryPath;
}

function getElectronPlatformPath() {
    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check -- Unsupported Electron platforms should fail loudly.
    switch (os.platform()) {
        case "darwin": {
            return "Electron.app/Contents/MacOS/Electron";
        }
        case "freebsd":
        case "linux":
        case "openbsd": {
            return "electron";
        }
        case "win32": {
            return "electron.exe";
        }
        default: {
            throw new Error(
                `Electron builds are not available on ${os.platform()}`
            );
        }
    }
}

async function isElectronBinaryReady() {
    try {
        const configuredPath = await fs.readFile(electronPathFile, "utf8");
        const versionPath = path.join(electronDistPath, "version");
        const versionContent = await fs.readFile(versionPath, "utf8");
        const installedVersion = versionContent.trim().replace(/^v/v, "");

        return (
            configuredPath === platformPath &&
            installedVersion === electronPackage.version &&
            (await pathExists(path.join(electronDistPath, platformPath)))
        );
    } catch {
        return false;
    }
}

/**
 * @param {string} content
 *
 * @returns {Record<string, unknown>}
 */
function parseJsonObject(content) {
    const parsed = /** @type {unknown} */ (JSON.parse(content));
    if (typeof parsed !== "object" || parsed === null) {
        throw new Error("Expected Electron package metadata to be an object");
    }

    return /** @type {Record<string, unknown>} */ (parsed);
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
 * @param {string} packagePath
 *
 * @returns {Promise<{ version: string }>}
 */
async function readElectronPackage(packagePath) {
    const parsed = parseJsonObject(await fs.readFile(packagePath, "utf8"));
    if (!("version" in parsed) || typeof parsed.version !== "string") {
        throw new TypeError(
            "Expected Electron package metadata to include a string version"
        );
    }

    return { version: parsed.version };
}

/**
 * @param {string} command
 * @param {readonly string[]} args
 * @param {import("node:child_process").SpawnOptions} [options]
 *
 * @returns {Promise<void>}
 */
async function runCommand(command, args, options = {}) {
    await new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            ...options,
            stdio: "inherit",
        });

        function removeListeners() {
            child.removeListener("error", onError);
            child.removeListener("close", onClose);
        }

        /**
         * @param {unknown} error
         */
        function onError(error) {
            removeListeners();
            reject(
                error instanceof Error
                    ? error
                    : new Error(`Unable to run ${command}`)
            );
        }

        /**
         * @param {number | null} code
         */
        function onClose(code) {
            removeListeners();
            if (code === 0) {
                resolve();

                return;
            }

            reject(
                new Error(`${command} exited with status ${String(code ?? 1)}`)
            );
        }

        child.on("error", onError);
        child.on("close", onClose);
    });
}

async function runElectronInstaller() {
    const installerPath = path.join(electronPackageDirectory, "install.js");
    if (!(await pathExists(installerPath))) {
        return;
    }

    await runCommand(process.execPath, [installerPath], {
        cwd: electronPackageDirectory,
        env: electronInstallerEnvironment,
    });
}

if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    await ensureElectronBinary();
}
