import pLimitImport from "p-limit";

import { setState } from "../../state/core/stateManager.js";
import { LoadingOverlay } from "../../ui/components/LoadingOverlay.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import { loadSingleOverlayFile } from "./loadSingleOverlayFile.js";

/** @type {(concurrency: number) => <T>(fn: () => Promise<T>) => Promise<T>} */

const pLimit = /** @type {any} */ (typeof pLimitImport === "function" ? pLimitImport : pLimitImport.default);

/**
 * Loads FIT files as overlays.
 * @param {File[]} files - Array of files to load
 * @returns {Promise<void>} Resolves when all files have been processed
 */
export async function loadOverlayFiles(files) {
    if (!Array.isArray(files) || files.length === 0) {
        showNotification("No files selected", "info");
        return;
    }

    const totalFiles = files.length;
    LoadingOverlay.show(`Loading 0 / ${totalFiles} files...`);

    const existingKeys = new Set();
    let stateDirty = ensureLoadedFitFilesInitialized(existingKeys);
    const initialCount = Array.isArray(globalThis.loadedFitFiles) ? globalThis.loadedFitFiles.length : 0;

    const invalidFiles = [];
    const duplicateFiles = [];

    // Concurrency:
    // - Overlay decoding can be CPU-heavy.
    // - We still want to speed up loading when users select many files.
    // Keep a conservative default and scale modestly with hardware.
    const concurrency = (() => {
        try {
            const hc = /** @type {any} */ (globalThis).navigator?.hardwareConcurrency;
            if (typeof hc === "number" && Number.isFinite(hc) && hc > 0) {
                return Math.max(1, Math.min(3, Math.floor(hc / 2)));
            }
        } catch {
            /* ignore */
        }
        return 2;
    })();

    const limit = pLimit(concurrency);
    /** @type {Array<Promise<void>>} */
    const tasks = [];
    let started = 0;
    let finished = 0;

    try {
        for (const [index, file] of files.entries()) {
            const displayName = getFileDisplayName(file);
            const uniqueKey = getFileUniqueKey(file);
            if (uniqueKey && existingKeys.has(uniqueKey)) {
                duplicateFiles.push(displayName);
                continue;
            }

            if (uniqueKey) {
                existingKeys.add(uniqueKey);
            }

            tasks.push(
                limit(async () => {
                    started++;
                    LoadingOverlay.show(
                        `Loading ${Math.min(started, totalFiles)} / ${totalFiles} files... (x${concurrency})`,
                        displayName
                    );

                    try {
                        const result = await loadSingleOverlayFile(file);
                        if (result.success && result.data) {
                            const entry = createOverlayEntry(file, result.data, uniqueKey);
                            globalThis.loadedFitFiles.push(entry);
                            stateDirty = true;
                        } else {
                            invalidFiles.push(displayName);
                            showNotification(
                                `Failed to load ${displayName}: ${result.error || "Unknown error"}`,
                                "error"
                            );
                        }
                    } catch (error) {
                        console.error("[loadOverlayFiles] Error loading overlay file:", displayName, error);
                        invalidFiles.push(displayName);
                    } finally {
                        finished++;
                        LoadingOverlay.show(
                            `Processing ${Math.min(finished, totalFiles)} / ${totalFiles} files... (x${concurrency})`,
                            displayName
                        );
                    }
                })
            );
        }

        // Wait for all overlay loads to complete.
        // Using allSettled ensures one failure doesn't abort the rest.
        await Promise.allSettled(tasks);
    } finally {
        LoadingOverlay.hide();
    }

    if (duplicateFiles.length > 0) {
        const sample = duplicateFiles.slice(0, 3).join(", ");
        const suffix = duplicateFiles.length > 3 ? `, and ${duplicateFiles.length - 3} more` : "";
        showNotification(`${sample}${suffix} already loaded. Skipping duplicate files.`, "info");
    }

    if (stateDirty) {
        // Save current tab before syncing state (which might trigger tab switches)
        const currentTabButton = document.querySelector(".tab-button.active");
        const currentTabId = currentTabButton?.id;

        syncLoadedFitFilesState();
        if (globalThis.renderMap) {
            globalThis.renderMap();
        }
        if (/** @type {any} */ (globalThis).updateShownFilesList) {
            /** @type {any} */ globalThis.updateShownFilesList();
        }

        // Restore the original tab if it was changed
        if (currentTabId && currentTabButton instanceof HTMLElement) {
            const newActiveTab = document.querySelector(".tab-button.active");
            if (newActiveTab?.id !== currentTabId) {
                console.log("[loadOverlayFiles] Restoring tab to:", currentTabId);
                currentTabButton.click();
            }
        }
    }

    const finalCount = Array.isArray(globalThis.loadedFitFiles) ? globalThis.loadedFitFiles.length : 0;
    const newlyAdded = Math.max(0, finalCount - initialCount);
    const attempted = totalFiles - duplicateFiles.length;

    if (attempted === 0) {
        return;
    }

    if (invalidFiles.length === attempted) {
        showNotification(`Failed to load any of the ${attempted} files.`, "error");
        return;
    }

    if (invalidFiles.length > 0) {
        const message = `${newlyAdded} files loaded successfully. ${invalidFiles.length} files failed.`;
        showNotification(message, "warning");
        return;
    }

    if (newlyAdded > 0) {
        showNotification(`Successfully loaded ${newlyAdded} files`, "success");
    }
}

