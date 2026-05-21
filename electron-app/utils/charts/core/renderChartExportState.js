function getExportFormatLabel(format) {
    if (format !== null &&
        format !== undefined &&
        typeof format.toUpperCase === "function") {
        const label = format.toUpperCase();
        if (label) {
            return String(label);
        }
    }
    return String(format);
}
/**
 * Creates the state-aware chart export placeholder used by the renderer API.
 *
 * @param dependencies - State, notification, and chart instance hooks.
 * @returns Export function that reports whether charts were available.
 */
export function createExportChartsWithState(dependencies) {
    return async (format = "png") => {
        const isRendered = Boolean(dependencies.getState("charts.isRendered"));
        const instances = dependencies.getChartInstances(dependencies.chartGlobal._chartjsInstances);
        if (!isRendered && instances.length === 0) {
            void Promise.resolve().then(() => dependencies.notify("No charts available for export", "warning"));
            return false;
        }
        try {
            dependencies.setState("ui.isExporting", true, {
                silent: false,
                source: "exportChartsWithState",
            });
        }
        catch {
            // Export success should not depend on non-critical state updates.
        }
        try {
            void Promise.resolve().then(() => dependencies.notify(`Charts exported as ${getExportFormatLabel(format)}`, "success"));
        }
        catch {
            // Export success should not depend on non-critical notifications.
        }
        try {
            dependencies.setState("ui.isExporting", false, {
                silent: false,
                source: "exportChartsWithState",
            });
        }
        catch {
            // Export success should not depend on non-critical state updates.
        }
        return true;
    };
}
