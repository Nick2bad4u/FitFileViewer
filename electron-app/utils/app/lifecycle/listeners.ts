import {
    buildGpxFromRecords,
    resolveTrackNameFromLoadedFiles,
} from "../../files/export/gpxExport.js";
import type {
    GpxRecord,
    LoadedFitFileDescriptor,
} from "../../files/export/gpxExport.js";
import {
    buildDownloadFilename,
    sanitizeFileExtension,
} from "../../files/sanitizeFilename.js";
import {
    getFitMessagesSessionCount,
    getFitParseErrorMessage,
    unwrapFitParseMessages,
} from "../../files/import/fitParsePayload.js";
import type { FitParsePayload } from "../../files/import/fitParsePayload.js";
import type { ElectronAPI } from "../../../shared/preloadApi.js";
import { querySelectorByIdFlexible } from "../../ui/dom/elementIdUtils.js";
import { registerChartResizeListener } from "./listenersResize.js";
import { registerMenuIpcListeners } from "./menuIpcListeners.js";
import { attachRecentFilesContextMenu } from "./recentFilesContextMenu.js";

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

type FitParseResult = FitParsePayload;

type FitData = {
    cachedFilePath?: string;
    recordMesgs?: GpxRecord[];
    sessions?: unknown[];
    [key: string]: unknown;
};

type Unsubscribe = () => void;

type OpenRecentFilePath = Parameters<
    Parameters<ElectronAPI["onOpenRecentFile"]>[0]
>[0];

type LifecycleElectronAPI = Partial<
    Pick<
        ElectronAPI,
        | "addRecentFile"
        | "approveRecentFile"
        | "onIpc"
        | "onMenuOpenFile"
        | "onUpdateEvent"
        | "readFile"
        | "send"
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