function syncLoadedFitFilesState() {
    try {
        const files = Array.isArray(globalThis.loadedFitFiles) ? [...globalThis.loadedFitFiles] : [];
        setState("globalData.loadedFitFiles", files, { source: "loadOverlayFiles" });
    } catch (error) {
        console.error("[loadOverlayFiles] Failed to sync loadedFitFiles state:", error);
    }
}

const PATH_SEPARATOR_REGEX = /[/\\]+/g;

function createOverlayEntry(file, data, uniqueKey) {
    const originalPath =
        getFileOriginalPath(file) || (typeof data?.cachedFilePath === "string" ? data.cachedFilePath : "");
    const displayName = getFileDisplayName(file) || (originalPath ? getFileNameFromPath(originalPath) : "overlay.fit");
    if (originalPath && (!data.cachedFilePath || data.cachedFilePath !== originalPath)) {
        data.cachedFilePath = originalPath;
    }
    return {
        data,
        filePath: displayName,
        originalPath: originalPath || null,
        sourceKey:
            uniqueKey ||
            (originalPath
                ? `path:${normalizePath(originalPath)}`
                : displayName
                  ? `name:${displayName.toLowerCase()}`
                  : null),
    };
}

function createPrimaryEntry() {
    const baseData = /** @type {any} */ (globalThis).globalData;
    if (!baseData) {
        return null;
    }

    const cachedPath = typeof baseData.cachedFilePath === "string" ? baseData.cachedFilePath : "";
    const displayName = cachedPath ? getFileNameFromPath(cachedPath) : baseData.fileName || "Primary activity";
    const key = cachedPath
        ? `path:${normalizePath(cachedPath)}`
        : displayName
          ? `name:${displayName.toLowerCase()}`
          : null;

    return {
        data: baseData,
        filePath: displayName,
        originalPath: cachedPath || null,
        sourceKey: key,
    };
}

function deriveEntryKey(entry) {
    if (entry.originalPath) {
        return `path:${normalizePath(entry.originalPath)}`;
    }
    if (entry.filePath) {
        return `name:${String(entry.filePath).toLowerCase()}`;
    }
    return null;
}

function ensureLoadedFitFilesInitialized(existingKeys) {
    let mutated = false;

    if (!Array.isArray(globalThis.loadedFitFiles) || globalThis.loadedFitFiles.length === 0) {
        const primaryEntry = createPrimaryEntry();
        globalThis.loadedFitFiles = primaryEntry ? [primaryEntry] : [];
        mutated = Boolean(primaryEntry);
    }

    if (!Array.isArray(globalThis.loadedFitFiles)) {
        globalThis.loadedFitFiles = [];
        return mutated;
    }

    for (const entry of globalThis.loadedFitFiles) {
        if (!entry || typeof entry !== "object") {
            continue;
        }
        if (!entry.originalPath && entry.data && typeof entry.data.cachedFilePath === "string") {
            entry.originalPath = entry.data.cachedFilePath;
            mutated = true;
        }
        if (!entry.filePath && entry.originalPath) {
            entry.filePath = getFileNameFromPath(entry.originalPath);
            mutated = true;
        }
        const key = entry.sourceKey || deriveEntryKey(entry);
        if (key) {
            if (!entry.sourceKey) {
                entry.sourceKey = key;
                mutated = true;
            }
            existingKeys.add(key);
        }
    }

    return mutated;
}

function getFileDisplayName(file) {
    if (file && typeof file.name === "string" && file.name.trim()) {
        return file.name;
    }
    const originalPath = getFileOriginalPath(file);
    if (originalPath) {
        return getFileNameFromPath(originalPath);
    }
    return "overlay.fit";
}

function getFileNameFromPath(filePath) {
    if (typeof filePath !== "string") {
        return "";
    }
    const segments = filePath.split(PATH_SEPARATOR_REGEX).filter(Boolean);
    return segments.length ? segments.at(-1) || "" : filePath;
}

function getFileOriginalPath(file) {
    if (!file || typeof file !== "object") {
        return "";
    }
    const candidates = ["originalPath", "path", "webkitRelativePath"];
    for (const prop of candidates) {
        const value = /** @type {any} */ (file)[prop];
        if (typeof value === "string" && value.trim()) {
            return value;
        }
    }
    return "";
}

function getFileUniqueKey(file) {
    const originalPath = getFileOriginalPath(file);
    if (originalPath) {
        return `path:${normalizePath(originalPath)}`;
    }
    if (file && typeof file.name === "string" && file.name.trim()) {
        return `name:${file.name.trim().toLowerCase()}`;
    }
    return null;
}

function normalizePath(path) {
    return String(path).replaceAll(PATH_SEPARATOR_REGEX, "/").toLowerCase();
}
