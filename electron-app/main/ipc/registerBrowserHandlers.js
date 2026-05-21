/**
 * IPC handlers for the built-in FIT file browser tab.
 *
 * Goals:
 *
 * - Let the user pick a folder (persisted) and browse its subfolders.
 * - Only list directories and .fit files.
 * - Approve returned .fit file paths for subsequent readFile() via
 *   fileAccessPolicy.
 *
 * Security:
 *
 * - The renderer cannot set an arbitrary root path; it must come from the
 *   main-process dialog.
 * - Listing is constrained to the persisted root folder.
 */

const { approveFilePath } = require("../security/fileAccessPolicy");

/**
 * @typedef {import("electron").OpenDialogOptions} OpenDialogOptions
 *
 * @typedef {import("electron").OpenDialogReturnValue} OpenDialogReturnValue
 *
 * @typedef {{
 *     showOpenDialog: (
 *         options: OpenDialogOptions
 *     ) => Promise<OpenDialogReturnValue>;
 * }} DialogApi
 *
 * @typedef {{ isDirectory: () => boolean }} StatLike
 *
 * @typedef {{
 *     name?: unknown;
 *     isDirectory?: () => boolean;
 *     isFile?: () => boolean;
 * }} DirentLike
 *
 * @typedef {{
 *     promises?: {
 *         readdir?: (
 *             folder: string,
 *             options: { withFileTypes: true }
 *         ) => Promise<DirentLike[]>;
 *         stat?: (path: string) => Promise<StatLike>;
 *     };
 * }} FsApi
 *
 * @typedef {{
 *     isAbsolute: (path: string) => boolean;
 *     resolve: (...paths: string[]) => string;
 *     sep: string;
 * }} PathApi
 *
 * @typedef {{
 *     SETTINGS_CONFIG_NAME: string;
 * }} BrowserConstants
 *
 * @typedef {boolean | string | null} BrowserConfValue
 *
 * @typedef {{
 *     get: (key: string, fallback?: BrowserConfValue) => BrowserConfValue;
 *     set: (key: string, value: boolean | string) => void;
 * }} BrowserConfStore
 *
 * @typedef {{ Conf: new (options: { name: string }) => BrowserConfStore }} BrowserConfModule
 *
 * @typedef {(
 *     channel: string,
 *     handler: (event: unknown, ...args: unknown[]) => unknown
 * ) => void} RegisterIpcHandle
 *
 * @typedef {(
 *     level: "error" | "warn" | "info",
 *     message: string,
 *     context?: Record<string, unknown>
 * ) => void} LogWithContext
 *
 * @typedef {object} RegisterBrowserHandlersOptions
 *
 * @property {RegisterIpcHandle} registerIpcHandle
 * @property {() => DialogApi | null | undefined} dialogRef
 * @property {PathApi} path
 * @property {FsApi} fs
 * @property {BrowserConstants} CONSTANTS
 * @property {LogWithContext} [logWithContext]
 * @property {BrowserConfModule} [confModule]
 */

const CONF_KEY_ENABLED = "fitBrowser.enabled";
const CONF_KEY_ROOT_FOLDER = "fitBrowser.rootFolder";
const CONF_KEY_ROOT_FOLDER_MODE = "fitBrowser.rootFolderMode";

/**
 * @param {unknown} error
 *
 * @returns {string}
 */
function getErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}

/**
 * @param {unknown} value
 * @param {Pick<PathApi, "isAbsolute">} path
 *
 * @returns {string | null}
 */
function normalizeAbsoluteFolder(value, path) {
    const v = typeof value === "string" ? value.trim() : "";
    if (!v) return null;
    return path.isAbsolute(v) ? v : null;
}

/**
 * @param {RegisterBrowserHandlersOptions} options
 */
