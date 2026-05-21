import { detectCurrentTheme } from "../theming/chartThemeUtils.js";
import { createChartZoomPluginConfig } from "./renderChartZoomConfig.js";
/**
 * Resolves theme-dependent chart render inputs.
 *
 * @param input - Current render theme state.
 *
 * @returns Theme-dependent configuration consumed by chart renderers.
 */
export function resolveChartThemeRenderPlan(input) {
    const currentTheme = detectCurrentTheme();
    const zoomPluginConfig = createChartZoomPluginConfig(input.themeConfig);
    if (input.isDebugLoggingEnabled) {
        console.log("[renderChartsWithData] Detected theme:", currentTheme);
    }
    return { zoomPluginConfig };
}
