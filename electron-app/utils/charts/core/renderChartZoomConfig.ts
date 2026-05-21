import { sanitizeCssColorToken } from "../../dom/index.js";
import { getRecordValue } from "./renderChartModuleHelpers.js";

interface ChartZoomPluginConfig {
    limits: {
        x: {
            max: "original";
            min: "original";
        };
    };
    pan: {
        enabled: true;
        mode: "x";
        modifierKey: null;
    };
    zoom: {
        drag: {
            backgroundColor: string;
            borderColor: string;
            borderWidth: 2;
            enabled: true;
            modifierKey: "shift";
        };
        mode: "x";
        pinch: {
            enabled: true;
        };
        wheel: {
            enabled: true;
            modifierKey: "ctrl";
            speed: 0.1;
        };
    };
}

function getThemeColor(
    themeConfig: unknown,
    colorName: string,
    fallback: string
): string {
    return sanitizeCssColorToken(
        getRecordValue(getRecordValue(themeConfig, "colors"), colorName),
        fallback
    );
}

/**
 * Creates the shared chart zoom plugin configuration.
 *
 * @param themeConfig - Theme configuration object from the renderer theme layer.
 * @returns Chart.js zoom plugin configuration.
 */
export function createChartZoomPluginConfig(
    themeConfig: unknown
): ChartZoomPluginConfig {
    const zoomDragBackgroundColor = getThemeColor(
        themeConfig,
        "primaryAlpha",
        "rgba(59, 130, 246, 0.2)"
    );
    const zoomDragBorderColor = getThemeColor(
        themeConfig,
        "primary",
        "rgba(59, 130, 246, 0.8)"
    );

    return {
        limits: {
            x: {
                max: "original",
                min: "original",
            },
        },
        pan: {
            enabled: true,
            mode: "x",
            modifierKey: null,
        },
        zoom: {
            drag: {
                backgroundColor: zoomDragBackgroundColor,
                borderColor: zoomDragBorderColor,
                borderWidth: 2,
                enabled: true,
                modifierKey: "shift",
            },
            mode: "x",
            pinch: {
                enabled: true,
            },
            wheel: {
                enabled: true,
                modifierKey: "ctrl",
                speed: 0.1,
            },
        },
    };
}
