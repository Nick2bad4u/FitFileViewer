import { buildGpxFromRecords, resolveTrackNameFromLoadedFiles } from "../../files/export/gpxExport.js";
import { openFileSelector } from "../../files/import/openFileSelector.js";
import { buildDownloadFilename, sanitizeFileExtension } from "../../files/sanitizeFilename.js";
import { attachRecentFilesContextMenu } from "./recentFilesContextMenu.js";

// Utility to set up all event listeners for the app
/**
 * Sets up all event listeners for the FitFileViewer application UI and IPC.
 *
 * @param {Object} params - The parameters object.
 * @param {HTMLButtonElement} params.openFileBtn - The "Open File" button element.
 * @param {Object} params.isOpeningFileRef - Reference object to track file opening state.
 * @param {Function} params.setLoading - Function to show/hide loading overlay.
 * @param {Function} params.showNotification - Function to display notifications to the user.
 * @param {Function} params.handleOpenFile - Function to handle file opening logic.
 * @param {Function} params.showUpdateNotification - Function to display update notifications.
 * @param {Function} params.showAboutModal - Function to display the About modal dialog.
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

    const isTestEnvironment =
        globalThis.process !== undefined &&
        Boolean(globalThis.process?.env) &&
        /** @type {any} */ (globalThis.process.env).NODE_ENV === "test";

    // Open File button click
    openFileBtn.addEventListener("click", () =>
        handleOpenFile({
            isOpeningFileRef,
            openFileBtn,
            setLoading,
            showNotification,
        })
    );

    // Recent Files Context Menu (extracted for maintainability)
    attachRecentFilesContextMenu({ openFileBtn, setLoading, showNotification });

    // Window resize for chart rendering - use modern state management
    /** @type {ReturnType<typeof setTimeout> | null} */
    let chartRenderTimeout = null;
    window.addEventListener("resize", () => {
        if (
            document.querySelector("#tab-chart")?.classList.contains("active") ||
            document.querySelector("#tab-chartjs")?.classList.contains("active")
        ) {
            if (chartRenderTimeout) {
                clearTimeout(chartRenderTimeout);
            }
            chartRenderTimeout = setTimeout(() => {
                // Use modern chart state management for resize handling
                if (globalThis.ChartUpdater && globalThis.ChartUpdater.updateCharts) {
                    globalThis.ChartUpdater.updateCharts("window-resize");
                } else if (globalThis.renderChartJS) {
                    globalThis.renderChartJS();
                } else if (/** @type {any} */ (globalThis).renderChart) {
                    // Legacy fallback (cast window to any for legacy property)
                    /** @type {any} */ (globalThis).renderChart();
                }
            }, 200);
        }
    });

    // Electron IPC and menu listeners
    if (globalThis.electronAPI && globalThis.electronAPI.onMenuOpenFile && globalThis.electronAPI.onOpenRecentFile) {
        globalThis.electronAPI.onMenuOpenFile(() => {
            handleOpenFile({ isOpeningFileRef, openFileBtn, setLoading, showNotification });
        });
        globalThis.electronAPI.onOpenRecentFile(async (filePath) => {
            openFileBtn.disabled = true;
            setLoading(true);
            try {
                const arrayBuffer = await globalThis.electronAPI.readFile(filePath),
                    result = await globalThis.electronAPI.parseFitFile(arrayBuffer);

                // Handle parsing errors
                if (result && result.error) {
                    showNotification(`Error: ${result.error}\n${result.details || ""}`, "error");
                    return;
                }

                // Debug logging for development
                if (typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production") {
                    console.log("[DEBUG] Recent file parse result:", result);
                    const sessionCount = result.data?.sessions?.length || 0;
                    console.log(`[Listeners] Debug: Parsed recent FIT data contains ${sessionCount} sessions`);
                }

                // Display the data with proper error handling
                try {
                    const filePathString = Array.isArray(filePath) ? filePath[0] : filePath;

                    if (globalThis.showFitData) {
                        // Extract data using the same logic as handleOpenFile.js
                        const dataToShow = result.data || result;
                        globalThis.showFitData(dataToShow, filePathString);
                    }

                    if (/** @type {any} */ (globalThis).sendFitFileToAltFitReader) {
                        /** @type {any} */ (globalThis).sendFitFileToAltFitReader(arrayBuffer);
                    }
                } catch (displayError) {
                    showNotification(`Error displaying FIT data: ${displayError}`, "error");
                    return;
                }

                // Add to recent files only if successfully displayed
                await globalThis.electronAPI.addRecentFile(filePath);
            } catch (error) {
                showNotification(`Error opening recent file: ${error}`, "error");
            } finally {
                openFileBtn.disabled = false;
                setLoading(false);
            }
        });
    }

    if (globalThis.electronAPI && globalThis.electronAPI.onIpc) {
        // Handles changes to decoder options and updates the UI or data accordingly
        /**
         * Decoder options changed handler
         * @param {any} newOptions
         */
        globalThis.electronAPI.onIpc("decoder-options-changed", (/** @type {any} */ _newOptions) => {
            showNotification("Decoder options updated.", "info", 2000);
            if (globalThis.globalData && globalThis.globalData.cachedFilePath) {
                const filePath = globalThis.globalData.cachedFilePath;
                setLoading(true);
                globalThis.electronAPI
                    .readFile(filePath)
                    .then((arrayBuffer) => globalThis.electronAPI.parseFitFile(arrayBuffer))
                    .then((result) => {
                        if (result && result.error) {
                            showNotification(`Error: ${result.error}\n${result.details || ""}`, "error");
                        } else {
                            globalThis.showFitData?.(result, filePath);
                        }
                    })
                    .catch((error) => {
                        showNotification(`Error reloading file: ${error}`, "error");
                    })
                    .finally(() => setLoading(false));
            }
        });
        /**
         * Export file handler
         * @param {any} _event
         * @param {string} filePath
         */
        globalThis.electronAPI.onIpc(
            "export-file",
            /** @param {any} _event @param {string} filePath */ async (_event, /** @type {string} */ filePath) => {
                if (!globalThis.globalData) {
                    return;
                }
                const safePath = filePath || "";
                const ext = sanitizeFileExtension(safePath.split(".").pop() ?? "");
                if (ext === "csv") {
                    const container = document.querySelector("#content-summary");
                    if (/** @type {any} */ (globalThis).copyTableAsCSV && container) {
                        const csv = /** @type {any} */ (globalThis).copyTableAsCSV({
                            container,
                            data: globalThis.globalData,
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
                        setTimeout(() => {
                            URL.revokeObjectURL(a.href);
                            a.remove();
                        }, 100);
                    }
                } else if (ext === "gpx") {
                    const records = Array.isArray(globalThis.globalData?.recordMesgs)
                        ? globalThis.globalData.recordMesgs
                        : null;
                    if (!records || records.length === 0) {
                        showNotification("No data available for GPX export.", "info", 3000);
                        return;
                    }

                    const trackName = resolveTrackNameFromLoadedFiles(globalThis.loadedFitFiles);
                    const gpx = buildGpxFromRecords(records, { trackName });
                    if (!gpx) {
                        showNotification("No valid coordinates found for GPX export.", "info", 3000);
                        return;
                    }

                    const a = document.createElement("a");
                    const blob = new Blob([gpx], { type: "application/gpx+xml;charset=utf-8" });
                    const downloadName = buildDownloadFilename(safePath, {
                        defaultExtension: "gpx",
                        fallbackBase: trackName || "export",
                    });
                    a.href = URL.createObjectURL(blob);
                    a.download = downloadName;
                    document.body.append(a);
                    a.click();
                    setTimeout(() => {
                        URL.revokeObjectURL(a.href);
                        a.remove();
                    }, 100);
                }
            }
        );
        globalThis.electronAPI.onIpc(
            "show-notification",
            (/** @type {string} */ msg, /** @type {string | undefined} */ type) => {
                if (typeof showNotification === "function") {
                    showNotification(msg, type || "info", 3000);
                }
            }
        );
        globalThis.electronAPI.onIpc("menu-print", () => {
            globalThis.print();
        });
        globalThis.electronAPI.onIpc("menu-check-for-updates", () => {
            if (globalThis.electronAPI.send) {
                globalThis.electronAPI.send("menu-check-for-updates");
            }
        });
        // "Restart and Update" is a main-process action (quitAndInstall). The menu triggers
        // a renderer event; handle it here by calling the explicit preload wrapper.
        globalThis.electronAPI.onIpc("menu-restart-update", () => {
            try {
                if (globalThis.electronAPI && typeof globalThis.electronAPI.installUpdate === "function") {
                    globalThis.electronAPI.installUpdate();
                }
            } catch {
                /* ignore */
            }
        });
        globalThis.electronAPI.onIpc("menu-open-overlay", async () => {
            try {
                await openFileSelector();
            } catch (error) {
                if (!isTestEnvironment) {
                    console.error("[Listeners] Failed to open overlay selector:", error);
                }
                showNotification("Failed to open overlay selector.", "error", 3000);
            }
        });
        const ensureMenuForwarder = (channel) => {
            if (!globalThis.electronAPI || typeof globalThis.electronAPI.onIpc !== "function") {
                return;
            }
            /** @type {Record<string, any>} */
            const holder = /** @type {any} */ (globalThis);
            if (!(holder.__ffvMenuForwardRegistry instanceof Set)) {
                holder.__ffvMenuForwardRegistry = new Set();
            }
            /** @type {Set<string>} */
            const registry = holder.__ffvMenuForwardRegistry;
            if (registry.has(channel)) {
                return;
            }
            registry.add(channel);
            globalThis.electronAPI.onIpc(channel, () => {
                if (globalThis.electronAPI && typeof globalThis.electronAPI.send === "function") {
                    globalThis.electronAPI.send(channel);
                }
            });
        };
        ensureMenuForwarder("menu-save-as");
        ensureMenuForwarder("menu-export");
        globalThis.electronAPI.onIpc("menu-about", async () => {
            // Show the about modal without any content since the styled system info
            // Section will automatically load and display all the version information
            showAboutModal();
        });
        globalThis.electronAPI.onIpc("open-accent-color-picker", () => {
            console.log("Opening accent color picker");
            if (typeof globalThis.showAccentColorPicker === "function") {
                globalThis.showAccentColorPicker();
            } else {
                console.error("showAccentColorPicker function not available");
            }
        });
        globalThis.electronAPI.onIpc("menu-keyboard-shortcuts", () => {
            console.log("Keyboard shortcuts menu clicked - starting handler");
            // Check if the keyboard shortcuts modal script is already loaded
            if (globalThis.showKeyboardShortcutsModal === undefined) {
                console.log("Modal script not loaded, loading dynamically...");
                // Load the keyboard shortcuts modal script dynamically
                const script = document.createElement("script");
                script.src = "./utils/keyboardShortcutsModal.js";
                script.addEventListener("load", () => {
                    console.log("Script loaded successfully");
                    // Call the function after the script is loaded
                    if (typeof globalThis.showKeyboardShortcutsModal === "function") {
                        console.log("Calling showKeyboardShortcutsModal function");
                        globalThis.showKeyboardShortcutsModal();
                    } else {
                        console.error("showKeyboardShortcutsModal function not available after script load");
                    }
                });
                script.onerror = (error) => {
                    console.error("Failed to load keyboard shortcuts modal script:", error);
                    // Fallback to old implementation
                    const shortcuts = [
                        ["Open File", "Ctrl+O"],
                        ["Save As", "Ctrl+S"],
                        ["Print", "Ctrl+P"],
                        ["Close Window", "Ctrl+W"],
                        ["Reload", "Ctrl+R"],
                        ["Toggle DevTools", "Ctrl+Shift+I"],
                        ["Toggle Fullscreen", "F11"],
                        ["Export", "No default"],
                        ["Theme: Dark/Light", "Settings > Theme"],
                    ];
                    let html = '<h2>Keyboard Shortcuts</h2><ul class="shortcut-list">';
                    for (const [action, keys] of shortcuts) {
                        html += `<li class='shortcut-list-item'><strong>${action}:</strong> <span class='shortcut-key'>${keys}</span></li>`;
                    }
                    html += "</ul>";
                    showAboutModal(html);
                };
                document.head.append(script);
            } else {
                console.log("Modal script already loaded, calling function directly");
                // Function is already available, call it directly
                globalThis.showKeyboardShortcutsModal();
            }
        });
    }

    // Auto-Updater Event Listeners
    if (globalThis.electronAPI && globalThis.electronAPI.onUpdateEvent) {
        globalThis.electronAPI.onUpdateEvent("update-checking", () => {
            showUpdateNotification("Checking for updates...", "info", 3000);
        });
        globalThis.electronAPI.onUpdateEvent("update-available", () => {
            showUpdateNotification("Update available! Downloading...", 4000);
        });
        globalThis.electronAPI.onUpdateEvent("update-not-available", () => {
            showUpdateNotification("You are using the latest version.", "success", 4000);
        });
        globalThis.electronAPI.onUpdateEvent("update-error", (/** @type {any} */ err) => {
            showUpdateNotification(`Update error: ${err}`, "error", 7000);
        });
        globalThis.electronAPI.onUpdateEvent("update-download-progress", (/** @type {any} */ progress) => {
            if (progress && typeof progress.percent === "number") {
                showUpdateNotification(`Downloading update: ${Math.round(progress.percent)}%`, "info", 2000);
            } else {
                showUpdateNotification("Downloading update: progress information unavailable.", "info", 2000);
            }
        });
        globalThis.electronAPI.onUpdateEvent("update-downloaded", () => {
            showUpdateNotification(
                "Update downloaded! Restart to install the update now, or choose Later to finish your work.",
                "success",
                0,
                "update-downloaded"
            );
        });
    }

    // Accessibility Event Listeners
    if (globalThis.electronAPI && globalThis.electronAPI.onIpc) {
        globalThis.electronAPI.onIpc("set-font-size", (/** @type {any} */ _event, /** @type {string} */ size) => {
            document.body.classList.remove("font-xsmall", "font-small", "font-medium", "font-large", "font-xlarge");
            document.body.classList.add(`font-${size}`);
        });
        globalThis.electronAPI.onIpc("set-high-contrast", (/** @type {any} */ _event, /** @type {string} */ mode) => {
            document.body.classList.remove("high-contrast", "high-contrast-white", "high-contrast-yellow");
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
        });
    }
}
