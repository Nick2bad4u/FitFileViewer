import {
    getShownFilesListRuntime,
    type ShownFilesListRuntime,
    type ShownFilesListTimerHandle,
} from "./shownFilesListRuntime.js";

function shownFilesListRuntime(): ShownFilesListRuntime {
    return getShownFilesListRuntime();
}

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
        shownFilesListRuntime().clearTimeout(overlayTooltipTimeout);
        overlayTooltipTimeout = null;
    }
}
