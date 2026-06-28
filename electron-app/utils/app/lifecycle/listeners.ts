import { serializeTableToCSV } from "../../files/export/copyTableAsCSV.js";
import {
    buildGpxFromRecords,
    resolveTrackNameFromFileIdentity,
    resolveTrackNameFromLoadedFiles,
    type GpxRecord,
} from "../../files/export/gpxExport.js";
import {
    getFitMessagesSessionCount,
    getFitParseErrorMessage,
    unwrapFitParseMessages,
} from "../../files/import/fitParsePayload.js";
import { sendFitFileToAltFitReader } from "../../files/import/sendFitFileToAltFitReader.js";
import {
    buildDownloadFilename,
    sanitizeFileExtension,
} from "../../files/sanitizeFilename.js";
import {
    getProcessEnvironmentValue,
    isDevelopmentEnvironment,
} from "../../runtime/processEnvironment.js";
import {
    getRendererElectronApi,
    type RendererElectronApiScope,
} from "../../runtime/electronApiRuntime.js";
import { renderDecodedFitData } from "../../rendering/core/renderDecodedFitData.js";
import { getActiveFitFileMetadata } from "../../state/domain/activeFitFileMetadataState.js";
import { getActiveFitActivityData } from "../../state/domain/fitActivityDataState.js";
import { getLoadedFitFiles } from "../../state/domain/loadedFitFilesState.js";
import type {
    ElectronFileApi,
    ElectronMenuEventApi,
    ElectronPreloadEventApi,
} from "../../../shared/preloadApi.js";
import { querySelectorByIdFlexible } from "../../ui/dom/elementIdUtils.js";
import {
    clearLifecycleListenerCleanup,
    getLifecycleListenerCleanup,
    runLifecycleListenerCleanup,
    setLifecycleListenerCleanup,
} from "./lifecycleListenerCleanupRegistry.js";
import {
    getLifecycleListenersRuntime,
    type LifecycleListenersRuntime,
    type LifecycleListenersTimer,
} from "./listenersRuntime.js";
import { registerChartResizeListener } from "./listenersResize.js";
import { registerMenuIpcListeners } from "./menuIpcListeners.js";
import { attachRecentFilesContextMenu } from "./recentFilesContextMenu.js";

type ExportDownloadOptions = {
    defaultExtension: string;
    fallbackBase: string;
};

type RegisterCleanupTimer = (
    callback: () => void,
    delayMs: number
) => LifecycleListenersTimer;

type ExportDownloadDependencies = {
    lifecycleRuntime: LifecycleListenersRuntime;
    registerCleanupTimer: RegisterCleanupTimer;
    safePath: string;
};

type DecoderReloadDependencies = {
    electronApiScope?: RendererElectronApiScope | undefined;
    electronAPI: LifecycleElectronAPI;
    setLoading: (loading: boolean) => void;
    showNotification: ShowNotification;
};

type ExportFileDependencies = {
    lifecycleRuntime: LifecycleListenersRuntime;
    registerCleanupTimer: RegisterCleanupTimer;
    showNotification: ShowNotification;
};

type NamedLifecycleIpcDependencies = {
    electronApiScope?: RendererElectronApiScope | undefined;
    electronAPI: LifecycleElectronAPI;
    isTestEnvironment: boolean;
    lifecycleRuntime: LifecycleListenersRuntime;
    registerCleanupTimer: RegisterCleanupTimer;
    setLoading: (loading: boolean) => void;
    showAboutModal: SetupListenersOptions["showAboutModal"];
    showNotification: ShowNotification;
    trackUnsubscribe: TrackUnsubscribe;
};

type UpdateProgress = {
    percent?: unknown;
};

type RecentFileCandidate = unknown;

type FitData = {
    cachedFilePath?: string;
    recordMesgs?: GpxRecord[];
    sessions?: unknown[];
    [key: string]: unknown;
};

type TrackUnsubscribe = (maybeUnsubscribe: unknown) => void;

