/**
 * IPC handlers for the built-in FIT file browser tab.
 *
 * Goals:
 * - Let the user pick a folder (persisted) and browse its subfolders.
 * - Only list directories and .fit files.
 * - Approve returned .fit file paths for subsequent readFile() via fileAccessPolicy.
 *
 * Security:
 * - The renderer cannot set an arbitrary root path; it must come from the main-process dialog.
 * - Listing is constrained to the persisted root folder.
 */

const { approveFilePath } = require("../security/fileAccessPolicy");

/**
 * @typedef {object} RegisterBrowserHandlersOptions
 * @property {(channel: string, handler: Function) => void} registerIpcHandle
 * @property {() => any} dialogRef
 * @property {{ join: Function, resolve: Function, sep: string, isAbsolute: Function }} path
 * @property {{ promises?: { readdir?: Function, stat?: Function }, constants?: any }} fs
 * @property {{ SETTINGS_CONFIG_NAME: string }} CONSTANTS
 * @property {(level: 'error' | 'warn' | 'info', message: string, context?: Record<string, any>) => void} logWithContext
 * @property {{ Conf: new (...args: any[]) => { get: (key: string, fallback?: any) => any, set: (key: string, value: any) => void } }} [confModule]
 */

const CONF_KEY_ENABLED = "fitBrowser.enabled";
const CONF_KEY_ROOT_FOLDER = "fitBrowser.rootFolder";
const CONF_KEY_ROOT_FOLDER_MODE = "fitBrowser.rootFolderMode";

/**
 * @param {unknown} value
 * @param {{ isAbsolute: (p: string) => boolean }} path
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
function registerBrowserHandlers({ registerIpcHandle, dialogRef, fs, path, CONSTANTS, logWithContext, confModule }) {
    if (typeof registerIpcHandle !== "function") {
        return;
    }

    /**
     * @returns {{ get: (key: string, fallback?: any) => any, set: (key: string, value: any) => void } | null}
     */
    const tryGetConf = () => {
        try {
            const { Conf } = confModule ?? require("electron-conf");
            return new Conf({ name: CONSTANTS.SETTINGS_CONFIG_NAME });
        } catch (error) {
            logWithContext?.("warn", "Failed to initialize electron-conf for fitBrowser", {
                error: /** @type {Error} */ (error)?.message,
            });
            return null;
        }
    };

    /**
     * @returns {string | null}
     */
    const readRootFolder = () => {
        const conf = tryGetConf();
        if (!conf) return null;
        return normalizeAbsoluteFolder(conf.get(CONF_KEY_ROOT_FOLDER, null), path);
    };

    /**
     * @returns {boolean}
     */
    const readEnabled = () => {
        const conf = tryGetConf();
        if (!conf) return false;
        const value = conf.get(CONF_KEY_ENABLED, false);
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
            logWithContext?.("warn", "Failed to persist fitBrowser root folder", {
                error: /** @type {Error} */ (error)?.message,
            });
        }
    };

    /**
     * @param {'auto'|'manual'} mode
     */
    const writeRootFolderMode = (mode) => {
        const conf = tryGetConf();
        if (!conf) return;
        const normalized = mode === "manual" ? "manual" : "auto";
        try {
            conf.set(CONF_KEY_ROOT_FOLDER_MODE, normalized);
        } catch (error) {
            logWithContext?.("warn", "Failed to persist fitBrowser root folder mode", {
                error: /** @type {Error} */ (error)?.message,
            });
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
            logWithContext?.("warn", "Failed to persist fitBrowser enabled flag", {
                error: /** @type {Error} */ (error)?.message,
            });
        }
    };

    /**
     * @param {string} folder
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

        if (!result || result.canceled || !Array.isArray(result.filePaths) || result.filePaths.length === 0) {
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

            /** @type {Array<{ name: string, kind: 'dir'|'file', relPath: string, fullPath: string }>} */
            const out = [];

            const dirents = await readdir(abs, { withFileTypes: true });
            const baseRel = typeof relPath === "string" ? relPath.trim().replaceAll("\\", "/").replace(/^\/+/, "") : "";

            for (const d of dirents) {
                const name = d && typeof d.name === "string" ? d.name : "";
                if (!name) continue;
                if (name === "." || name === "..") continue;

                const childRel = baseRel ? `${baseRel}/${name}` : name;
                const childAbs = resolveWithinRoot(root, childRel, path);
                if (!childAbs) continue;

                if (typeof d.isDirectory === "function" && d.isDirectory()) {
                    out.push({ fullPath: childAbs, kind: "dir", name, relPath: childRel });
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
                        logWithContext?.("warn", "Failed to approve FIT file for browser", {
                            error: /** @type {Error} */ (error)?.message,
                            filePath: childAbs,
                        });
                    }

                    out.push({ fullPath: childAbs, kind: "file", name, relPath: childRel });
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
                error: /** @type {Error} */ (error)?.message,
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
 * @param {{ resolve: (...parts: string[]) => string, sep: string }} path
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

    // Must be inside root.
    if (abs !== rootAbs && !abs.startsWith(`${rootAbs}${path.sep}`)) {
        return null;
    }

    return abs;
}

module.exports = { registerBrowserHandlers };
