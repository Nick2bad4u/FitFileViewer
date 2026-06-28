import { getThemeColors } from "../../charts/theming/getThemeColors.js";
import { sanitizeCssColorToken } from "../../dom/index.js";
import { getActiveFitFileMetadata } from "../../state/domain/activeFitFileMetadataState.js";
import { getActiveFitRouteData } from "../../state/domain/fitRouteDataState.js";
import { getLoadedFitFiles } from "../../state/domain/loadedFitFilesState.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import { buildDownloadFilename } from "../sanitizeFilename.js";
import {
    getCreateExportGPXButtonRuntime,
    type CreateExportGPXButtonRuntime,
    type CreateExportGPXButtonTimer,
} from "./createExportGPXButtonRuntime.js";
import {
    buildGpxFromRecords,
    resolveTrackNameFromFileIdentity,
    resolveTrackNameFromLoadedFiles,
} from "./gpxExport.js";

const downloadCleanupTimers = new WeakMap<
    HTMLAnchorElement,
    CreateExportGPXButtonTimer
>();

function createExportIcon(
    runtime: CreateExportGPXButtonRuntime,
    primary: string
): SVGSVGElement {
    const svg = runtime.createSvgElement("svg");
    svg.classList.add("icon");
    svg.setAttribute("viewBox", "0 0 20 20");
    svg.setAttribute("width", "18");
    svg.setAttribute("height", "18");

    const path = runtime.createSvgElement("path");
    path.setAttribute("d", "M10 2v12M10 14l-4-4m4 4l4-4");
    path.setAttribute("stroke", primary);
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");
    svg.append(path);

    const rect = runtime.createSvgElement("rect");
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
 * The button uses the current theme colors and exports the track from explicit
 * FIT route state.
 */
export function createExportGPXButton(): HTMLButtonElement {
    const runtime = getCreateExportGPXButtonRuntime();
    const exportBtn = runtime.createButton();
    exportBtn.className = "map-action-btn";
    const themeColors = getThemeColors();
    const primary = sanitizeCssColorToken(themeColors["primary"], "#3b82f6");
    const label = runtime.createElement("span");
    label.textContent = "Export GPX";
    exportBtn.append(createExportIcon(runtime, primary), label);
    exportBtn.title = "Export the current track as a GPX file";
    const listenerController = runtime.createAbortController();
    exportBtn.addEventListener(
        "click",
        () => {
            const routeData = getActiveFitRouteData();

            if (routeData.totalRecords === 0) {
                showNotification(
                    "No data available for GPX export.",
                    "info",
                    3000
                );
                return;
            }

            if (!routeData.ready) {
                showNotification(
                    "No valid coordinates found for GPX export.",
                    "info",
                    3000
                );
                return;
            }

            const fallbackTrackName = resolveTrackNameFromFileIdentity(
                getActiveFitFileMetadata({
                    sourceData: routeData.rawData,
                }).storageIdentity
            );
            const trackName = resolveTrackNameFromLoadedFiles(
                getLoadedFitFiles(),
                fallbackTrackName
            );
            const gpx = buildGpxFromRecords(routeData.recordMesgs, {
                trackName,
            });
            if (gpx === null || gpx.length === 0) {
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
            const link = runtime.createElement("a");
            link.href = runtime.createObjectURL(blob);
            link.download = downloadName;
            runtime.appendToBody(link);
            link.click();
            const cleanupTimer = runtime.setTimeout(() => {
                downloadCleanupTimers.delete(link);
                runtime.revokeObjectURL(link.href);
                link.remove();
            }, 100);
            downloadCleanupTimers.set(link, cleanupTimer);
        },
        { signal: listenerController.signal }
    );
    return exportBtn;
}