function registerBrowserHandlers({
    registerIpcHandle,
    dialogRef,
    fs,
    path,
    CONSTANTS,
    logWithContext,
    confModule,
}) {
    if (typeof registerIpcHandle !== "function") {
        return;
    }

    /**
     * @returns {BrowserConfStore | null}
     */
    const tryGetConf = () => {
        try {
            const { Conf } = confModule ?? require("electron-conf");
            return new Conf({ name: CONSTANTS.SETTINGS_CONFIG_NAME });
        } catch (error) {
            logWithContext?.(
                "warn",
                "Failed to initialize electron-conf for fitBrowser",
                {
                    error: getErrorMessage(error),
                }
            );
            return null;
        }
    };

    /**
     * @returns {string | null}
     */
    const readRootFolder = () => {
        const conf = tryGetConf();
        if (!conf) return null;
        return normalizeAbsoluteFolder(
            conf.get(CONF_KEY_ROOT_FOLDER, null),
            path
        );
    };

    /**
     * @returns {boolean}
     */
    const readEnabled = () => {
        const conf = tryGetConf();
        if (!conf) return true;
        const value = conf.get(CONF_KEY_ENABLED, true);
        return value === true;
    };

    /**
     * @param {string} folder
     */
    const writeRootFolder = (folder) => {
        const conf = tryGetConf();
        if (!conf) return;
        try {
            conf.set(CONF_KEY_ROOT_FOLDER, folder);
        } catch (error) {
            logWithContext?.(
                "warn",
                "Failed to persist fitBrowser root folder",
                {
                    error: getErrorMessage(error),
                }
            );
        }
    };

    /**
     * @param {"auto" | "manual"} mode
     */
    const writeRootFolderMode = (mode) => {
        const conf = tryGetConf();
        if (!conf) return;
        const normalized = mode === "manual" ? "manual" : "auto";
        try {
            conf.set(CONF_KEY_ROOT_FOLDER_MODE, normalized);
        } catch (error) {
            logWithContext?.(
                "warn",
                "Failed to persist fitBrowser root folder mode",
                {
                    error: getErrorMessage(error),
                }
            );
        }
    };

    /**
     * @param {boolean} enabled
     */
    const writeEnabled = (enabled) => {
        const conf = tryGetConf();
        if (!conf) return;
        try {
            conf.set(CONF_KEY_ENABLED, enabled === true);
        } catch (error) {
            logWithContext?.(
                "warn",
                "Failed to persist fitBrowser enabled flag",
                {
                    error: getErrorMessage(error),
                }
            );
        }
    };

    /**
     * @param {string} folder
     *
     * @returns {Promise<boolean>}
     */
    const validateAndPersistFolder = async (folder) => {
        const normalized = normalizeAbsoluteFolder(folder, path);
        if (!normalized) return false;

        const stat = fs?.promises?.stat;
        if (typeof stat !== "function") return false;

        try {
            const s = await stat(normalized);
            if (!s || typeof s.isDirectory !== "function" || !s.isDirectory()) {
                return false;
            }
            writeRootFolder(normalized);
            // Any explicit folder change is considered a manual selection.
            writeRootFolderMode("manual");
            return true;
        } catch {
            return false;
        }
    };

    registerIpcHandle("browser:isEnabled", async () => readEnabled());

    registerIpcHandle("browser:setEnabled", async (_event, enabled) => {
        writeEnabled(enabled === true);
        return readEnabled();
    });

    registerIpcHandle("browser:getFolder", async () => readRootFolder());

    registerIpcHandle("browser:setFolder", async (_event, folder) =>
        validateAndPersistFolder(typeof folder === "string" ? folder : "")
    );

    registerIpcHandle("dialog:openFolder", async () => {
        const dialog = dialogRef?.();
        if (!dialog || typeof dialog.showOpenDialog !== "function") {
            return null;
        }

        const result = await dialog.showOpenDialog({
            properties: ["openDirectory"],
            title: "Select FIT Files Folder",
        });

        if (
            !result ||
            result.canceled ||
            !Array.isArray(result.filePaths) ||
            result.filePaths.length === 0
        ) {
            return null;
        }

        const folder = normalizeAbsoluteFolder(result.filePaths[0], path);
        if (!folder) {
            return null;
        }

        await validateAndPersistFolder(folder);
        return folder;
    });

    registerIpcHandle("browser:listFolder", async (_event, relPath = "") => {
        if (!readEnabled()) {
            return { entries: [], relPath: "", root: readRootFolder() };
        }
        const root = readRootFolder();
        if (!root) {
            return { entries: [], relPath: "", root };
        }

        const abs = resolveWithinRoot(root, relPath, path);
        if (!abs) {
            return { entries: [], relPath: "", root };
        }

        const readdir = fs?.promises?.readdir;
        const stat = fs?.promises?.stat;
        if (typeof readdir !== "function" || typeof stat !== "function") {
            return { entries: [], relPath: "", root };
        }

        try {
            const s = await stat(abs);
            if (!s || typeof s.isDirectory !== "function" || !s.isDirectory()) {
                return { entries: [], relPath: "", root };
            }

            /**
             * @type {{
             *     name: string;
             *     kind: "dir" | "file";
             *     relPath: string;
             *     fullPath: string;
             * }[]}
             */
            const out = [];

            const dirents = await readdir(abs, { withFileTypes: true });
            const baseRel =
                typeof relPath === "string"
                    ? relPath.trim().replaceAll("\\", "/").replace(/^\/+/, "")
                    : "";

            for (const d of dirents) {
                const name = d && typeof d.name === "string" ? d.name : "";
                if (!name) continue;
                if (name === "." || name === "..") continue;

                const childRel = baseRel ? `${baseRel}/${name}` : name;
                const childAbs = resolveWithinRoot(root, childRel, path);
                if (!childAbs) continue;

                if (typeof d.isDirectory === "function" && d.isDirectory()) {
                    out.push({
                        fullPath: childAbs,
                        kind: "dir",
                        name,
                        relPath: childRel,
                    });
                    continue;
                }

                if (typeof d.isFile === "function" && d.isFile()) {
                    const lower = name.toLowerCase();
                    if (!lower.endsWith(".fit")) {
                        continue;
                    }

                    // Approve the file for subsequent readFile() use.
                    try {
                        approveFilePath(childAbs);
                    } catch (error) {
                        logWithContext?.(
                            "warn",
                            "Failed to approve FIT file for browser",
                            {
                                error: getErrorMessage(error),
                                filePath: childAbs,
                            }
                        );
                    }

                    out.push({
                        fullPath: childAbs,
                        kind: "file",
                        name,
                        relPath: childRel,
                    });
                }
            }

            out.sort((a, b) => {
                if (a.kind !== b.kind) {
                    return a.kind === "dir" ? -1 : 1;
                }
                return a.name.localeCompare(b.name);
            });

            // Hard cap to avoid renderer-driven perf issues.
            return { entries: out.slice(0, 500), relPath: baseRel, root };
        } catch (error) {
            logWithContext?.("warn", "Failed to list fitBrowser folder", {
                error: getErrorMessage(error),
                relPath,
                root,
            });
            return { entries: [], relPath: "", root };
        }
    });
}

/**
 * @param {string} root
 * @param {string} rel
 * @param {Pick<PathApi, "resolve" | "sep">} path
 *
 * @returns {string | null}
 */
function resolveWithinRoot(root, rel, path) {
    const safeRel = typeof rel === "string" ? rel.trim() : "";
    if (!safeRel) {
        return path.resolve(root);
    }

    // Normalize separators and remove leading slashes.
    const normalized = safeRel.replaceAll("\\", "/").replace(/^\/+/, "");
    const parts = normalized.split("/").filter((p) => p.length > 0);

    // Disallow traversal.
    if (parts.some((p) => p === "." || p === "..")) {
        return null;
    }

    const abs = path.resolve(root, ...parts);
    const rootAbs = path.resolve(root);
    const rootPrefix = rootAbs.endsWith(path.sep)
        ? rootAbs
        : `${rootAbs}${path.sep}`;

    // Must be inside root (handle root paths like '/' or 'C:\' without double separators).
    if (abs !== rootAbs && !abs.startsWith(rootPrefix)) {
        return null;
    }

    return abs;
}

module.exports = { registerBrowserHandlers };