type LifecycleElectronAPI = {
    readonly addRecentFile?: ElectronFileApi["addRecentFile"];
    readonly checkForUpdates?: ElectronMenuEventApi["checkForUpdates"];
    readonly onDecoderOptionsChanged?: ElectronMenuEventApi["onDecoderOptionsChanged"];
    readonly onExportFile?: ElectronMenuEventApi["onExportFile"];
    readonly onMenuCheckForUpdates?: ElectronMenuEventApi["onMenuCheckForUpdates"];
    readonly onMenuOpenFile?: ElectronMenuEventApi["onMenuOpenFile"];
    readonly onMenuPrint?: ElectronMenuEventApi["onMenuPrint"];
    readonly onOpenRecentFile?: ElectronMenuEventApi["onOpenRecentFile"];
    readonly onSetFontSize?: ElectronMenuEventApi["onSetFontSize"];
    readonly onSetHighContrast?: ElectronMenuEventApi["onSetHighContrast"];
    readonly onShowNotification?: ElectronMenuEventApi["onShowNotification"];
    readonly onUpdateEvent?: ElectronPreloadEventApi["onUpdateEvent"];
    readonly parseFitFile?: ElectronFileApi["parseFitFile"];
    readonly readFile?: ElectronFileApi["readFile"];
};

/** Mutable flag shared with the file-opening workflow. */
export type FileOpeningStateRef = {
    value?: boolean;
};

type ShowNotification = (
    message: string,
    type?: string,
    duration?: number
) => void;

type HandleOpenFileOptions = {
    isOpeningFileRef: FileOpeningStateRef;
    openFileBtn: HTMLButtonElement;
    setLoading: (loading: boolean) => void;
    showNotification: ShowNotification;
};

type HandleOpenFileRuntimeOptions = {
    electronApiScope?: RendererElectronApiScope | undefined;
};

/** Parameters required to wire renderer DOM and IPC listeners. */
export type SetupListenersOptions = {
    electronApiScope?: RendererElectronApiScope | undefined;
    handleOpenFile: (
        options: HandleOpenFileOptions,
        runtimeOptions?: HandleOpenFileRuntimeOptions
    ) => unknown;
    isOpeningFileRef: FileOpeningStateRef;
    openFileBtn?: HTMLButtonElement | null;
    setLoading: (loading: boolean) => void;
    showAboutModal: (html?: string) => unknown;
    showNotification: ShowNotification;
    showUpdateNotification: (
        message: string,
        typeOrDuration?: string | number,
        durationOrMode?: number | string,
        mode?: string
    ) => unknown;
};

const FONT_SIZE_BODY_CLASSES = [
    "font-xsmall",
    "font-small",
    "font-medium",
    "font-large",
    "font-xlarge",
] as const;

const HIGH_CONTRAST_BODY_CLASSES = [
    "high-contrast",
    "high-contrast-white",
    "high-contrast-yellow",
] as const;

function hasOptionalLifecycleElectronFunction(value: unknown): boolean {
    return value === undefined || typeof value === "function";
}

function isLifecycleElectronAPI(value: unknown): value is LifecycleElectronAPI {
    if (value === null || typeof value !== "object") {
        return false;
    }

    const api = value as LifecycleElectronAPI;
    return (
        hasOptionalLifecycleElectronFunction(api.addRecentFile) &&
        hasOptionalLifecycleElectronFunction(api.checkForUpdates) &&
        hasOptionalLifecycleElectronFunction(api.onDecoderOptionsChanged) &&
        hasOptionalLifecycleElectronFunction(api.onExportFile) &&
        hasOptionalLifecycleElectronFunction(api.onMenuCheckForUpdates) &&
        hasOptionalLifecycleElectronFunction(api.onMenuOpenFile) &&
        hasOptionalLifecycleElectronFunction(api.onMenuPrint) &&
        hasOptionalLifecycleElectronFunction(api.onOpenRecentFile) &&
        hasOptionalLifecycleElectronFunction(api.onSetFontSize) &&
        hasOptionalLifecycleElectronFunction(api.onSetHighContrast) &&
        hasOptionalLifecycleElectronFunction(api.onShowNotification) &&
        hasOptionalLifecycleElectronFunction(api.onUpdateEvent) &&
        hasOptionalLifecycleElectronFunction(api.parseFitFile) &&
        hasOptionalLifecycleElectronFunction(api.readFile)
    );
}

function getLifecycleElectronAPI(
    electronApiScope: RendererElectronApiScope | undefined
): LifecycleElectronAPI | null {
    return getRendererElectronApi(isLifecycleElectronAPI, electronApiScope);
}

