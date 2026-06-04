import {
    buildGpxFromRecords,
    resolveTrackNameFromLoadedFiles,
    type GpxRecord,
    type LoadedFitFileDescriptor,
} from "../../files/export/gpxExport.js";
import {
    getFitMessagesSessionCount,
    getFitParseErrorMessage,
    type FitParsePayload,
    unwrapFitParseMessages,
} from "../../files/import/fitParsePayload.js";
import {
    buildDownloadFilename,
    sanitizeFileExtension,
} from "../../files/sanitizeFilename.js";
import {
    getProcessEnvironmentValue,
    isDevelopmentEnvironment,
} from "../../runtime/processEnvironment.js";
import type { ElectronAPI } from "../../../shared/preloadApi.js";
import { querySelectorByIdFlexible } from "../../ui/dom/elementIdUtils.js";
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
) => ReturnType<typeof setTimeout>;

type ExportDownloadDependencies = {
    registerCleanupTimer: RegisterCleanupTimer;
    safePath: string;
};

type DecoderReloadDependencies = {
    electronAPI: LifecycleElectronAPI;
    setLoading: (loading: boolean) => void;
    showNotification: ShowNotification;
};

type ExportFileDependencies = {
    registerCleanupTimer: RegisterCleanupTimer;
    showNotification: ShowNotification;
};

