// Utility for setting up theme
export async function setupTheme(applyTheme, listenForThemeChange) {
    let theme = "dark";
    if (window.electronAPI && typeof window.electronAPI.getTheme === "function") {
        try {
            theme = await window.electronAPI.getTheme();
        } catch {
            console.warn("Could not get theme from main process, defaulting to dark.");
        }
    }
    applyTheme(theme);
    listenForThemeChange(applyTheme);
}
