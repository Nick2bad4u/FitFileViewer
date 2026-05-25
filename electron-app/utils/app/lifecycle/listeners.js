import {
    buildGpxFromRecords,
    resolveTrackNameFromLoadedFiles,
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
import { querySelectorByIdFlexible } from "../../ui/dom/elementIdUtils.js";
import { registerChartResizeListener } from "./listenersResize.js";
import { registerMenuIpcListeners } from "./menuIpcListeners.js";
import { attachRecentFilesContextMenu } from "./recentFilesContextMenu.js";
const lifecycleGlobal = globalThis;
function isMissingFileError(error) {
    const message = error instanceof Error ? error.message : String(error);
    return /\bENOENT\b/u.test(message);
}
function getRecentOpenErrorMessage(error) {
    if (isMissingFileError(error)) {
        return "File not found. It may have been moved, deleted, or opened from an old recent-file entry.";
    }
    return error instanceof Error ? error.message : String(error);
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
}) {
    // If the open file button is not present (e.g. during unit tests or in
    // partial render contexts), safely return without wiring any listeners.
    if (!openFileBtn || typeof openFileBtn.addEventListener !== "function") {
        return;
    }
    const btnAny = openFileBtn;
    const cleanupKey = "__ffvLifecycleListenersCleanup";
    const previousCleanup = btnAny[cleanupKey];
    if (typeof previousCleanup === "function") {
        try {
            previousCleanup();
        } catch {
            /* ignore */
        }
    }
    const cleanupCallbacks = [];
    /**
     * Track an unsubscribe function returned by preload wrappers.
     *
     * @param maybeUnsubscribe - Potential unsubscribe callback.
     */
    const trackUnsubscribe = (maybeUnsubscribe) => {
        if (typeof maybeUnsubscribe === "function") {
            cleanupCallbacks.push(maybeUnsubscribe);
        }
    };
    const registerCleanupTimer = (callback, delayMs) => {
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
            electronAPI.onOpenRecentFile(async (filePath) => {
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
                        process.env?.["NODE_ENV"] !== "production"
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
    if (electronAPI && electronAPI.onIpc) {
        const debugMenuEnabled =
            typeof process !== "undefined" &&
            (process.env?.["FFV_DEBUG_MENU"] === "1" ||
                process.env?.["NODE_ENV"] === "development");
        const debugMenuLog = (...args) => {
            if (!debugMenuEnabled) return;
            try {
                console.log(...args);
            } catch {
                /* ignore */
            }
        };
        trackUnsubscribe(
            electronAPI.onIpc("decoder-options-changed", (_newOptions) => {
                showNotification("Decoder options updated.", "info", 2000);
                if (
                    lifecycleGlobal.globalData &&
                    lifecycleGlobal.globalData.cachedFilePath
                ) {
                    const filePath = lifecycleGlobal.globalData.cachedFilePath;
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
                        .then((arrayBuffer) =>
                            typeof electronAPI.parseFitFile === "function"
                                ? electronAPI.parseFitFile(arrayBuffer)
                                : null
                        )
                        .then((result) => {
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
                        .catch((error) => {
                            showNotification(
                                `Error reloading file: ${error}`,
                                "error"
                            );
                        })
                        .finally(() => setLoading(false));
                }
            })
        );
        trackUnsubscribe(
            electronAPI.onIpc("export-file", async (_event, filePath) => {
                if (!lifecycleGlobal.globalData) {
                    return;
                }
                const safePath = typeof filePath === "string" ? filePath : "";
                const ext = sanitizeFileExtension(
                    safePath.split(".").pop() ?? ""
                );
                if (ext === "csv") {
                    const container = querySelectorByIdFlexible(
                        document,
                        "#content_summary"
                    );
                    if (
                        typeof lifecycleGlobal.copyTableAsCSV === "function" &&
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
            })
        );
        trackUnsubscribe(
            electronAPI.onIpc(
                "show-notification",
                (eventOrMsg, msgOrType, typeMaybe) => {
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
        electronAPI.onUpdateEvent("update-error", (err) => {
            showUpdateNotification(`Update error: ${err}`, "error", 7000);
        });
        electronAPI.onUpdateEvent("update-download-progress", (progress) => {
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
        });
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
            electronAPI.onIpc("set-font-size", (_event, size) => {
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
            electronAPI.onIpc("set-high-contrast", (_event, mode) => {
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
                delete btnAny[cleanupKey];
            } catch {
                /* ignore */
            }
        }
    };
}