type NamedLifecycleIpcDependencies = {
    electronAPI: LifecycleElectronAPI;
    isTestEnvironment: boolean;
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

type FitParseResult = FitParsePayload;

type FitData = {
    cachedFilePath?: string;
    recordMesgs?: GpxRecord[];
    sessions?: unknown[];
    [key: string]: unknown;
};

type Unsubscribe = () => void;
type TrackUnsubscribe = (maybeUnsubscribe: unknown) => void;

type OpenRecentFilePath = Parameters<
    Parameters<ElectronAPI["onOpenRecentFile"]>[0]
>[0];

type LifecycleElectronAPI = Partial<
    Pick<
        ElectronAPI,
        | "addRecentFile"
        | "approveRecentFile"
        | "checkForUpdates"
        | "onDecoderOptionsChanged"
        | "onExportFile"
        | "onMenuCheckForUpdates"
        | "onMenuOpenFile"
        | "onMenuPrint"
        | "onUpdateEvent"
        | "onSetFontSize"
        | "onSetHighContrast"
        | "onShowNotification"
        | "readFile"
    >
> & {
    onOpenRecentFile?: (
        callback: (
            filePath: OpenRecentFilePath | OpenRecentFilePath[]
        ) => Promise<void> | void
    ) => Unsubscribe | undefined;
    parseFitFile?: (
        arrayBuffer: Parameters<ElectronAPI["parseFitFile"]>[0]
    ) => Promise<FitParseResult>;
};

type LifecycleGlobal = typeof globalThis & {
    ChartUpdater?: { updateCharts?: (reason?: string) => unknown };
    __ffvLifecycleListenersCleanup?: () => void;
    copyTableAsCSV?: (options: { container: Element; data: FitData }) => string;
    electronAPI?: LifecycleElectronAPI;
    globalData?: FitData | null;
    loadedFitFiles?: LoadedFitFileDescriptor[];
    renderChart?: () => unknown;
    renderChartJS?: () => unknown;
    sendFitFileToAltFitReader?: (arrayBuffer: ArrayBuffer) => unknown;
    showFitData?: (data: FitData | FitParseResult, filePath: string) => void;
};

/** Mutable flag shared with the file-opening workflow. */
export type FileOpeningStateRef = {
    current: boolean;
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

/** Parameters required to wire renderer DOM and IPC listeners. */
export type SetupListenersOptions = {
    handleOpenFile: (options: HandleOpenFileOptions) => unknown;
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

const lifecycleGlobal = globalThis as LifecycleGlobal;

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
    { registerCleanupTimer, safePath }: ExportDownloadDependencies,
    options: ExportDownloadOptions
): void {
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = buildDownloadFilename(safePath, options);
    document.body.append(anchor);
    anchor.click();
    registerCleanupTimer(() => {
        URL.revokeObjectURL(anchor.href);
        anchor.remove();
    }, 100);
}

function exportCsvFile(
    data: FitData,
    dependencies: ExportDownloadDependencies
): void {
    const container = querySelectorByIdFlexible(document, "#content_summary");
    if (
        typeof lifecycleGlobal.copyTableAsCSV !== "function" ||
        !container
    ) {
        return;
    }

    const csv = lifecycleGlobal.copyTableAsCSV({ container, data });
    downloadBlob(new Blob([csv], { type: "text/csv" }), dependencies, {
        defaultExtension: "csv",
        fallbackBase: "export",
    });
}

function exportGpxFile(
    data: FitData,
    { registerCleanupTimer, safePath }: ExportDownloadDependencies,
    showNotification: ShowNotification
): void {
    const records = Array.isArray(data.recordMesgs) ? data.recordMesgs : null;
    if (!records || records.length === 0) {
        showNotification("No data available for GPX export.", "info", 3000);
        return;
    }

    const trackName = resolveTrackNameFromLoadedFiles(
        lifecycleGlobal.loadedFitFiles
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
        { registerCleanupTimer, safePath },
        {
            defaultExtension: "gpx",
            fallbackBase: trackName || "export",
        }
    );
}

function handleExportFileRequest(
    filePath: unknown,
    { registerCleanupTimer, showNotification }: ExportFileDependencies
): void {
    const data = lifecycleGlobal.globalData;
    if (!data) {
        return;
    }

    const safePath = typeof filePath === "string" ? filePath : "";
    const ext = sanitizeFileExtension(safePath.split(".").pop() ?? "");
    const downloadDependencies = { registerCleanupTimer, safePath };

    if (ext === "csv") {
        exportCsvFile(data, downloadDependencies);
    } else if (ext === "gpx") {
        exportGpxFile(data, downloadDependencies, showNotification);
    }
}

async function reloadCachedFitFileAfterDecoderOptionsChange({
    electronAPI,
    setLoading,
    showNotification,
}: DecoderReloadDependencies): Promise<void> {
    const filePath = lifecycleGlobal.globalData?.cachedFilePath;
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

        lifecycleGlobal.showFitData?.(
            unwrapFitParseMessages(result),
            filePath
        );
    } catch (error) {
        showNotification(
            `Error reloading file: ${String(error)}`,
            "error"
        );
    } finally {
        setLoading(false);
    }
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
        showUpdateNotification(
            `Update error: ${String(error)}`,
            "error",
            7000
        );
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
    electronAPI,
    isTestEnvironment,
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
                electronAPI,
                setLoading,
                showNotification,
            });
        })
    );
    trackUnsubscribe(
        electronAPI.onExportFile?.((filePath: unknown) => {
            handleExportFileRequest(filePath, {
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
            lifecycleGlobal.print();
        })
    );
    trackUnsubscribe(
        electronAPI.onMenuCheckForUpdates?.(() => {
            electronAPI.checkForUpdates?.();
        })
    );
    registerMenuIpcListeners({
        debugMenuLog,
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

    const btnAny = openFileBtn as HTMLButtonElement & {
        __ffvLifecycleListenersCleanup?: () => void;
    };
    const cleanupKey = "__ffvLifecycleListenersCleanup";

    const previousCleanup = btnAny[cleanupKey];
    if (typeof previousCleanup === "function") {
        try {
            previousCleanup();
        } catch {
            /* ignore */
        }
    }

    const cleanupCallbacks: Array<() => void> = [];

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
    ): ReturnType<typeof setTimeout> => {
        const timeout = setTimeout(callback, delayMs);
        cleanupCallbacks.push(() => clearTimeout(timeout));
        return timeout;
    };

    const isTestEnvironment =
        lifecycleGlobal.process !== undefined &&
        lifecycleGlobal.process?.env?.["NODE_ENV"] === "test";

    // Open File button click
    const handleOpenFileClick = () => {
        handleOpenFile({
            isOpeningFileRef,
            openFileBtn,
            setLoading,
            showNotification,
        });
    };

    const openFileClickController = new AbortController();
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
            openFileBtn,
            setLoading,
            showNotification,
        })
    );

    // Window resize for chart rendering - use modern state management
    registerChartResizeListener({ cleanupCallbacks });

    const electronAPI = lifecycleGlobal.electronAPI;

    // Electron IPC and menu listeners
    if (
        electronAPI &&
        electronAPI.onMenuOpenFile &&
        electronAPI.onOpenRecentFile
    ) {
        trackUnsubscribe(
            electronAPI.onMenuOpenFile(() => {
                handleOpenFile({
                    isOpeningFileRef,
                    openFileBtn,
                    setLoading,
                    showNotification,
                });
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

                    // Security/robustness: approve the selected recent file path before reading.
                    // - In the desktop build, readFile is gated by a main-process allowlist.
                    // - Main process menu clicks *usually* approve paths already, but this keeps
                    //   behavior consistent across entrypoints (menu vs. context menu) and
                    //   prevents failures if menu approval is unavailable.
                    if (typeof electronAPI.approveRecentFile === "function") {
                        const ok =
                            await electronAPI.approveRecentFile(filePathString);
                        if (!ok) {
                            showNotification(
                                "File access denied.",
                                "error",
                                4000
                            );
                            return;
                        }
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
                        if (lifecycleGlobal.showFitData) {
                            lifecycleGlobal.showFitData(
                                fitData,
                                filePathString
                            );
                        }

                        if (
                            typeof lifecycleGlobal.sendFitFileToAltFitReader ===
                            "function"
                        ) {
                            lifecycleGlobal.sendFitFileToAltFitReader(
                                arrayBuffer
                            );
                        }
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
            electronAPI,
            isTestEnvironment,
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
                document.body.classList.remove(
                    "font-xsmall",
                    "font-small",
                    "font-medium",
                    "font-large",
                    "font-xlarge"
                );
                document.body.classList.add(`font-${size}`);
            })
        );
        trackUnsubscribe(
            electronAPI.onSetHighContrast?.((mode: unknown) => {
                if (typeof mode !== "string") {
                    return;
                }
                document.body.classList.remove(
                    "high-contrast",
                    "high-contrast-white",
                    "high-contrast-yellow"
                );
                switch (mode) {
                    case "black": {
                        document.body.classList.add("high-contrast");

                        break;
                    }
                    case "white": {
                        document.body.classList.add("high-contrast-white");

                        break;
                    }
                    case "yellow": {
                        document.body.classList.add("high-contrast-yellow");

                        break;
                    }
                    // No default
                }
            })
        );
    }

    // Expose cleanup for idempotent initialization (tests/hot reload).
    btnAny[cleanupKey] = () => {
        for (const cleanup of cleanupCallbacks.splice(0)) {
            try {
                cleanup();
            } catch {
                /* ignore */
            }
        }
        if (btnAny[cleanupKey]) {
            try {
                Reflect.deleteProperty(btnAny, cleanupKey);
            } catch {
                /* ignore */
            }
        }
    };
}
