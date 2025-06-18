/* global */
// utils/showFitData.js

import { createGlobalChartStatusIndicator } from "./chartStatusIndicator.js";

/**
 * Show FIT data in the UI. Used by Electron main process.
 * @param {Object} data - Parsed FIT file data.
 * @param {string} filePath - Path to the FIT file.
 */
export function showFitData(data, filePath) {
    window.globalData = data;
    if (filePath) {
        // Show just the filename, not the full path
        let fileName = window.globalData.cachedFileName;
        if (!fileName || window.globalData.cachedFilePath !== filePath) {
            fileName = filePath.split(/[\\/]/).pop();
            window.globalData.cachedFileName = fileName;
            window.globalData.cachedFilePath = filePath;
        }
        const fileSpan = document.getElementById("activeFileName");
        const unloadBtn = document.getElementById("unloadFileBtn");
        const fileNameContainer = document.getElementById("activeFileNameContainer");
        if (fileNameContainer) {
            fileNameContainer.classList.add("has-file");
        }
        if (fileSpan) {
            fileSpan.classList.remove("marquee");
            fileSpan.innerHTML = `<span class="active-label">Active:</span> ${fileName}`;
            fileSpan.title = fileName;
            fileSpan.scrollLeft = 0;
        }
        if (unloadBtn) {
            unloadBtn.style.display = "";
        }
        // Enable tab buttons when a file is loaded
        if (window.setTabButtonsEnabled) window.setTabButtonsEnabled(true);
        document.title = fileName ? `Fit File Viewer - ${fileName}` : "Fit File Viewer";
        if (window.electronAPI && window.electronAPI.send) {
            window.electronAPI.send("fit-file-loaded", filePath);
        }
        // Dispatch event for Chart.js and other listeners
        window.dispatchEvent(new Event("fitfile-loaded"));
    }

    // Optionally, update UI with data (tables, charts, etc.)
    if (window.displayTables && window.globalData) {
        window.displayTables(window.globalData);
    }
    if (window.renderChart && window.globalData) {
        window.renderChart();
    }
    if (window.renderMap && window.globalData) {
        window.renderMap();
    }
    if (window.renderSummary && window.globalData) {
        window.renderSummary(window.globalData);
    }

    // Create/update the global chart status indicator when data is loaded
    setTimeout(function () {
        createGlobalChartStatusIndicator();
    }, 100);
}
