"use strict";
{
    const { approveFilePath } = require("../security/fileAccessPolicy");
    const CONF_KEY_ENABLED = "fitBrowser.enabled";
    const CONF_KEY_ROOT_FOLDER = "fitBrowser.rootFolder";
    const CONF_KEY_ROOT_FOLDER_MODE = "fitBrowser.rootFolderMode";
    const getErrorMessage = (error) =>
        error instanceof Error ? error.message : String(error);
    function normalizeAbsoluteFolder(value, path) {
        const v = typeof value === "string" ? value.trim() : "";
        if (!v) {
            return null;
        }
        return path.isAbsolute(v) ? v : null;
    }
    /**
     * IPC handlers for the built-in FIT file browser tab.
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
        const readRootFolder = () => {
            const conf = tryGetConf();
            if (!conf) {
                return null;
            }
            return normalizeAbsoluteFolder(
                conf.get(CONF_KEY_ROOT_FOLDER, null),
                path
            );
        };
        const readEnabled = () => {
            const conf = tryGetConf();
            if (!conf) {
                return true;
            }
            const value = conf.get(CONF_KEY_ENABLED, true);
            return value === true;
        };
        const writeRootFolder = (folder) => {
            const conf = tryGetConf();
            if (!conf) {
                return;
            }
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
        const writeRootFolderMode = (mode) => {
            const conf = tryGetConf();
            if (!conf) {
                return;
            }
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
        const writeEnabled = (enabled) => {
            const conf = tryGetConf();
            if (!conf) {
                return;
            }
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
        const validateAndPersistFolder = async (folder) => {
            const normalized = normalizeAbsoluteFolder(folder, path);
            if (!normalized) {
                return false;
            }
            const stat = fs?.promises?.stat;
            if (typeof stat !== "function") {
                return false;
            }
            try {
                const s = await stat(normalized);
                if (
                    !s ||
                    typeof s.isDirectory !== "function" ||
                    !s.isDirectory()
                ) {
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
            const requestedEnabled = enabled === true;
            writeEnabled(requestedEnabled);
            return readEnabled();
        });
        registerIpcHandle("browser:getFolder", async () => readRootFolder());
        registerIpcHandle("browser:setFolder", async (_event, folder) => {
            const folderPath = typeof folder === "string" ? folder : "";
            return validateAndPersistFolder(folderPath);
        });
        registerIpcHandle("dialog:openFolder", async () => {
            const dialog = typeof dialogRef === "function" ? dialogRef() : null;
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
        registerIpcHandle(
            "browser:listFolder",
            async (_event, relPath = "") => {
                if (!readEnabled()) {
                    return { entries: [], relPath: "", root: readRootFolder() };
                }
                const root = readRootFolder();
                if (!root) {
                    return { entries: [], relPath: "", root };
                }
                const listRelPath = typeof relPath === "string" ? relPath : "";
                const abs = resolveWithinRoot(root, listRelPath, path);
                if (!abs) {
                    return { entries: [], relPath: "", root };
                }
                const readdir = fs?.promises?.readdir;
                const stat = fs?.promises?.stat;
                if (
                    typeof readdir !== "function" ||
                    typeof stat !== "function"
                ) {
                    return { entries: [], relPath: "", root };
                }
                try {
                    const s = await stat(abs);
                    if (
                        !s ||
                        typeof s.isDirectory !== "function" ||
                        !s.isDirectory()
                    ) {
                        return { entries: [], relPath: "", root };
                    }
                    const out = [];
                    const dirents = await readdir(abs, { withFileTypes: true });
                    const baseRel = listRelPath
                        .trim()
                        .replaceAll("\\", "/")
                        .replace(/^\/+/, "");
                    for (const d of dirents) {
                        const name =
                            d && typeof d.name === "string" ? d.name : "";
                        if (!name || name === "." || name === "..") {
                            continue;
                        }
                        const childRel = baseRel ? `${baseRel}/${name}` : name;
                        const childAbs = resolveWithinRoot(
                            root,
                            childRel,
                            path
                        );
                        if (!childAbs) {
                            continue;
                        }
                        if (
                            typeof d.isDirectory === "function" &&
                            d.isDirectory()
                        ) {
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
                    return {
                        entries: out.slice(0, 500),
                        relPath: baseRel,
                        root,
                    };
                } catch (error) {
                    logWithContext?.(
                        "warn",
                        "Failed to list fitBrowser folder",
                        {
                            error: getErrorMessage(error),
                            relPath,
                            root,
                        }
                    );
                    return { entries: [], relPath: "", root };
                }
            }
        );
    }
    function resolveWithinRoot(root, rel, path) {
        const safeRel = typeof rel === "string" ? rel.trim() : "";
        if (!safeRel) {
            return path.resolve(root);
        }
        const normalized = safeRel.replaceAll("\\", "/").replace(/^\/+/, "");
        const parts = normalized.split("/").filter((p) => p.length > 0);
        if (parts.some((p) => p === "." || p === "..")) {
            return null;
        }
        const abs = path.resolve(root, ...parts);
        const rootAbs = path.resolve(root);
        const rootPrefix = rootAbs.endsWith(path.sep)
            ? rootAbs
            : `${rootAbs}${path.sep}`;
        if (abs !== rootAbs && !abs.startsWith(rootPrefix)) {
            return null;
        }
        return abs;
    }
    module.exports = { registerBrowserHandlers };
}