function getHighContrastBodyClass(mode: string): string | undefined {
    switch (mode) {
        case "black": {
            return "high-contrast";
        }
        case "white": {
            return "high-contrast-white";
        }
        case "yellow": {
            return "high-contrast-yellow";
        }
        default: {
            return undefined;
        }
    }
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function isMissingFileError(error: unknown): boolean {
    return /\bENOENT\b/u.test(getErrorMessage(error));
}

function getRecentOpenErrorMessage(error: unknown): string {
    if (isMissingFileError(error)) {
        return "File not found. It may have been moved, deleted, or opened from an old recent-file entry.";
    }

    return getErrorMessage(error);
}

function getRecentFilePath(filePath: RecentFileCandidate): string | null {
    const candidate = Array.isArray(filePath)
        ? (filePath as readonly unknown[])[0]
        : filePath;

    return typeof candidate === "string" && candidate.length > 0
        ? candidate
        : null;
}

function downloadBlob(
    blob: Blob,
    {
        lifecycleRuntime,
        registerCleanupTimer,
        safePath,
    }: ExportDownloadDependencies,
    options: ExportDownloadOptions
): void {
    const anchor = lifecycleRuntime.createDownloadAnchor();
    anchor.href = lifecycleRuntime.createObjectURL(blob);
    anchor.download = buildDownloadFilename(safePath, options);
    lifecycleRuntime.appendToBody(anchor);
    anchor.click();
    registerCleanupTimer(() => {
        lifecycleRuntime.revokeObjectURL(anchor.href);
        anchor.remove();
    }, 100);
}

function exportCsvFile(
    data: FitData,
    dependencies: ExportDownloadDependencies
): void {
    const container = querySelectorByIdFlexible(document, "#content_summary");
    if (!container) {
        return;
    }

    const csvRows = getCsvExportRows(container, data);
    if (csvRows.length === 0) {
        return;
    }

    const csv = serializeTableToCSV(csvRows);
    downloadBlob(new Blob([csv], { type: "text/csv" }), dependencies, {
        defaultExtension: "csv",
        fallbackBase: "export",
    });
}

function getCsvExportRows(container: Element, data: FitData): unknown[] {
    const table = container.querySelector("table");
    if (table) {
        const tableRows = getHtmlTableRows(table);
        if (tableRows.length > 0) {
            return tableRows;
        }
    }

    return Array.isArray(data.recordMesgs) ? data.recordMesgs : [];
}

function getHtmlTableRows(table: HTMLTableElement): Record<string, unknown>[] {
    const allRows = [...table.querySelectorAll("tr")];
    if (allRows.length === 0) {
        return [];
    }

    const headerRow = allRows[0];
    if (!headerRow) {
        return [];
    }

    const headerCells = [...headerRow.children];
    const headers = headerCells.map((cell, index) => {
        const text = cell.textContent?.trim();
        return text && text.length > 0 ? text : `column_${index + 1}`;
    });

    return allRows.slice(1).map((row) => {
        const values: Record<string, unknown> = {};
        const cells = [...row.children];
        for (const [index, header] of headers.entries()) {
            values[header] = cells[index]?.textContent?.trim() ?? "";
        }
        return values;
    });
}

function exportGpxFile(
    data: FitData,
    dependencies: ExportDownloadDependencies,
    showNotification: ShowNotification
): void {
    const records = Array.isArray(data.recordMesgs) ? data.recordMesgs : null;
    if (!records || records.length === 0) {
        showNotification("No data available for GPX export.", "info", 3000);
        return;
    }

    const fallbackTrackName = resolveTrackNameFromFileIdentity(
        getActiveFitFileMetadata({ sourceData: data }).storageIdentity
    );
    const trackName = resolveTrackNameFromLoadedFiles(
        getLoadedFitFiles(),
        fallbackTrackName
    );
    const gpx = buildGpxFromRecords(records, { trackName });
    if (!gpx) {
        showNotification(
            "No valid coordinates found for GPX export.",
            "info",
            3000
        );
        return;
    }

    downloadBlob(
        new Blob([gpx], {
            type: "application/gpx+xml;charset=utf-8",
        }),
        dependencies,
        {
            defaultExtension: "gpx",
            fallbackBase: trackName || "export",
        }
    );
}

function handleExportFileRequest(
    filePath: unknown,
    {
        lifecycleRuntime,
        registerCleanupTimer,
        showNotification,
    }: ExportFileDependencies
): void {
    const data = getManagedFitData();
    if (!data) {
        return;
    }

    const safePath = typeof filePath === "string" ? filePath : "";
    const ext = sanitizeFileExtension(safePath.split(".").pop() ?? "");
    const downloadDependencies = {
        lifecycleRuntime,
        registerCleanupTimer,
        safePath,
    };

    if (ext === "csv") {
        exportCsvFile(data, downloadDependencies);
    } else if (ext === "gpx") {
        exportGpxFile(data, downloadDependencies, showNotification);
    }
}

async function reloadCachedFitFileAfterDecoderOptionsChange({
    electronApiScope,
    electronAPI,
    setLoading,
    showNotification,
}: DecoderReloadDependencies): Promise<void> {
    const filePath = getManagedFitData()?.cachedFilePath;
    if (!filePath) {
        return;
    }

    setLoading(true);
    try {
        if (
            typeof electronAPI.readFile !== "function" ||
            typeof electronAPI.parseFitFile !== "function"
        ) {
            showNotification("File reload APIs are unavailable.", "error");
            return;
        }

        const arrayBuffer = await electronAPI.readFile(filePath);
        const result = await electronAPI.parseFitFile(arrayBuffer);
        const parseErrorMessage = getFitParseErrorMessage(result);
        if (parseErrorMessage) {
            showNotification(`Error: ${parseErrorMessage.display}`, "error");
            return;
        }

        await renderDecodedFitData(unwrapFitParseMessages(result), filePath, {
            electronApiScope,
        });
    } catch (error) {
        showNotification(`Error reloading file: ${String(error)}`, "error");
    } finally {
        setLoading(false);
    }
}

function getManagedFitData(): FitData | null {
    const data = getActiveFitActivityData().rawData;
    return data !== null && typeof data === "object" ? data : null;
}

function getUpdateDownloadPercent(progress: unknown): number | null {
    if (
        typeof progress === "object" &&
        progress !== null &&
        "percent" in progress
    ) {
        const updateProgress = progress as UpdateProgress;
        return typeof updateProgress.percent === "number"
            ? updateProgress.percent
            : null;
    }

    return null;
}

function registerUpdateEventListeners(
    electronAPI: LifecycleElectronAPI,
    showUpdateNotification: SetupListenersOptions["showUpdateNotification"]
): void {
    if (!electronAPI.onUpdateEvent) {
        return;
    }

    electronAPI.onUpdateEvent("update-checking", () => {
        showUpdateNotification("Checking for updates...", "info", 3000);
    });
    electronAPI.onUpdateEvent("update-available", () => {
        showUpdateNotification("Update available! Downloading...", 4000);
    });
    electronAPI.onUpdateEvent("update-not-available", () => {
        showUpdateNotification(
            "You are using the latest version.",
            "success",
            4000
        );
    });
    electronAPI.onUpdateEvent("update-error", (error: unknown) => {
        showUpdateNotification(`Update error: ${String(error)}`, "error", 7000);
    });
    electronAPI.onUpdateEvent(
        "update-download-progress",
        (progress: unknown) => {
            const percent = getUpdateDownloadPercent(progress);

            if (percent === null) {
                showUpdateNotification(
                    "Downloading update: progress information unavailable.",
                    "info",
                    2000
                );
            } else {
                showUpdateNotification(
                    `Downloading update: ${Math.round(percent)}%`,
                    "info",
                    2000
                );
            }
        }
    );
    electronAPI.onUpdateEvent("update-downloaded", () => {
        showUpdateNotification(
            "Update downloaded! Restart to install the update now, or choose Later to finish your work.",
            "success",
            0,
            "update-downloaded"
        );
    });
}

function registerNamedLifecycleIpcListeners({
    electronApiScope,
    electronAPI,
    isTestEnvironment,
    lifecycleRuntime,
    registerCleanupTimer,
    setLoading,
    showAboutModal,
    showNotification,
    trackUnsubscribe,
}: NamedLifecycleIpcDependencies): void {
    const debugMenuEnabled =
        getProcessEnvironmentValue("FFV_DEBUG_MENU") === "1" ||
        isDevelopmentEnvironment();
    const debugMenuLog = (...args: unknown[]) => {
        if (!debugMenuEnabled) return;
        try {
            console.log(...args);
        } catch {
            /* ignore */
        }
    };

    trackUnsubscribe(
        electronAPI.onDecoderOptionsChanged?.(() => {
            showNotification("Decoder options updated.", "info", 2000);
            void reloadCachedFitFileAfterDecoderOptionsChange({
                electronApiScope,
                electronAPI,
                setLoading,
                showNotification,
            });
        })
    );
    trackUnsubscribe(
        electronAPI.onExportFile?.((filePath: unknown) => {
            handleExportFileRequest(filePath, {
                lifecycleRuntime,
                registerCleanupTimer,
                showNotification,
            });
        })
    );
    trackUnsubscribe(
        electronAPI.onShowNotification?.((msg: unknown, type: unknown) => {
            if (
                typeof showNotification === "function" &&
                typeof msg === "string" &&
                msg.trim().length > 0
            ) {
                showNotification(
                    msg,
                    typeof type === "string" && type ? type : "info",
                    3000
                );
            }
        })
    );
    trackUnsubscribe(
        electronAPI.onMenuPrint?.(() => {
            lifecycleRuntime.print();
        })
    );
    trackUnsubscribe(
        electronAPI.onMenuCheckForUpdates?.(() => {
            electronAPI.checkForUpdates?.();
        })
    );
    registerMenuIpcListeners({
        debugMenuLog,
        electronApiScope,
        isTestEnvironment,
        showAboutModal,
        showNotification,
        trackUnsubscribe,
    });
}

/**
 * Sets up all event listeners for the FitFileViewer application UI and IPC.
 *
 * @param options - Listener dependencies supplied by the renderer bootstrap.
 */
export function setupListeners({
    electronApiScope,
    handleOpenFile,
    isOpeningFileRef,
    openFileBtn,
    setLoading,
    showAboutModal,
    showNotification,
    showUpdateNotification,
}: SetupListenersOptions): void {
    // If the open file button is not present (e.g. during unit tests or in
    // partial render contexts), safely return without wiring any listeners.
    if (!openFileBtn || typeof openFileBtn.addEventListener !== "function") {
        return;
    }

    if (getLifecycleListenerCleanup(openFileBtn) !== undefined) {
        runLifecycleListenerCleanup(openFileBtn);
    }

    const cleanupCallbacks: Array<() => void> = [];
    const runtime = getLifecycleListenersRuntime();

    /**
     * Track an unsubscribe function returned by preload wrappers.
     *
     * @param maybeUnsubscribe - Potential unsubscribe callback.
     */
    const trackUnsubscribe = (maybeUnsubscribe: unknown): void => {
        if (typeof maybeUnsubscribe === "function") {
            cleanupCallbacks.push(maybeUnsubscribe as () => void);
        }
    };

    const registerCleanupTimer = (
        callback: () => void,
        delayMs: number
    ): LifecycleListenersTimer => {
        const timeout = runtime.setTimeout(callback, delayMs);
        cleanupCallbacks.push(() => runtime.clearTimeout(timeout));
        return timeout;
    };

    const isTestEnvironment = runtime.isTestEnvironment();

    // Open File button click
    const handleOpenFileClick = () => {
        handleOpenFile(
            {
                isOpeningFileRef,
                openFileBtn,
                setLoading,
                showNotification,
            },
            { electronApiScope }
        );
    };

    const openFileClickController = runtime.createAbortController();
    openFileBtn.addEventListener("click", handleOpenFileClick, {
        signal: openFileClickController.signal,
    });
    cleanupCallbacks.push(() => {
        try {
            openFileClickController.abort();
        } catch {
            /* ignore */
        }
    });

    // Recent Files Context Menu (extracted for maintainability)
    trackUnsubscribe(
        attachRecentFilesContextMenu({
            electronApiScope,
            openFileBtn,
            setLoading,
            showNotification,
        })
    );

    // Window resize for chart rendering - use modern state management
    registerChartResizeListener({ cleanupCallbacks });

    const electronAPI = getLifecycleElectronAPI(electronApiScope);

    // Electron IPC and menu listeners
    if (
        electronAPI &&
        electronAPI.onMenuOpenFile &&
        electronAPI.onOpenRecentFile
    ) {
        trackUnsubscribe(
            electronAPI.onMenuOpenFile(() => {
                handleOpenFile(
                    {
                        isOpeningFileRef,
                        openFileBtn,
                        setLoading,
                        showNotification,
                    },
                    { electronApiScope }
                );
            })
        );

        trackUnsubscribe(
            electronAPI.onOpenRecentFile(async (filePath: unknown) => {
                openFileBtn.disabled = true;
                setLoading(true);
                try {
                    const filePathString = getRecentFilePath(filePath);
                    if (!filePathString) {
                        showNotification(
                            "Recent file path is invalid.",
                            "error",
                            4000
                        );
                        return;
                    }

                    const arrayBuffer =
                            typeof electronAPI.readFile === "function"
                                ? await electronAPI.readFile(filePathString)
                                : null,
                        result =
                            arrayBuffer &&
                            typeof electronAPI.parseFitFile === "function"
                                ? await electronAPI.parseFitFile(arrayBuffer)
                                : null;

                    if (!arrayBuffer || !result) {
                        showNotification(
                            "Recent file APIs are unavailable.",
                            "error",
                            4000
                        );
                        return;
                    }

                    const parseErrorMessage = getFitParseErrorMessage(result);
                    if (parseErrorMessage) {
                        showNotification(
                            `Error: ${parseErrorMessage.display}`,
                            "error"
                        );
                        return;
                    }

                    const fitData = unwrapFitParseMessages(result);

                    // Debug logging for development
                    if (
                        getProcessEnvironmentValue("NODE_ENV") !== undefined &&
                        getProcessEnvironmentValue("NODE_ENV") !== "production"
                    ) {
                        console.log(
                            "[DEBUG] Recent file parse result:",
                            result
                        );
                        const sessionCount =
                            getFitMessagesSessionCount(fitData);
                        console.log(
                            `[Listeners] Debug: Parsed recent FIT data contains ${sessionCount} sessions`
                        );
                    }

                    // Display the data with proper error handling
                    try {
                        await renderDecodedFitData(fitData, filePathString, {
                            electronApiScope,
                        });
                        sendFitFileToAltFitReader(arrayBuffer);
                    } catch (displayError) {
                        showNotification(
                            `Error displaying FIT data: ${String(displayError)}`,
                            "error"
                        );
                        return;
                    }

                    // Add to recent files only if successfully displayed
                    await electronAPI.addRecentFile?.(filePathString);
                } catch (error) {
                    showNotification(
                        `Error opening recent file: ${getRecentOpenErrorMessage(error)}`,
                        "error"
                    );
                } finally {
                    openFileBtn.disabled = false;
                    setLoading(false);
                }
            })
        );
    }

    if (electronAPI) {
        registerNamedLifecycleIpcListeners({
            electronApiScope,
            electronAPI,
            isTestEnvironment,
            lifecycleRuntime: runtime,
            registerCleanupTimer,
            setLoading,
            showAboutModal,
            showNotification,
            trackUnsubscribe,
        });
    }

    if (electronAPI) {
        registerUpdateEventListeners(electronAPI, showUpdateNotification);
    }

    // Accessibility Event Listeners
    if (electronAPI) {
        trackUnsubscribe(
            electronAPI.onSetFontSize?.((size: unknown) => {
                if (typeof size !== "string" || size.length === 0) {
                    return;
                }
                runtime.replaceBodyClasses(
                    FONT_SIZE_BODY_CLASSES,
                    `font-${size}`
                );
            })
        );
        trackUnsubscribe(
            electronAPI.onSetHighContrast?.((mode: unknown) => {
                if (typeof mode !== "string") {
                    return;
                }
                runtime.replaceBodyClasses(
                    HIGH_CONTRAST_BODY_CLASSES,
                    getHighContrastBodyClass(mode)
                );
            })
        );
    }

    // Expose cleanup for idempotent initialization (tests/hot reload).
    setLifecycleListenerCleanup(openFileBtn, () => {
        for (const cleanup of cleanupCallbacks.splice(0)) {
            try {
                cleanup();
            } catch {
                /* ignore */
            }
        }
        clearLifecycleListenerCleanup(openFileBtn);
    });
}
