import { getThemeColors } from "../../charts/theming/getThemeColors.js";

/**
 * Creates an Export GPX button for exporting the current track as a GPX file.
 * The button uses the current theme colors and exports the track from globalData.
 * @returns {HTMLButtonElement} The configured Export GPX button element
 */
export function createExportGPXButton() {
    const exportBtn = document.createElement("button");
    exportBtn.className = "map-action-btn";
    const themeColors = getThemeColors();
    exportBtn.innerHTML = `<svg class="icon" viewBox="0 0 20 20" width="18" height="18"><path d="M10 2v12M10 14l-4-4m4 4l4-4" stroke="${themeColors["primary"]}" stroke-width="2" fill="none"/><rect x="4" y="16" width="12" height="2" rx="1" fill="${themeColors["primary"]}"/></svg> <span>Export GPX</span>`;
    exportBtn.title = "Export the current track as a GPX file";
    exportBtn.onclick = () => {
        if (!window.globalData || !window.globalData.recordMesgs || !Array.isArray(window.globalData.recordMesgs))
            return;
        const SEMICIRCLE_DIVISOR = 2147483647; // 2 ** 31 - 1, per FIT protocol
        const coords = window.globalData.recordMesgs
            .filter(/** @param {any} row */ (row) => row.positionLat != null && row.positionLong != null)
            .map(
                /** @param {any} row */ (row) => [
                    Number((row.positionLat / SEMICIRCLE_DIVISOR) * 180),
                    Number((row.positionLong / SEMICIRCLE_DIVISOR) * 180),
                ]
            );
        let gpx = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="FitFileViewer">\n<trk><name>Exported Track</name><trkseg>`;
        coords.forEach(
            /** @param {any} c */ (c) => {
                gpx += `\n<trkpt lat="${c[0]}" lon="${c[1]}"/>`;
            }
        );
        gpx += "\n</trkseg></trk></gpx>";
        const blob = new Blob([gpx], { type: "application/gpx+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "track.gpx";
        a.click();
        // Revoke the object URL after the download has started to avoid issues in some browsers
        setTimeout(() => URL.revokeObjectURL(url), 100);
    };
    return exportBtn;
}
