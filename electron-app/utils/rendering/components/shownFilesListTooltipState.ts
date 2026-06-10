let overlayTooltipTimeout: null | ReturnType<typeof setTimeout> = null;

export function getOverlayTooltipTimeout(): null | ReturnType<
    typeof setTimeout
> {
    return overlayTooltipTimeout;
}

export function setOverlayTooltipTimeout(
    timeout: ReturnType<typeof setTimeout>
): void {
    clearOverlayTooltipTimeout();
    overlayTooltipTimeout = timeout;
}

export function clearOverlayTooltipTimeout(): void {
    if (overlayTooltipTimeout) {
        clearTimeout(overlayTooltipTimeout);
        overlayTooltipTimeout = null;
    }
}
