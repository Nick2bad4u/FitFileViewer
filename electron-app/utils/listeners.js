// Utility to set up all event listeners for the app
export function setupListeners({
    openFileBtn,
    isOpeningFileRef,
    setLoading,
    showNotification,
    handleOpenFile,
    showUpdateNotification,
    showAboutModal,
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
        event.preventDefault();
        if (!window.electronAPI?.recentFiles) return;
        const recentFiles = await window.electronAPI.recentFiles();
        if (!recentFiles || recentFiles.length === 0) {
            showNotification("No recent files found.", "info", 2000);
            return;
        }
        const oldMenu = document.getElementById("recent-files-menu");
        if (oldMenu) oldMenu.remove();
        const menu = document.createElement("div");
        menu.id = "recent-files-menu";
        menu.style.position = "fixed";
        menu.style.zIndex = 10010;
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
        recentFiles.forEach((file, idx) => {
            const parts = file.split(/\\|\//g);
            const shortName = parts.length >= 2 ? `${parts[parts.length - 2]}\\${parts[parts.length - 1]}` : parts[parts.length - 1];
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
                item.style.color = "var(--color-fg-alt)";
            };
            item.onmouseleave = () => {
                item.style.background = focusedIndex === idx ? "var(--color-glass-border)" : "transparent";
                item.style.color = "var(--color-fg)";
            };
            item.onclick = async () => {
                menu.remove();
                openFileBtn.disabled = true;
                setLoading(true);
                try {
                    let arrayBuffer = await window.electronAPI.readFile(file);
                    let result = await window.electronAPI.parseFitFile(arrayBuffer);
                    if (result && result.error) {
                        showNotification(`Error: ${result.error}\n${result.details || ""}`, "error");
                    } else {
                        window.showFitData(result, file);
                        if (window.sendFitFileToAltFitReader) {
                            window.sendFitFileToAltFitReader(arrayBuffer);
                        }
                    }
                    await window.electronAPI.addRecentFile(file);
                } catch (err) {
                    showNotification(`Error opening recent file: ${err}`, "error");
                }
                openFileBtn.disabled = false;
                setLoading(false);
            };
            items.push(item);
            menu.appendChild(item);
        });
        function focusItem(idx) {
            items.forEach((el, i) => {
                el.style.background = i === idx ? "var(--color-glass-border)" : "transparent";
                el.style.color = i === idx ? "var(--color-fg-alt)" : "var(--color-fg)";
                if (i === idx) el.focus();
            });
            focusedIndex = idx;
        }
        menu.addEventListener("keydown", (e) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                focusItem((focusedIndex + 1) % items.length);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                focusItem((focusedIndex - 1 + items.length) % items.length);
            } else if (e.key === "Enter") {
                e.preventDefault();
                items[focusedIndex].click();
            } else if (e.key === "Escape") {
                e.preventDefault();
                menu.remove();
            }
        });
        setTimeout(() => focusItem(0), 0);
        const removeMenu = (e) => {
            if (!menu.contains(e.target) && e.target !== menu) menu.remove();
            document.removeEventListener("mousedown", removeMenu);
        };
        document.addEventListener("mousedown", removeMenu);
        document.body.appendChild(menu);
        menu.focus();
    });

    // Window resize for chart rendering
    let chartRenderTimeout;
    window.addEventListener("resize", () => {
        if (document.getElementById("tab-chart")?.classList.contains("active")) {
            clearTimeout(chartRenderTimeout);
            chartRenderTimeout = setTimeout(() => {
                if (window.renderChart) window.renderChart();
            }, 200);
        }
    });

    // Electron IPC and menu listeners
    if (window.electronAPI && window.electronAPI.onMenuOpenFile && window.electronAPI.onOpenRecentFile) {
        window.electronAPI.onMenuOpenFile(() => {
            handleOpenFile({ isOpeningFileRef, openFileBtn, setLoading, showNotification });
        });
        window.electronAPI.onOpenRecentFile(async (filePath) => {
            openFileBtn.disabled = true;
            setLoading(true);
            try {
                let arrayBuffer = await window.electronAPI.readFile(filePath);
                let result = await window.electronAPI.parseFitFile(arrayBuffer);
                if (result && result.error) {
                    showNotification(`Error: ${result.error}\n${result.details || ""}`, "error");
                } else {
                    window.showFitData(result, filePath);
                    if (window.sendFitFileToAltFitReader) {
                        window.sendFitFileToAltFitReader(arrayBuffer);
                    }
                }
                await window.electronAPI.addRecentFile(filePath);
            } catch (err) {
                showNotification(`Error opening recent file: ${err}`, "error");
            }
            openFileBtn.disabled = false;
            setLoading(false);
        });
    }

    if (window.electronAPI && window.electronAPI.onIpc) {
        // Handles changes to decoder options and updates the UI or data accordingly
        window.electronAPI.onIpc("decoder-options-changed", (newOptions) => {
            console.log("[DEBUG] Decoder options changed:", newOptions);
            showNotification("Decoder options updated.", "info", 2000);
            if (window.globalData && window.globalData.cachedFilePath) {
                const filePath = window.globalData.cachedFilePath;
                setLoading(true);
                window.electronAPI
                    .readFile(filePath)
                    .then((arrayBuffer) => window.electronAPI.parseFitFile(arrayBuffer))
                    .then((result) => {
                        if (result && result.error) {
                            showNotification(`Error: ${result.error}\n${result.details || ""}`, "error");
                        } else {
                            window.showFitData(result, filePath);
                        }
                    })
                    .catch((err) => {
                        showNotification(`Error reloading file: ${err}`, "error");
                    })
                    .finally(() => setLoading(false));
            }
        });
        window.electronAPI.onIpc("export-file", async (event, filePath) => {
            if (!window.globalData) return;
            const ext = filePath.split(".").pop().toLowerCase();
            if (ext === "csv") {
                const container = document.getElementById("content-summary");
                if (window.copyTableAsCSV && container) {
                    const csv = window.copyTableAsCSV({ container, data: window.globalData });
                    const blob = new Blob([csv], { type: "text/csv" });
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = filePath.split(/[\\/]/).pop();
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                        URL.revokeObjectURL(a.href);
                        document.body.removeChild(a);
                    }, 100);
                }
            } else if (ext === "gpx") {
                if (
                    window.createExportGPXButton &&
                    window.globalData.recordMesgs &&
                    Array.isArray(window.globalData.recordMesgs) &&
                    window.globalData.recordMesgs.length > 0
                ) {
                    const coords = window.globalData.recordMesgs
                        .filter((row) => row.positionLat != null && row.positionLong != null)
                        .map((row) => [Number((row.positionLat / 2 ** 31) * 180), Number((row.positionLong / 2 ** 31) * 180)]);
                    if (coords.length > 0) {
                        let gpx = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="FitFileViewer">\n<trk><name>Exported Track</name><trkseg>`;
                        coords.forEach((c) => {
                            gpx += `\n<trkpt lat="${c[0]}" lon="${c[1]}"/>`;
                        });
                        gpx += "\n</trkseg></trk></gpx>";
                        const blob = new Blob([gpx], { type: "application/gpx+xml" });
                        const a = document.createElement("a");
                        a.href = URL.createObjectURL(blob);
                        a.download = filePath.split(/[\\/]/).pop();
                        document.body.appendChild(a);
                        a.click();
                        setTimeout(() => {
                            URL.revokeObjectURL(a.href);
                            document.body.removeChild(a);
                        }, 100);
                    } else {
                        showNotification("No valid coordinates found for GPX export.", "info", 3000);
                    }
                } else {
                    showNotification("No data available for GPX export.", "info", 3000);
                }
            }
        });
        window.electronAPI.onIpc("show-notification", (msg, type) => {
            if (typeof showNotification === "function") showNotification(msg, type || "info", 3000);
        });
        window.electronAPI.onIpc("menu-print", () => {
            window.print();
        });
        window.electronAPI.onIpc("menu-check-for-updates", () => {
            if (window.electronAPI.send) window.electronAPI.send("menu-check-for-updates");
        });
        window.electronAPI.onIpc("menu-save-as", () => {
            if (window.electronAPI.send) window.electronAPI.send("menu-save-as");
        });
        window.electronAPI.onIpc("menu-export", () => {
            if (window.electronAPI.send) window.electronAPI.send("menu-export");
        });
        window.electronAPI.onIpc("menu-about", async () => {
            // Show the about modal without any content since the styled system info
            // section will automatically load and display all the version information
            showAboutModal();
        });
        window.electronAPI.onIpc("menu-keyboard-shortcuts", () => {
            console.log("Keyboard shortcuts menu clicked - starting handler");
            // Check if the keyboard shortcuts modal script is already loaded
            if (typeof window.showKeyboardShortcutsModal === "undefined") {
                console.log("Modal script not loaded, loading dynamically...");
                // Load the keyboard shortcuts modal script dynamically
                const script = document.createElement("script");
                script.src = "./utils/keyboardShortcutsModal.js";
                script.onload = () => {
                    console.log("Script loaded successfully");
                    // Call the function after the script is loaded
                    if (typeof window.showKeyboardShortcutsModal === "function") {
                        console.log("Calling showKeyboardShortcutsModal function");
                        window.showKeyboardShortcutsModal();
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
                document.head.appendChild(script);
            } else {
                console.log("Modal script already loaded, calling function directly");
                // Function is already available, call it directly
                window.showKeyboardShortcutsModal();
            }
        });
    }

    // Auto-Updater Event Listeners
    if (window.electronAPI && window.electronAPI.onUpdateEvent) {
        window.electronAPI.onUpdateEvent("update-checking", () => {
            showUpdateNotification("Checking for updates...", "info", 3000);
        });
        window.electronAPI.onUpdateEvent("update-available", () => {
            showUpdateNotification("Update available! Downloading...", 4000);
        });
        window.electronAPI.onUpdateEvent("update-not-available", () => {
            showUpdateNotification("You are using the latest version.", "success", 4000);
        });
        window.electronAPI.onUpdateEvent("update-error", (err) => {
            showUpdateNotification("Update error: " + err, "error", 7000);
        });
        window.electronAPI.onUpdateEvent("update-download-progress", (progress) => {
            if (progress && typeof progress.percent === "number") {
                showUpdateNotification(`Downloading update: ${Math.round(progress.percent)}%`, "info", 2000);
            } else {
                showUpdateNotification("Downloading update: progress information unavailable.", "info", 2000);
            }
        });
        window.electronAPI.onUpdateEvent("update-downloaded", () => {
            showUpdateNotification(
                "Update downloaded! Restart to install the update now, or choose Later to finish your work.",
                "success",
                0,
                "update-downloaded"
            );
        });
    }

    // Accessibility Event Listeners
    if (window.electronAPI && window.electronAPI.onIpc) {
        window.electronAPI.onIpc("set-font-size", (event, size) => {
            document.body.classList.remove("font-xsmall", "font-small", "font-medium", "font-large", "font-xlarge");
            document.body.classList.add(`font-${size}`);
        });
        window.electronAPI.onIpc("set-high-contrast", (event, mode) => {
            document.body.classList.remove("high-contrast", "high-contrast-white", "high-contrast-yellow");
            if (mode === "black") {
                document.body.classList.add("high-contrast");
            } else if (mode === "white") {
                document.body.classList.add("high-contrast-white");
            } else if (mode === "yellow") {
                document.body.classList.add("high-contrast-yellow");
            }
        });
    }
}
