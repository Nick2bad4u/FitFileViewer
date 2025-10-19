import { getThemeColors } from "../../charts/theming/getThemeColors.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import { buildGpxFromRecords, resolveTrackNameFromLoadedFiles } from "./gpxExport.js";

/**
 * Creates an Export GPX button for exporting the current track as a GPX file.
 * The button uses the current theme colors and exports the track from globalData.
 * @returns {HTMLButtonElement} The configured Export GPX button element
 */
export function createExportGPXButton() {
    const exportBtn = document.createElement("button");
    exportBtn.className = "map-action-btn";
    const themeColors = getThemeColors();
    exportBtn.innerHTML = `<svg class="icon" viewBox="0 0 20 20" width="18" height="18"><path d="M10 2v12M10 14l-4-4m4 4l4-4" stroke="${themeColors.primary}" stroke-width="2" fill="none"/><rect x="4" y="16" width="12" height="2" rx="1" fill="${themeColors.primary}"/></svg> <span>Export GPX</span>`;
    exportBtn.title = "Export the current track as a GPX file";
    exportBtn.addEventListener("click", () => {
        const windowCtx = /** @type {any} */ (globalThis);
        const records = Array.isArray(windowCtx?.globalData?.recordMesgs)
            ? windowCtx.globalData.recordMesgs
            : null;

        if (!records || records.length === 0) {
            showNotification("No data available for GPX export.", "info", 3000);
            return;
        }

        const trackName = resolveTrackNameFromLoadedFiles(windowCtx?.loadedFitFiles);
        const gpx = buildGpxFromRecords(records, { trackName });
        if (!gpx) {
            showNotification("No valid coordinates found for GPX export.", "info", 3000);
            return;
        }

        const downloadNameBase = trackName.replaceAll(/[\s\u0000-\u001F<>:"/\\|?*]+/gu, "_") || "track";
        const a = document.createElement("a"),
            blob = new Blob([gpx], { type: "application/gpx+xml;charset=utf-8" }),
            url = URL.createObjectURL(blob);
        a.href = url;
        a.download = `${downloadNameBase}.gpx`;
        a.click();
        // Revoke the object URL after the download has started to avoid issues in some browsers
        setTimeout(() => URL.revokeObjectURL(url), 100);
    });
    return exportBtn;
}
