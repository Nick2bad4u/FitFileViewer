import pLimitCompat from "../../async/pLimitCompat.js";
import { updateShownFilesList } from "../../rendering/components/shownFilesListUpdater.js";
import {
    appendLoadedFitFile,
    getLoadedFitFiles,
    setLoadedFitFiles,
} from "../../state/domain/loadedFitFilesState.js";
import { getActiveFitRawData } from "../../state/domain/activeFitRawDataState.js";
import { LoadingOverlay } from "../../ui/components/LoadingOverlay.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import {
    loadSingleOverlayFile,
    type OverlayFitData as SingleOverlayFitData,
} from "./loadSingleOverlayFile.js";
import { getLoadOverlayFilesRuntime } from "./loadOverlayFilesRuntime.js";

/** Decoded FIT data used while managing overlay file state. */
export type OverlayFitData = SingleOverlayFitData & {
    fileName?: string;
};

/** File-like object accepted by multi-overlay loading workflows. */
export type OverlayInputFile = {
    arrayBuffer?: () => Promise<ArrayBuffer>;
    name?: string;
    originalPath?: string;
    path?: string;
    size?: number;
    webkitRelativePath?: string;
};

/** Loaded overlay entry persisted into renderer-level FIT-file state. */
export type LoadedFitFileEntry = {
    data: OverlayFitData;
    filePath: string;
    originalPath: string | null;
    sourceKey: string | null;
};

const PATH_SEPARATOR_REGEX = /[/\\]+/g;
const OVERLAY_PATH_KEYS = [
    "originalPath",
    "path",
    "webkitRelativePath",
] as const satisfies ReadonlyArray<keyof OverlayInputFile>;
const loadOverlayFilesRuntime = getLoadOverlayFilesRuntime();

/**
 * Loads FIT files as overlays.
 */
