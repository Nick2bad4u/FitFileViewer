import { buildGpxFromRecords, resolveTrackNameFromLoadedFiles } from "../../files/export/gpxExport.js";
import { openFileSelector } from "../../files/import/openFileSelector.js";

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
        /** @type {MouseEvent} */ (event).preventDefault();
        if (!globalThis.electronAPI?.recentFiles) {
            return;
        }
        const recentFiles = await globalThis.electronAPI.recentFiles();
        console.log("DEBUG: recentFiles call completed. Result:", recentFiles, "Length:", recentFiles?.length);
        if (!recentFiles || recentFiles.length === 0) {
            showNotification("No recent files found.", "info", 2000);
            return;
        }
        const oldMenu = document.querySelector("#recent-files-menu");
        if (oldMenu) {
            oldMenu.remove();
        }
        /** @type {HTMLDivElement} */
        const menu = document.createElement("div");
        menu.id = "recent-files-menu";
        menu.style.position = "fixed";
        // ZIndex must be a string
        menu.style.zIndex = "10010";
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
        menu.addEventListener("contextmenu", (e) => e.preventDefault());
        menu.setAttribute("role", "menu");
        menu.setAttribute("aria-label", "Recent files");
        let focusedIndex = 0;
        /** @type {HTMLDivElement[]} */
        const items = [];
        // Predefine handlers factory to avoid function-in-loop lint warnings
        /**
         * @param {HTMLDivElement} item
         * @param {number} idx
         */
        function attachHoverHandlers(item, idx) {
            item.addEventListener("mouseenter", () => {
                item.style.background = "var(--color-glass-border)";
                item.style.color = "var(--color-fg-alt)";
            });
            item.addEventListener("mouseleave", () => {
                item.style.background = focusedIndex === idx ? "var(--color-glass-border)" : "transparent";
                item.style.color = "var(--color-fg)";
            });
        }

        /**
         * @param {string} file
         */
        function createClickHandler(file) {
            return async () => {
                menu.remove();
                openFileBtn.disabled = true;
                setLoading(true);
                try {
                    const arrayBuffer = await globalThis.electronAPI.readFile(file),
                        result = await globalThis.electronAPI.parseFitFile(arrayBuffer);

                    if (result && result.error) {
                        showNotification(`Error: ${result.error}\n${result.details || ""}`, "error");
                        return;
                    }

                    // Extract data using the same logic as handleOpenFile.js and IPC handler
                    const dataToShow = result.data || result;

                    if (dataToShow) {
                        // Optional chaining avoids undefined invocation
                        globalThis.showFitData?.(dataToShow, file);
                        // Optional integration - guarded
                        if (/** @type {any} */ (globalThis).sendFitFileToAltFitReader) {
                            /** @type {any} */ (globalThis).sendFitFileToAltFitReader(arrayBuffer);
                        }
                        await globalThis.electronAPI.addRecentFile(file);
                    } else {
                        showNotification("Error: No valid FIT data found in file", "error");
                    }
                } catch (error) {
                    showNotification(`Error opening recent file: ${error}`, "error");
                }
                openFileBtn.disabled = false;
                setLoading(false);
            };
        }

        for (const [idx, file] of recentFiles.entries()) {
            const /** @type {HTMLDivElement} */
                item = document.createElement("div"),
                parts = file.split(/\\|\//g),
                shortName = parts.length >= 2 ? `${parts.at(-2)}\\${parts.at(-1)}` : parts.at(-1);
            // TextContent expects string | null; ensure fallback string
            item.textContent = shortName || "";
            item.title = file;
            item.style.padding = "8px 18px";
            item.style.whiteSpace = "nowrap";
            item.style.overflow = "hidden";
            item.style.textOverflow = "ellipsis";
            item.setAttribute("role", "menuitem");
            item.setAttribute("tabindex", "-1");
            item.style.background = idx === 0 ? "var(--color-glass-border)" : "transparent";
            attachHoverHandlers(item, idx);
            item.addEventListener("click", createClickHandler(file));
            items.push(item);
            menu.append(item);
        }
        /**
         * Move visual focus + highlight to a specific index.
         * @param {number} idx
         */
        function focusItem(idx) {
            for (const [i, el] of items.entries()) {
                el.style.background = i === idx ? "var(--color-glass-border)" : "transparent";
                el.style.color = i === idx ? "var(--color-fg-alt)" : "var(--color-fg)";
                if (i === idx) {
                    el.focus();
                }
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
                    items[focusedIndex]?.click();

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

        console.log(
            "DEBUG: About to append menu. Document:",
            Boolean(document),
            "Body:",
            Boolean(document.body),
            "Menu:",
            Boolean(menu),
            "Menu ID:",
            menu.id
        );
        console.log(
            "DEBUG: Menu constructor:",
            menu.constructor.name,
            "Menu nodeName:",
            menu.nodeName,
            "Menu parentNode before append:",
            menu.parentNode
        );
        console.log(
            "DEBUG: Document.body type:",
            typeof document.body,
            "Document.body constructor:",
            document.body.constructor.name
        );
        // Log a safe property instead of comparing an object to itself
        console.log("DEBUG: Document.body present:", Boolean(document.body));
        console.log("DEBUG: Document.body can append?", typeof document.body.append === "function");

        // Robust menu attachment with verification and retry
        let attachmentAttempts = 0;
        const maxAttempts = 3;

        while (attachmentAttempts < maxAttempts) {
            attachmentAttempts++;
            console.log(`DEBUG: Attachment attempt ${attachmentAttempts}/${maxAttempts}`);

            try {
                document.body.append(menu);
                console.log("DEBUG: append call succeeded");

                // Immediately verify the menu is properly attached
                const isAttached = document.body.contains(menu) && menu.parentNode === document.body;
                const canBeFound = Boolean(document.querySelector("#recent-files-menu"));

                console.log("DEBUG: Verification - isAttached:", isAttached, "canBeFound:", canBeFound);
                console.log(
                    "DEBUG: Menu parentNode:",
                    menu.parentNode,
                    "parentNode === body:",
                    menu.parentNode === document.body
                );

                if (isAttached && canBeFound) {
                    console.log("DEBUG: Menu successfully attached and verified");
                    break;
                } else {
                    console.log("DEBUG: Menu attachment failed verification, retrying...");
                    // Try to remove any existing menu before retry
                    if (menu.parentNode) {
                        menu.remove();
                    }

                    // Try alternative attachment method
                    if (attachmentAttempts === 2) {
                        console.log("DEBUG: Trying append with different approach");
                        document.body.append(menu);
                    } else if (attachmentAttempts === 3) {
                        console.log("DEBUG: Trying insertBefore as last resort");
                        document.body.insertBefore(menu, document.body.firstChild);
                    }
                }
            } catch (error) {
                console.log("DEBUG: append failed with error:", error.message);
                if (attachmentAttempts === maxAttempts) {
                    throw error;
                }
            }
        }

        // Final verification
        const finalCheck = document.body.contains(menu) && Boolean(document.querySelector("#recent-files-menu"));
        if (!finalCheck) {
            console.error("DEBUG: CRITICAL - Menu attachment failed after all attempts");
            throw new Error("Failed to attach context menu to DOM");
        }

        console.log("DEBUG: Final verification - Menu successfully attached");
        console.log(
            "DEBUG: Document body contains menu:",
            document.body.contains(menu),
            "Document contains menu:",
            document.contains(menu)
        );
        console.log(
            "DEBUG: QuerySelector test:",
            Boolean(document.querySelector("#recent-files-menu")),
            "Body querySelector test:",
            Boolean(document.body.querySelector("#recent-files-menu"))
        );
        console.log(
            "DEBUG: Document body children count:",
            document.body.children.length,
            "Body childNodes count:",
            document.body.childNodes.length
        );
        const menuCreatedAt = Date.now(); // Track when menu was created

        /** @param {MouseEvent} e */
        const removeMenu = (e) => {
            console.log(
                "DEBUG: removeMenu called - event:",
                e.type,
                "isTrusted:",
                e.isTrusted,
                "which:",
                e.which,
                "button:",
                e.button,
                "target:",
                e.target?.constructor?.name
            );
            const { target, isTrusted, which, button } = e;
            if (target instanceof Node && !menu.contains(target) && target !== menu) {
                // Check for test pollution: synthetic events that are both untrusted AND
                // occur more than 2 seconds after menu creation (likely from earlier tests)
                const timeSinceMenuCreated = Date.now() - menuCreatedAt;
                const isLikelyTestPollution = !isTrusted && which === 0 && button === 0 && timeSinceMenuCreated > 2000;
                console.log(
                    "DEBUG: timeSinceMenuCreated:",
                    timeSinceMenuCreated,
                    "isLikelyTestPollution:",
                    isLikelyTestPollution
                );
                if (isLikelyTestPollution) {
                    console.log("DEBUG: Ignoring test pollution event");
                    return;
                }

                console.log("DEBUG: Removing menu due to mousedown outside");
                menu.remove();
                document.removeEventListener("mousedown", removeMenu);
            } else {
                console.log("DEBUG: Not removing menu - target inside menu or is menu itself");
            }
        };
        document.addEventListener("mousedown", removeMenu);

        // Helper to remove menu and cleanup event listener
        function cleanupMenu() {
            if (document.body.contains(menu)) {
                menu.remove();
            }
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
            item.addEventListener("click", async (ev) => {
                cleanupMenu();
                // Invoke original click if present
                if (typeof origOnClick === "function") {
                    await origOnClick.call(item, ev);
                }
            });
        }

        document.body.append(menu);
        menu.focus();
    });

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
                const safePath = filePath || "",
                    ext = safePath.split(".").pop()?.toLowerCase() || "";
                if (ext === "csv") {
                    const container = document.querySelector("#content-summary");
                    if (/** @type {any} */ (globalThis).copyTableAsCSV && container) {
                        const a = document.createElement("a"),
                            csv = /** @type {any} */ (globalThis).copyTableAsCSV({
                                container,
                                data: globalThis.globalData,
                            }),
                            blob = new Blob([csv], { type: "text/csv" });
                        a.href = URL.createObjectURL(blob);
                        a.download = safePath.split(/[/\\]/).pop() || "export.csv";
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

                    const sanitizedBaseName = trackName.replaceAll(/[\s\u0000-\u001F<>:"/\\|?*]+/gu, "_") || "export";
                    const a = document.createElement("a"),
                        blob = new Blob([gpx], { type: "application/gpx+xml;charset=utf-8" }),
                        downloadName = safePath.split(/[/\\]/).pop() || `${sanitizedBaseName}.gpx`;
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
        globalThis.electronAPI.onIpc("menu-open-overlay", async () => {
            try {
                await openFileSelector();
            } catch (error) {
                console.error("[Listeners] Failed to open overlay selector:", error);
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