const lifecycleGlobal = globalThis as LifecycleGlobal;

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
        Boolean(lifecycleGlobal.process?.env) &&
        lifecycleGlobal.process.env["NODE_ENV"] === "test";

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
                    const filePathString = Array.isArray(filePath)
                        ? filePath[0]
                        : filePath;
                    if (
                        typeof filePathString !== "string" ||
                        filePathString.length === 0
                    ) {
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
                        typeof process !== "undefined" &&
                        process.env &&
                        process.env["NODE_ENV"] !== "production"
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
                            `Error displaying FIT data: ${displayError}`,
                            "error"
                        );
                        return;
                    }

                    // Add to recent files only if successfully displayed
                    await electronAPI.addRecentFile?.(filePathString);
                } catch (error) {
                    showNotification(
                        `Error opening recent file: ${error}`,
                        "error"
                    );
                } finally {
                    openFileBtn.disabled = false;
                    setLoading(false);
                }
            })
        );
    }

    if (electronAPI && electronAPI.onIpc) {
        const debugMenuEnabled =
            typeof process !== "undefined" &&
            Boolean(process.env) &&
            (process.env["FFV_DEBUG_MENU"] === "1" ||
                process.env["NODE_ENV"] === "development");
        const debugMenuLog = (...args: unknown[]) => {
            if (!debugMenuEnabled) return;
            try {
                console.log(...args);
            } catch {
                /* ignore */
            }
        };

        trackUnsubscribe(
            electronAPI.onIpc(
                "decoder-options-changed",
                (_newOptions: unknown) => {
                    showNotification("Decoder options updated.", "info", 2000);
                    if (
                        lifecycleGlobal.globalData &&
                        lifecycleGlobal.globalData.cachedFilePath
                    ) {
                        const filePath =
                            lifecycleGlobal.globalData.cachedFilePath;
                        setLoading(true);
                        if (
                            typeof electronAPI.readFile !== "function" ||
                            typeof electronAPI.parseFitFile !== "function"
                        ) {
                            showNotification(
                                "File reload APIs are unavailable.",
                                "error"
                            );
                            setLoading(false);
                            return;
                        }
                        electronAPI
                            .readFile(filePath)
                            .then((arrayBuffer: ArrayBuffer) =>
                                typeof electronAPI.parseFitFile === "function"
                                    ? electronAPI.parseFitFile(arrayBuffer)
                                    : null
                            )
                            .then((result: FitParseResult | null) => {
                                if (!result) {
                                    return;
                                }

                                const parseErrorMessage =
                                    getFitParseErrorMessage(result);
                                if (parseErrorMessage) {
                                    showNotification(
                                        `Error: ${parseErrorMessage.display}`,
                                        "error"
                                    );
                                    return;
                                }

                                lifecycleGlobal.showFitData?.(
                                    unwrapFitParseMessages(result),
                                    filePath
                                );
                            })
                            .catch((error: unknown) => {
                                showNotification(
                                    `Error reloading file: ${error}`,
                                    "error"
                                );
                            })
                            .finally(() => setLoading(false));
                    }
                }
            )
        );
        trackUnsubscribe(
            electronAPI.onIpc(
                "export-file",
                async (_event: unknown, filePath: unknown) => {
                    if (!lifecycleGlobal.globalData) {
                        return;
                    }
                    const safePath =
                        typeof filePath === "string" ? filePath : "";
                    const ext = sanitizeFileExtension(
                        safePath.split(".").pop() ?? ""
                    );
                    if (ext === "csv") {
                        const container = querySelectorByIdFlexible(
                            document,
                            "#content_summary"
                        );
                        if (
                            typeof lifecycleGlobal.copyTableAsCSV ===
                                "function" &&
                            container
                        ) {
                            const csv = lifecycleGlobal.copyTableAsCSV({
                                container,
                                data: lifecycleGlobal.globalData,
                            });
                            const blob = new Blob([csv], { type: "text/csv" });
                            const a = document.createElement("a");
                            a.href = URL.createObjectURL(blob);
                            a.download = buildDownloadFilename(safePath, {
                                defaultExtension: "csv",
                                fallbackBase: "export",
                            });
                            document.body.append(a);
                            a.click();
                            registerCleanupTimer(() => {
                                URL.revokeObjectURL(a.href);
                                a.remove();
                            }, 100);
                        }
                    } else if (ext === "gpx") {
                        const records = Array.isArray(
                            lifecycleGlobal.globalData?.recordMesgs
                        )
                            ? lifecycleGlobal.globalData.recordMesgs
                            : null;
                        if (!records || records.length === 0) {
                            showNotification(
                                "No data available for GPX export.",
                                "info",
                                3000
                            );
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

                        const a = document.createElement("a");
                        const blob = new Blob([gpx], {
                            type: "application/gpx+xml;charset=utf-8",
                        });
                        const downloadName = buildDownloadFilename(safePath, {
                            defaultExtension: "gpx",
                            fallbackBase: trackName || "export",
                        });
                        a.href = URL.createObjectURL(blob);
                        a.download = downloadName;
                        document.body.append(a);
                        a.click();
                        registerCleanupTimer(() => {
                            URL.revokeObjectURL(a.href);
                            a.remove();
                        }, 100);
                    }
                }
            )
        );
        trackUnsubscribe(
            electronAPI.onIpc(
                "show-notification",
                (
                    eventOrMsg: unknown,
                    msgOrType: unknown,
                    typeMaybe: unknown
                ) => {
                    // Support both signatures:
                    // - Real ipcRenderer: (event, msg, type)
                    // - Unit-test mocks: (msg, type)
                    const msg =
                        typeof eventOrMsg === "string" ? eventOrMsg : msgOrType;
                    const type =
                        typeof eventOrMsg === "string" ? msgOrType : typeMaybe;

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
                }
            )
        );
        trackUnsubscribe(
            electronAPI.onIpc("menu-print", () => {
                lifecycleGlobal.print();
            })
        );
        trackUnsubscribe(
            electronAPI.onIpc("menu-check-for-updates", () => {
                if (electronAPI.send) {
                    electronAPI.send("menu-check-for-updates");
                }
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

    // Auto-Updater Event Listeners
    if (electronAPI && electronAPI.onUpdateEvent) {
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
        electronAPI.onUpdateEvent("update-error", (err: unknown) => {
            showUpdateNotification(`Update error: ${err}`, "error", 7000);
        });
        electronAPI.onUpdateEvent(
            "update-download-progress",
            (progress: unknown) => {
                const percent =
                    typeof progress === "object" &&
                    progress !== null &&
                    "percent" in progress &&
                    typeof progress.percent === "number"
                        ? progress.percent
                        : null;

                if (percent !== null) {
                    showUpdateNotification(
                        `Downloading update: ${Math.round(percent)}%`,
                        "info",
                        2000
                    );
                } else {
                    showUpdateNotification(
                        "Downloading update: progress information unavailable.",
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

    // Accessibility Event Listeners
    if (electronAPI && electronAPI.onIpc) {
        trackUnsubscribe(
            electronAPI.onIpc(
                "set-font-size",
                (_event: unknown, size: unknown) => {
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
                }
            )
        );
        trackUnsubscribe(
            electronAPI.onIpc(
                "set-high-contrast",
                (_event: unknown, mode: unknown) => {
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
                }
            )
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
                delete btnAny[cleanupKey];
            } catch {
                /* ignore */
            }
        }
    };
}
