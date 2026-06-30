import { getRegisteredChartInstances } from "./chartInstanceRegistry.js";
import type { RendererStateUpdateOptions } from "../../state/domain/rendererStateUpdateOptions.js";

interface CreateExportChartsWithStateDependencies {
    areChartsRendered(): boolean;
    getChartInstances(fallbackInstances: unknown): unknown[];
    notify(
        message: string,
        type: "error" | "info" | "success" | "warning"
    ): Promise<void> | void;
    setExportingState(
        exporting: boolean,
        options?: RendererStateUpdateOptions
    ): unknown;
}

type ExportChartsWithState = (format?: unknown) => Promise<boolean>;

function getExportFormatLabel(format: unknown): string {
    if (typeof format === "string") {
        return format.toUpperCase();
    }

    return String(format);
}

function scheduleExportNotification(
    notify: CreateExportChartsWithStateDependencies["notify"],
    message: string,
    type: "success" | "warning"
): void {
    void Promise.resolve()
        .then(() => notify(message, type))
        .catch((error: unknown) => {
            console.warn("[ChartJS] Export notification failed:", error);
        });
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
        const isRendered = dependencies.areChartsRendered();
        const instances = dependencies.getChartInstances(
            getRegisteredChartInstances()
        );

        if (!isRendered && instances.length === 0) {
            scheduleExportNotification(
                dependencies.notify,
                "No charts available for export",
                "warning"
            );
            return Promise.resolve(false);
        }

        try {
            dependencies.setExportingState(true, {
                silent: false,
                source: "exportChartsWithState",
            });
        } catch {
            // Export success should not depend on non-critical state updates.
        }

        try {
            scheduleExportNotification(
                dependencies.notify,
                `Charts exported as ${getExportFormatLabel(format)}`,
                "success"
            );
        } catch {
            // Export success should not depend on non-critical notifications.
        }

        try {
            dependencies.setExportingState(false, {
                silent: false,
                source: "exportChartsWithState",
            });
        } catch {
            // Export success should not depend on non-critical state updates.
        }

        return Promise.resolve(true);
    };
}
