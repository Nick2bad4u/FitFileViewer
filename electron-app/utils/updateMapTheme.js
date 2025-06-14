// Utility to update the Leaflet map theme (dark/light)
export function updateMapTheme() {
    const isDark = document.body.classList.contains("theme-dark");
    const leafletMap = document.getElementById("leaflet-map");
    if (leafletMap) {
        leafletMap.style.filter = isDark ? "invert(0.92) hue-rotate(180deg) brightness(0.9) contrast(1.1)" : "none";
    }
}
if (!window._mapThemeListener) {
    window._mapThemeListener = () => {
        const leafletMap = document.getElementById("leaflet-map");
        if (leafletMap) {
            const isDark = document.body.classList.contains("theme-dark");
            leafletMap.style.filter = isDark ? "invert(0.92) hue-rotate(180deg) brightness(0.9) contrast(1.1)" : "none";
        }
    };
    document.body.addEventListener("themechange", window._mapThemeListener);

    // Cleanup logic to remove the event listener
    window.addEventListener("beforeunload", () => {
        document.body.removeEventListener("themechange", window._mapThemeListener);
        delete window._mapThemeListener;
    });
}
