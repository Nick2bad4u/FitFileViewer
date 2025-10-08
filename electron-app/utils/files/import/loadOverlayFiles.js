import { getState, setState } from "../../state/core/stateManager.js";
import { getGlobalData } from "../../state/domain/globalDataState.js";
import { getOverlayFiles, setOverlayFiles } from "../../state/domain/overlayState.js";
import { LoadingOverlay } from "../../ui/components/LoadingOverlay.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import { loadSingleOverlayFile } from "./loadSingleOverlayFile.js";

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
    const { overlays: initialOverlays, mutated: initializedMutated } = ensureLoadedFitFilesInitialized(existingKeys);
    const overlayFiles = [...initialOverlays];
    let stateDirty = initializedMutated;
    const initialCount = overlayFiles.length;
    const previousActiveTab = getState("ui.activeTab");

    const invalidFiles = [];
    const duplicateFiles = [];

    try {
        for (const [index, file] of files.entries()) {
            const displayName = getFileDisplayName(file);
            LoadingOverlay.show(`Loading ${index + 1} / ${totalFiles} files...`, displayName);

            const uniqueKey = getFileUniqueKey(file);
            if (uniqueKey && existingKeys.has(uniqueKey)) {
                duplicateFiles.push(displayName);
                continue;
            }

            if (uniqueKey) {
                existingKeys.add(uniqueKey);
            }

            try {
                // eslint-disable-next-line no-await-in-loop
                const result = await loadSingleOverlayFile(file);
                if (result.success && result.data) {
                    const entry = createOverlayEntry(file, result.data, uniqueKey);
                    overlayFiles.push(entry);
                    stateDirty = true;
                } else {
                    invalidFiles.push(displayName);
                    showNotification(`Failed to load ${displayName}: ${result.error || "Unknown error"}`, "error");
                }
            } catch (error) {
                console.error("[loadOverlayFiles] Error loading overlay file:", displayName, error);
                invalidFiles.push(displayName);
            }
        }
    } finally {
        LoadingOverlay.hide();
    }

    if (duplicateFiles.length > 0) {
        const sample = duplicateFiles.slice(0, 3).join(", ");
        const suffix = duplicateFiles.length > 3 ? `, and ${duplicateFiles.length - 3} more` : "";
        showNotification(`${sample}${suffix} already loaded. Skipping duplicate files.`, "info");
    }

    if (stateDirty) {
        setOverlayFiles(overlayFiles, "loadOverlayFiles.commit");
        if (globalThis.renderMap) {
            globalThis.renderMap();
        }
        if (/** @type {any} */ (globalThis).updateShownFilesList) {
            /** @type {any} */ globalThis.updateShownFilesList();
        }
    }

    if (previousActiveTab) {
        try {
            const currentTab = getState("ui.activeTab");
            if (currentTab !== previousActiveTab) {
                setState("ui.activeTab", previousActiveTab, { source: "loadOverlayFiles.restoreTab" });
            }
        } catch (error) {
            console.warn("[loadOverlayFiles] Failed to restore active tab:", error);
        }
    }

    const finalCount = overlayFiles.length;
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

const PATH_SEPARATOR_REGEX = /[/\\]+/g;

function createOverlayEntry(file, data, uniqueKey) {
    const originalPath = getFileOriginalPath(file) || (typeof data?.cachedFilePath === "string" ? data.cachedFilePath : "");
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
            (originalPath ? `path:${normalizePath(originalPath)}` : displayName ? `name:${displayName.toLowerCase()}` : null),
    };
}

function createPrimaryEntry() {
    const baseData = /** @type {any} */ (getGlobalData());
    if (!baseData) {
        return null;
    }

    const cachedPath = typeof baseData.cachedFilePath === "string" ? baseData.cachedFilePath : "";
    const displayName = cachedPath ? getFileNameFromPath(cachedPath) : baseData.fileName || "Primary activity";
    const key = cachedPath ? `path:${normalizePath(cachedPath)}` : displayName ? `name:${displayName.toLowerCase()}` : null;

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
    const overlayFiles = getOverlayFiles();
    const workingEntries = overlayFiles.length > 0 ? [...overlayFiles] : [];
    const normalizedEntries = [];
    let mutated = false;

    if (workingEntries.length === 0) {
        const primaryEntry = createPrimaryEntry();
        if (primaryEntry) {
            workingEntries.push(primaryEntry);
            mutated = true;
        }
    }

    for (const rawEntry of workingEntries) {
        if (!rawEntry || typeof rawEntry !== "object") {
            continue;
        }
        const entry = { ...rawEntry };
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
            existingKeys.add(key);
            if (!entry.sourceKey) {
                entry.sourceKey = key;
                mutated = true;
            }
        }
        normalizedEntries.push(entry);
    }

    if (normalizedEntries.length !== overlayFiles.length) {
        mutated = true;
    }

    if (mutated) {
        setOverlayFiles(normalizedEntries, "loadOverlayFiles.ensureInitialized");
    }

    return { overlays: mutated ? normalizedEntries : overlayFiles, mutated };
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
