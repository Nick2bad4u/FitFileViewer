import { buildDownloadFilename, sanitizeFileExtension } from "../files/sanitizeFilename.js";

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
    openFileBtn,
    isOpeningFileRef,
    setLoading,
    showNotification,
    handleOpenFile,
    showUpdateNotification,
    showAboutModal,
}) {
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

    /** @type {Promise<typeof import("../files/export/gpxExport.js")>|null} */
    let gpxModulePromise = null;
    const loadGpxModule = () => {
        if (!gpxModulePromise) {
            gpxModulePromise = import("../files/export/gpxExport.js");
        }
        return gpxModulePromise;
    };

    // Open File button click
    openFileBtn.addEventListener("click", () =>
        handleOpenFile({
            isOpeningFileRef,
            openFileBtn,
            setLoading,
            showNotification,
        })
    );

    // Recent Files Context Menu
    openFileBtn.addEventListener("contextmenu", async (event) => {
        event.preventDefault();
        if (!globalThis.electronAPI?.recentFiles) return;
        const recentFiles = await globalThis.electronAPI.recentFiles();
        if (!recentFiles || recentFiles.length === 0) {
            showNotification("No recent files found.", "info", 2000);
            return;
        }
        const oldMenu = document.getElementById("recent-files-menu");
        if (oldMenu) oldMenu.remove();
        const menu = document.createElement("div");
        menu.id = "recent-files-menu";
        menu.style.position = "fixed";
        menu.style.zIndex = 10_010;
        menu.style.left = `${event.clientX}px`;
        menu.style.top = `${event.clientY}px`;
        menu.style.background = "var(--color-bg-alt-solid)";
        menu.style.color = "var(--color-fg)";
        menu.style.border = "2px solid var(--color-border-light)";
        menu.style.borderRadius = "var(--border-radius-small)";
        menu.style.boxShadow = "var(--color-box-shadow)";
        menu.style.minWidth = "320px";
        menu.style.maxWidth = "480px";
        menu.style.fontSize = "1rem";
        menu.style.padding = "4px 0";
        menu.style.cursor = "pointer";
        menu.style.userSelect = "none";
        menu.style.backdropFilter = "var(--backdrop-blur)";
        menu.oncontextmenu = (e) => e.preventDefault();
        menu.setAttribute("role", "menu");
        menu.setAttribute("aria-label", "Recent files");
        let focusedIndex = 0;
        const items = [];

        const createMouseLeaveHandler = (itemElement, itemIndex) => () => {
            itemElement.style.background = focusedIndex === itemIndex ? "var(--color-glass-border)" : "transparent";
            itemElement.style.color = "var(--color-fg)";
        };

        for (const [idx, file] of recentFiles.entries()) {
            const parts = file.split(/\\|\//g);
            const shortName = parts.length >= 2 ? `${parts.at(-2)}\\${parts.at(-1)}` : parts.at(-1);
            const item = document.createElement("div");
            item.textContent = shortName;
            item.title = file;
            item.style.padding = "8px 18px";
            item.style.whiteSpace = "nowrap";
            item.style.overflow = "hidden";
            item.style.textOverflow = "ellipsis";
            item.setAttribute("role", "menuitem");
            item.setAttribute("tabindex", "-1");
            item.style.background = idx === 0 ? "var(--color-glass-border)" : "transparent";
            item.onmouseenter = () => {
                item.style.background = "var(--color-glass-border)";
                item.style.color = "var(--color-fg-alt";
            };
            item.onmouseleave = createMouseLeaveHandler(item, idx);
            item.onclick = async () => {
                menu.remove();
                openFileBtn.disabled = true;
                setLoading(true);
                try {
                    const arrayBuffer = await globalThis.electronAPI.readFile(file);
                    const result = await globalThis.electronAPI.parseFitFile(arrayBuffer);
                    if (result && result.error) {
                        showNotification(`Error: ${result.error}\n${result.details || ""}`, "error");
                    } else {
                        globalThis.showFitData(result, file);
                        if (globalThis.sendFitFileToAltFitReader) {
                            globalThis.sendFitFileToAltFitReader(arrayBuffer);
                        }
                    }
                    await globalThis.electronAPI.addRecentFile(file);
                } catch (error) {
                    showNotification(`Error opening recent file: ${error}`, "error");
                }
                openFileBtn.disabled = false;
                setLoading(false);
            };
            items.push(item);
            menu.append(item);
        }
        function focusItem(idx) {
            for (const [i, el] of items.entries()) {
                el.style.background = i === idx ? "var(--color-glass-border)" : "transparent";
                el.style.color = i === idx ? "var(--color-fg-alt)" : "var(--color-fg)";
                if (i === idx) el.focus();
            }
            focusedIndex = idx;
        }
        menu.addEventListener("keydown", (e) => {
            switch (e.key) {
                case "ArrowDown": {
                    e.preventDefault();
                    focusItem((focusedIndex + 1) % items.length);

                    break;
                }
                case "ArrowUp": {
                    e.preventDefault();
                    focusItem((focusedIndex - 1 + items.length) % items.length);

                    break;
                }
                case "Enter": {
                    e.preventDefault();
                    items[focusedIndex].click();

                    break;
                }
                case "Escape": {
                    e.preventDefault();
                    menu.remove();

                    break;
                }
                // No default
            }
        });
        setTimeout(() => focusItem(0), 0);
        const removeMenu = (e) => {
            if (!menu.contains(e.target) && e.target !== menu) {
                menu.remove();
                document.removeEventListener("mousedown", removeMenu);
            }
        };
        document.addEventListener("mousedown", removeMenu);

        // Helper to remove menu and cleanup event listener
        function cleanupMenu() {
            if (document.body.contains(menu)) menu.remove();
            document.removeEventListener("mousedown", removeMenu);
        }

        // Remove menu and cleanup on Escape or Enter
        menu.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                cleanupMenu();
            }
        });
        // Remove menu and cleanup on item click
        for (const item of items) {
            const origOnClick = item.onclick;
            item.onclick = async () => {
                cleanupMenu();
                await origOnClick();
            };
        }

        document.body.append(menu);
        menu.focus();
    });

    // Window resize for chart rendering - use modern state management
    let chartRenderTimeout;
    window.addEventListener("resize", () => {
        if (
            document.getElementById("tab-chart")?.classList.contains("active") ||
            document.getElementById("tab-chartjs")?.classList.contains("active")
        ) {
            clearTimeout(chartRenderTimeout);
            chartRenderTimeout = setTimeout(function () {
                // Use modern chart state management for resize handling
                if (globalThis.ChartUpdater && globalThis.ChartUpdater.updateCharts) {
                    globalThis.ChartUpdater.updateCharts("window-resize");
                } else if (globalThis.renderChartJS) {
                    globalThis.renderChartJS();
                } else if (globalThis.renderChart) {
                    globalThis.renderChart(); // Legacy fallback
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
                const arrayBuffer = await globalThis.electronAPI.readFile(filePath);
                const result = await globalThis.electronAPI.parseFitFile(arrayBuffer);
                if (result && result.error) {
                    showNotification(`Error: ${result.error}\n${result.details || ""}`, "error");
                } else {
                    globalThis.showFitData(result, filePath);
                    if (globalThis.sendFitFileToAltFitReader) {
                        globalThis.sendFitFileToAltFitReader(arrayBuffer);
                    }
                }
                await globalThis.electronAPI.addRecentFile(filePath);
            } catch (error) {
                showNotification(`Error opening recent file: ${error}`, "error");
            }
            openFileBtn.disabled = false;
            setLoading(false);
        });
    }

    if (globalThis.electronAPI && globalThis.electronAPI.onIpc) {
        // Handles changes to decoder options and updates the UI or data accordingly
        globalThis.electronAPI.onIpc("decoder-options-changed", (newOptions) => {
            console.log("[DEBUG] Decoder options changed:", newOptions);
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
                            globalThis.showFitData(result, filePath);
                        }
                    })
                    .catch((error) => {
                        showNotification(`Error reloading file: ${error}`, "error");
                    })
                    .finally(() => setLoading(false));
            }
        });
        globalThis.electronAPI.onIpc("export-file", async (event, filePath) => {
            if (!globalThis.globalData) return;
            const ext = sanitizeFileExtension(filePath?.split(".").pop() ?? "");
            if (ext === "csv") {
                const container = document.getElementById("content-summary");
                if (globalThis.copyTableAsCSV && container) {
                    const csv = globalThis.copyTableAsCSV({ container, data: globalThis.globalData });
                    const blob = new Blob([csv], { type: "text/csv" });
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = buildDownloadFilename(filePath, {
                        defaultExtension: "csv",
                        fallbackBase: "export",
                    });
                    document.body.append(a);
                    a.click();
                    setTimeout(function () {
                        URL.revokeObjectURL(a.href);
                        document.body.removeChild(a);
                    }, 100);
                }
            } else if (ext === "gpx") {
                const { buildGpxFromRecords, resolveTrackNameFromLoadedFiles } = await loadGpxModule();
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

                const downloadName = buildDownloadFilename(filePath, {
                    defaultExtension: "gpx",
                    fallbackBase: trackName || "export",
                });
                const blob = new Blob([gpx], { type: "application/gpx+xml;charset=utf-8" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = downloadName;
                document.body.append(a);
                a.click();
                setTimeout(function () {
                    URL.revokeObjectURL(a.href);
                    document.body.removeChild(a);
                }, 100);
            }
        });
        globalThis.electronAPI.onIpc("show-notification", (msg, type) => {
            if (typeof showNotification === "function") showNotification(msg, type || "info", 3000);
        });
        globalThis.electronAPI.onIpc("menu-print", () => {
            globalThis.print();
        });
        globalThis.electronAPI.onIpc("menu-check-for-updates", () => {
            if (globalThis.electronAPI.send) globalThis.electronAPI.send("menu-check-for-updates");
        });
        // "Restart and Update" is executed by the main process (quitAndInstall). The menu
        // triggers a renderer event; call the explicit preload wrapper.
        globalThis.electronAPI.onIpc("menu-restart-update", () => {
            try {
                if (globalThis.electronAPI && typeof globalThis.electronAPI.installUpdate === "function") {
                    globalThis.electronAPI.installUpdate();
                }
            } catch {
                /* ignore */
            }
        });
        ensureMenuForwarder("menu-save-as");
        ensureMenuForwarder("menu-export");
        globalThis.electronAPI.onIpc("menu-about", async () => {
            // Show the about modal without any content since the styled system info
            // section will automatically load and display all the version information
            showAboutModal();
        });
        globalThis.electronAPI.onIpc("menu-keyboard-shortcuts", () => {
            console.log("Keyboard shortcuts menu clicked - starting handler");
            // Check if the keyboard shortcuts modal script is already loaded
            if (globalThis.showKeyboardShortcutsModal === undefined) {
                console.log("Modal script not loaded, loading dynamically...");
                // Load the keyboard shortcuts modal script dynamically
                const script = document.createElement("script");
                script.src = "./utils/keyboardShortcutsModal.js";
                script.onload = () => {
                    console.log("Script loaded successfully");
                    // Call the function after the script is loaded
                    if (typeof globalThis.showKeyboardShortcutsModal === "function") {
                        console.log("Calling showKeyboardShortcutsModal function");
                        globalThis.showKeyboardShortcutsModal();
                    } else {
                        console.error("showKeyboardShortcutsModal function not available after script load");
                    }
                };
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
        globalThis.electronAPI.onUpdateEvent("update-error", (err) => {
            showUpdateNotification("Update error: " + err, "error", 7000);
        });
        globalThis.electronAPI.onUpdateEvent("update-download-progress", (progress) => {
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
        globalThis.electronAPI.onIpc("set-font-size", (event, size) => {
            document.body.classList.remove("font-xsmall", "font-small", "font-medium", "font-large", "font-xlarge");
            document.body.classList.add(`font-${size}`);
        });
        globalThis.electronAPI.onIpc("set-high-contrast", (event, mode) => {
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
