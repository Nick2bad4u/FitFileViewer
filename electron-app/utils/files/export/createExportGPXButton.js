import { getThemeColors } from "../../charts/theming/getThemeColors.js";
import { getGlobalData } from "../../state/domain/globalDataState.js";

/**
 * Creates an Export GPX button for exporting the current track as a GPX file.
 * The button uses inline SVG icons and exports the track from globalData.
 * @returns {HTMLButtonElement} The configured Export GPX button element
 */
export function createExportGPXButton() {
    const exportBtn = document.createElement("button");
    const themeColors = getThemeColors();
    exportBtn.className = "map-action-btn";
    exportBtn.innerHTML = `
        <svg class="icon" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
            <path d="M10 2 L10 12 M10 12 L7 9 M10 12 L13 9" stroke="${themeColors.primary}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="3" y="14" width="14" height="4" rx="1" fill="none" stroke="${themeColors.primary}" stroke-width="1.5"/>
        </svg>
        <span>Export GPX</span>
    `;
    exportBtn.title = "Export the current track as a GPX file";
    exportBtn.addEventListener("click", () => {
        const globalData = getGlobalData();
        if (!globalData || !Array.isArray(globalData.recordMesgs)) {
            return;
        }
        const SEMICIRCLE_DIVISOR = 2_147_483_647, // 2 ** 31 - 1, per FIT protocol
            coords = globalData.recordMesgs
                .filter(/** @param {any} row */(row) => row.positionLat != null && row.positionLong != null)
                .map(
                    /** @param {any} row */(row) => [
                        Number((row.positionLat / SEMICIRCLE_DIVISOR) * 180),
                        Number((row.positionLong / SEMICIRCLE_DIVISOR) * 180),
                    ]
                );
        let gpx = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="FitFileViewer">\n<trk><name>Exported Track</name><trkseg>`;
        for (const c of coords) {
            gpx += `\n<trkpt lat="${c[0]}" lon="${c[1]}"/>`;
        }

        gpx += "\n</trkseg></trk></gpx>";
        const a = document.createElement("a"),
            blob = new Blob([gpx], { type: "application/gpx+xml" }),
            url = URL.createObjectURL(blob);
        a.href = url;
        a.download = "track.gpx";
        a.click();
        // Revoke the object URL after the download has started to avoid issues in some browsers
        setTimeout(() => URL.revokeObjectURL(url), 100);
    });
    return exportBtn;
}
