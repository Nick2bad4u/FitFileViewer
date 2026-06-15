import {
    getShownFilesListRuntime,
    type ShownFilesListTimerHandle,
} from "./shownFilesListRuntime.js";

const shownFilesListRuntime = getShownFilesListRuntime();

let overlayTooltipTimeout: null | ShownFilesListTimerHandle = null;

export function getOverlayTooltipTimeout(): null | ShownFilesListTimerHandle {
    return overlayTooltipTimeout;
}

export function setOverlayTooltipTimeout(
    timeout: ShownFilesListTimerHandle
): void {
    clearOverlayTooltipTimeout();
    overlayTooltipTimeout = timeout;
}

export function clearOverlayTooltipTimeout(): void {
    if (overlayTooltipTimeout) {
        shownFilesListRuntime.clearTimeout(overlayTooltipTimeout);
        overlayTooltipTimeout = null;
    }
}
