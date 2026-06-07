import { getThemeColors } from "../../charts/theming/getThemeColors.js";
import { sanitizeCssColorToken } from "../../dom/index.js";
import { getGlobalData } from "../../state/core/globalDataStore.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import { buildDownloadFilename } from "../sanitizeFilename.js";
import {
    buildGpxFromRecords,
    type GpxRecord,
    type LoadedFitFileDescriptor,
    resolveTrackNameFromLoadedFiles,
} from "./gpxExport.js";

type GpxExportGlobal = typeof globalThis & {
    loadedFitFiles?: LoadedFitFileDescriptor[];
};

type GpxExportData = {
    readonly loadedFitFiles?: LoadedFitFileDescriptor[];
    readonly recordMesgs?: GpxRecord[];
};

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const downloadCleanupTimers = new WeakMap<
    HTMLAnchorElement,
    ReturnType<typeof setTimeout>
>();

function getGpxExportGlobal(): GpxExportGlobal {
    return globalThis;
}

function getGpxExportData(): GpxExportData | null | undefined {
    return getGlobalData<GpxExportData>();
}

function createExportIcon(primary: string): SVGSVGElement {
    const svg = document.createElementNS(SVG_NAMESPACE, "svg");
    svg.classList.add("icon");
    svg.setAttribute("viewBox", "0 0 20 20");
    svg.setAttribute("width", "18");
    svg.setAttribute("height", "18");

    const path = document.createElementNS(SVG_NAMESPACE, "path");
    path.setAttribute("d", "M10 2v12M10 14l-4-4m4 4l4-4");
    path.setAttribute("stroke", primary);
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");
    svg.append(path);

    const rect = document.createElementNS(SVG_NAMESPACE, "rect");
    rect.setAttribute("x", "4");
    rect.setAttribute("y", "16");
    rect.setAttribute("width", "12");
    rect.setAttribute("height", "2");
    rect.setAttribute("rx", "1");
    rect.setAttribute("fill", primary);
    svg.append(rect);

    return svg;
}

/**
 * Creates an Export GPX button for exporting the current track as a GPX file.
 * The button uses the current theme colors and exports the track from
 * globalData.
 */
export function createExportGPXButton(): HTMLButtonElement {
    const exportBtn = document.createElement("button");
    exportBtn.className = "map-action-btn";
    const themeColors = getThemeColors();
    const primary = sanitizeCssColorToken(themeColors["primary"], "#3b82f6");
    const label = document.createElement("span");
    label.textContent = "Export GPX";
    exportBtn.append(createExportIcon(primary), label);
    exportBtn.title = "Export the current track as a GPX file";
    const listenerController = new AbortController();
    exportBtn.addEventListener(
        "click",
        () => {
            const windowCtx = getGpxExportGlobal();
            const fitData = getGpxExportData();
            const records = Array.isArray(fitData?.recordMesgs)
                ? fitData.recordMesgs
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
                fitData?.loadedFitFiles ?? windowCtx?.loadedFitFiles
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

            const downloadName = buildDownloadFilename(trackName, {
                defaultExtension: "gpx",
                fallbackBase: "track",
            });

            const blob = new Blob([gpx], {
                type: "application/gpx+xml;charset=utf-8",
            });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = downloadName;
            document.body.append(link);
            link.click();
            const cleanupTimer = globalThis.setTimeout(() => {
                downloadCleanupTimers.delete(link);
                URL.revokeObjectURL(link.href);
                link.remove();
            }, 100);
            downloadCleanupTimers.set(link, cleanupTimer);
        },
        { signal: listenerController.signal }
    );
    return exportBtn;
}
