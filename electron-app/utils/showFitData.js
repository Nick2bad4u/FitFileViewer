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
    
    // Reset rendering states when new data is loaded to ensure proper re-rendering
    // This fixes a regression where map/chart tabs wouldn't update with new FIT data
    // because the isRendered flags prevented re-rendering after the first render
    window.isMapRendered = false;
    window.isChartRendered = false;
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
    }    // Optionally, update UI with data (tables, charts, etc.)
    if (window.createTables && window.globalData) {
        window.createTables(window.globalData);
    }
    
    // Pre-render summary data so it's ready when user switches to summary tab
    // This ensures all tabs have their data ready, even though we default to map
    if (window.renderSummary && window.globalData) {
        window.renderSummary(window.globalData);
    }
    
    // Switch to map tab as default when file is loaded
    // Use setTimeout to ensure this happens after DOM updates and tab handlers are ready
    setTimeout(() => {
        if (window.updateTabVisibility && window.updateActiveTab) {
            window.updateTabVisibility("content-map");
            window.updateActiveTab("tab-map");
            
            // Manually trigger map rendering since we're programmatically switching tabs
            if (window.renderMap && !window.isMapRendered) {
                window.renderMap();
                window.isMapRendered = true;
            }
        }
    }, 50);

    // Create/update the global chart status indicator when data is loaded
    setTimeout(function () {
        createGlobalChartStatusIndicator();
    }, 100);
}
