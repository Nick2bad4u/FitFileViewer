export function scheduleOverlayMapRender(source: string): void {
    void import("../../maps/core/renderMap.js")
        .then(({ renderMap }) => {
            renderMap();
        })
        .catch((error: unknown) => {
            console.warn(`[${source}] Failed to refresh overlay map:`, error);
        });
}