export async function loadOverlayFiles(
    files: readonly OverlayInputFile[] | null | undefined
): Promise<void> {
    if (!Array.isArray(files) || files.length === 0) {
        showNotification("No files selected", "info");
        return;
    }

    const totalFiles = files.length;
    LoadingOverlay.show(`Loading 0 / ${totalFiles} files...`);

    const existingKeys = new Set<string>();
    let stateDirty = ensureLoadedFitFilesInitialized(existingKeys);
    const initialCount = getLoadedFitFiles().length;

    const invalidFiles: string[] = [];
    const duplicateFiles: string[] = [];

    const concurrency = resolveOverlayLoadConcurrency();
    const limit = pLimitCompat(concurrency);
    const tasks: Array<Promise<void>> = [];
    let started = 0;
    let finished = 0;

    const scheduleOverlayLoad = (
        file: OverlayInputFile,
        displayName: string,
        uniqueKey: string | null
    ): Promise<void> =>
        limit(async (): Promise<void> => {
            started++;
            LoadingOverlay.show(
                `Loading ${Math.min(started, totalFiles)} / ${totalFiles} files... (x${concurrency})`,
                displayName
            );

            try {
                const result = await loadSingleOverlayFile(file);
                if (result.success) {
                    const entry = createOverlayEntry(
                        file,
                        result.data,
                        uniqueKey
                    );
                    appendLoadedFitFile(entry, "loadOverlayFiles");
                    stateDirty = true;
                } else {
                    invalidFiles.push(displayName);
                    showNotification(
                        `Failed to load ${displayName}: ${result.error || "Unknown error"}`,
                        "error"
                    );
                }
            } catch (error) {
                console.error(
                    "[loadOverlayFiles] Error loading overlay file:",
                    displayName,
                    error
                );
                invalidFiles.push(displayName);
            } finally {
                finished++;
                LoadingOverlay.show(
                    `Processing ${Math.min(finished, totalFiles)} / ${totalFiles} files... (x${concurrency})`,
                    displayName
                );
            }
        });

    try {
        for (const file of files) {
            const displayName = getFileDisplayName(file);
            const uniqueKey = getFileUniqueKey(file);
            if (uniqueKey && existingKeys.has(uniqueKey)) {
                duplicateFiles.push(displayName);
                continue;
            }

            if (uniqueKey) {
                existingKeys.add(uniqueKey);
            }

            tasks.push(scheduleOverlayLoad(file, displayName, uniqueKey));
        }

        // Wait for all overlay loads to complete.
        // Using allSettled ensures one failure doesn't abort the rest.
        await Promise.allSettled(tasks);
    } finally {
        LoadingOverlay.hide();
    }

    if (duplicateFiles.length > 0) {
        const sample = duplicateFiles.slice(0, 3).join(", ");
        const suffix =
            duplicateFiles.length > 3
                ? `, and ${duplicateFiles.length - 3} more`
                : "";
        showNotification(
            `${sample}${suffix} already loaded. Skipping duplicate files.`,
            "info"
        );
    }

    if (stateDirty) {
        // Save current tab before syncing state (which might trigger tab switches)
        const currentTabButton = loadOverlayFilesRuntime.getActiveTabButton();
        const currentTabId = currentTabButton?.id ?? "";

        syncLoadedFitFilesState();
        await refreshOverlayMap();
        updateShownFilesList();

        // Restore the original tab if it was changed
        if (currentTabButton && currentTabId) {
            const newActiveTab = loadOverlayFilesRuntime.getActiveTabButton();
            if (newActiveTab?.id !== currentTabId) {
                console.log(
                    "[loadOverlayFiles] Restoring tab to:",
                    currentTabId
                );
                currentTabButton.click();
            }
        }
    }

    const finalCount = getLoadedFitFiles().length;
    const newlyAdded = Math.max(0, finalCount - initialCount);
    const attempted = totalFiles - duplicateFiles.length;

    if (attempted === 0) {
        return;
    }

    if (invalidFiles.length === attempted) {
        showNotification(
            `Failed to load any of the ${attempted} files.`,
            "error"
        );
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

function syncLoadedFitFilesState(): void {
    try {
        setLoadedFitFiles(getLoadedFitFiles(), "loadOverlayFiles");
    } catch (error) {
        console.error(
            "[loadOverlayFiles] Failed to sync loadedFitFiles state:",
            error
        );
    }
}

async function refreshOverlayMap(): Promise<void> {
    try {
        const { renderMap } = await import("../../maps/core/renderMap.js");
        renderMap();
    } catch (error) {
        console.error(
            "[loadOverlayFiles] Failed to refresh overlay map:",
            error
        );
    }
}

function createOverlayEntry(
    file: OverlayInputFile,
    data: OverlayFitData,
    uniqueKey: string | null
): LoadedFitFileEntry {
    const originalPath =
        getFileOriginalPath(file) ||
        (typeof data?.cachedFilePath === "string" ? data.cachedFilePath : "");
    const displayName =
        getFileDisplayName(file) ||
        (originalPath ? getFileNameFromPath(originalPath) : "overlay.fit");
    if (
        originalPath &&
        (!data.cachedFilePath || data.cachedFilePath !== originalPath)
    ) {
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

function createPrimaryEntry(): LoadedFitFileEntry | null {
    const baseData = getActiveFitRawData() as OverlayFitData | null;
    if (!baseData) {
        return null;
    }

    const cachedPath =
        typeof baseData.cachedFilePath === "string"
            ? baseData.cachedFilePath
            : "";
    const displayName = cachedPath
        ? getFileNameFromPath(cachedPath)
        : baseData.fileName || "Primary activity";
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

function deriveEntryKey(entry: LoadedFitFileEntry): string | null {
    if (entry.originalPath) {
        return `path:${normalizePath(entry.originalPath)}`;
    }
    if (entry.filePath) {
        return `name:${String(entry.filePath).toLowerCase()}`;
    }
    return null;
}

function ensureLoadedFitFilesInitialized(existingKeys: Set<string>): boolean {
    let loadedFitFiles = getLoadedFitFiles() as LoadedFitFileEntry[];
    let mutated = false;
    const shouldInitializeEmptyMirror = loadedFitFiles.length === 0;

    if (loadedFitFiles.length === 0) {
        const primaryEntry = createPrimaryEntry();
        loadedFitFiles = primaryEntry ? [primaryEntry] : [];
        mutated = Boolean(primaryEntry);
    }

    for (const entry of loadedFitFiles) {
        if (
            !entry.originalPath &&
            typeof entry.data.cachedFilePath === "string"
        ) {
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

    if (mutated || shouldInitializeEmptyMirror) {
        setLoadedFitFiles(loadedFitFiles, "loadOverlayFiles.initialize");
    }

    return mutated;
}

function getFileDisplayName(file: OverlayInputFile): string {
    if (typeof file.name === "string" && file.name.trim()) {
        return file.name;
    }

    const originalPath = getFileOriginalPath(file);
    if (originalPath) {
        return getFileNameFromPath(originalPath);
    }
    return "overlay.fit";
}

function getFileNameFromPath(filePath: string): string {
    const segments = filePath.split(PATH_SEPARATOR_REGEX).filter(Boolean);
    return segments.at(-1) ?? filePath;
}

function getFileOriginalPath(file: OverlayInputFile): string {
    for (const key of OVERLAY_PATH_KEYS) {
        const value = file[key];
        if (typeof value === "string" && value.trim()) {
            return value;
        }
    }
    return "";
}

function getFileUniqueKey(file: OverlayInputFile): string | null {
    const originalPath = getFileOriginalPath(file);
    if (originalPath) {
        return `path:${normalizePath(originalPath)}`;
    }
    if (typeof file.name === "string" && file.name.trim()) {
        return `name:${file.name.trim().toLowerCase()}`;
    }
    return null;
}

function normalizePath(path: string): string {
    return path.replaceAll(PATH_SEPARATOR_REGEX, "/").toLowerCase();
}

function resolveOverlayLoadConcurrency(): number {
    const hardwareConcurrency =
        loadOverlayFilesRuntime.getHardwareConcurrency();
    if (
        typeof hardwareConcurrency === "number" &&
        Number.isFinite(hardwareConcurrency) &&
        hardwareConcurrency > 0
    ) {
        return Math.max(1, Math.min(3, Math.floor(hardwareConcurrency / 2)));
    }

    return 2;
}
