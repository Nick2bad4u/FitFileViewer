const overlayCache = new WeakMap();

export function removeExitFullscreenOverlay(container) {
    let overlay = overlayCache.get(container);
    if (!overlay) {
        overlay = container.querySelector(".exit-fullscreen-overlay");
        if (overlay) {
            overlayCache.set(container, overlay);
        }
    }
    if (overlay) {
        if (typeof overlay.remove === "function") {
            overlay.remove();
        } else if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
        overlayCache.delete(container);
    }
}
