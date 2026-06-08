import { isDevelopmentEnvironment } from "../../runtime/processEnvironment.js";
import { showNotification } from "../../ui/notifications/showNotification.js";
import { resolveChartRuntime } from "../core/chartRuntime.js";
import { updateChartAnimations } from "../core/updateChartAnimations.js";
import { detectCurrentTheme } from "../theming/chartThemeUtils.js";
import {
    buildEnhancedChartConfig,
    type CreateEnhancedChartOptions,
    type EnhancedChartConfig,
} from "./createEnhancedChartConfig.js";

type EnhancedChartInstance = object;

type ChartConstructor = new (
    canvas: HTMLCanvasElement,
    config: EnhancedChartConfig
) => EnhancedChartInstance;

interface ChartDebugGlobal {
    readonly __FFV_debugCharts?: unknown;
}

const chartGlobal = globalThis as typeof globalThis & ChartDebugGlobal;

function isChartConstructor(value: unknown): value is ChartConstructor {
    return typeof value === "function";
}

function resolveTheme(theme: string | undefined): string {
    return theme && theme !== "auto" ? theme : detectCurrentTheme();
}

function logThemeDebug(
    field: string,
    theme: string | undefined,
    currentTheme: string
): void {
    if (!isDevelopmentEnvironment() || !chartGlobal.__FFV_debugCharts) {
        return;
    }

    console.log("[ChartJS] Theme debugging for field:", field);
    console.log("[ChartJS] - theme param:", theme);
    console.log("[ChartJS] - resolved theme:", currentTheme);
}

function notifyChartCreationError(field: string): void {
    void showNotification(`Error creating chart for ${field}`, "error", 5000);
}

/**
 * Creates a Chart.js chart with FitFileViewer display settings.
 */
export function createEnhancedChart(
    canvas: HTMLCanvasElement,
    options: CreateEnhancedChartOptions
): EnhancedChartInstance | null {
    const { animationStyle = "normal", field, theme } = options;

    try {
        const currentTheme = resolveTheme(theme);
        logThemeDebug(field, theme, currentTheme);

        const ChartConstructor = resolveChartRuntime(isChartConstructor);
        if (!ChartConstructor) {
            const error = new Error("Chart.js constructor is unavailable");
            console.error(
                `[ChartJS] Error creating chart for ${field}:`,
                error
            );
            notifyChartCreationError(field);
            return null;
        }

        const config = buildEnhancedChartConfig(options, currentTheme);
        canvas.style.borderRadius = "12px";
        canvas.style.boxShadow = "0 2px 16px 0 rgba(0,0,0,0.18)";

        const chart = new ChartConstructor(canvas, config);

        if (animationStyle !== "none") {
            updateChartAnimations(chart, field);
        }

        return chart;
    } catch (error) {
        console.error(`[ChartJS] Error creating chart for ${field}:`, error);
        notifyChartCreationError(field);
        return null;
    }
}
