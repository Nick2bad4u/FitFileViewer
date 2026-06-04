import type { StateUpdateOptions } from "../../state/core/stateManager.js";

interface ChartExportGlobal {
    _chartjsInstances?: unknown;
}

interface CreateExportChartsWithStateDependencies {
    chartGlobal: ChartExportGlobal;
    getChartInstances(fallbackInstances: unknown): unknown[];
    getState(path: string): unknown;
    notify(
        message: string,
        type: "error" | "info" | "success" | "warning"
    ): unknown;
    setState(
        path: string,
        value: unknown,
        options?: StateUpdateOptions
    ): unknown;
}

type ExportChartsWithState = (format?: unknown) => Promise<boolean>;

function getExportFormatLabel(format: unknown): string {
    if (typeof format === "string") {
        return format.toUpperCase();
    }

    return String(format);
}

/**
 * Creates the state-aware chart export placeholder used by the renderer API.
 *
 * @param dependencies - State, notification, and chart instance hooks.
 *
 * @returns Export function that reports whether charts were available.
 */
export function createExportChartsWithState(
    dependencies: CreateExportChartsWithStateDependencies
): ExportChartsWithState {
    return (format = "png") => {
        const isRendered = Boolean(dependencies.getState("charts.isRendered"));
        const instances = dependencies.getChartInstances(
            dependencies.chartGlobal._chartjsInstances
        );

        if (!isRendered && instances.length === 0) {
            void Promise.resolve().then(() =>
                dependencies.notify("No charts available for export", "warning")
            );
            return Promise.resolve(false);
        }

        try {
            dependencies.setState("ui.isExporting", true, {
                silent: false,
                source: "exportChartsWithState",
            });
        } catch {
            // Export success should not depend on non-critical state updates.
        }

        try {
            void Promise.resolve().then(() =>
                dependencies.notify(
                    `Charts exported as ${getExportFormatLabel(format)}`,
                    "success"
                )
            );
        } catch {
            // Export success should not depend on non-critical notifications.
        }

        try {
            dependencies.setState("ui.isExporting", false, {
                silent: false,
                source: "exportChartsWithState",
            });
        } catch {
            // Export success should not depend on non-critical state updates.
        }

        return Promise.resolve(true);
    };
}
