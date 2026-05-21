import { detectCurrentTheme } from "../theming/chartThemeUtils.js";
import { createChartZoomPluginConfig } from "./renderChartZoomConfig.js";

interface ChartThemeRenderPlanInput {
    readonly isDebugLoggingEnabled: boolean;
    readonly themeConfig: unknown;
}

interface ChartThemeRenderPlan {
    readonly zoomPluginConfig: ReturnType<typeof createChartZoomPluginConfig>;
}

/**
 * Resolves theme-dependent chart render inputs.
 *
 * @param input - Current render theme state.
 *
 * @returns Theme-dependent configuration consumed by chart renderers.
 */
export function resolveChartThemeRenderPlan(
    input: ChartThemeRenderPlanInput
): ChartThemeRenderPlan {
    const currentTheme = detectCurrentTheme();
    const zoomPluginConfig = createChartZoomPluginConfig(input.themeConfig);

    if (input.isDebugLoggingEnabled) {
        console.log("[renderChartsWithData] Detected theme:", currentTheme);
    }

    return { zoomPluginConfig };
}
