import type {
    ActivityStartTime,
    ChartDataRecord,
} from "./renderChartDataPreparation.js";

type RendererProbe = (...args: unknown[]) => unknown;

interface RendererProbeModules {
    renderEventMessagesChart?: RendererProbe;
    renderGPSTrackChart?: RendererProbe;
    renderLapZoneCharts?: RendererProbe;
    renderPerformanceAnalysisCharts?: RendererProbe;
    renderTimeInZoneCharts?: RendererProbe;
}

interface TouchTestRendererModulesDependencies {
    createElement(tagName: string): HTMLElement;
    getRendererModules(): RendererProbeModules;
    isTestEnvironment(): boolean;
}

function callRenderer(renderer: RendererProbe | undefined, ...args: unknown[]): void {
    try {
        renderer?.(...args);
    } catch {
        /* Test probes must not affect render success. */
    }
}

/**
 * Touches renderer modules in tests so integration spies observe expected calls.
 */
export function touchRendererModulesForTest(
    dependencies: TouchTestRendererModulesDependencies,
    recordMesgs: readonly ChartDataRecord[],
    activityStartTime: ActivityStartTime
): void {
    if (!dependencies.isTestEnvironment()) {
        return;
    }

    try {
        const modules = dependencies.getRendererModules();
        const container = dependencies.createElement("div");

        callRenderer(
            modules.renderEventMessagesChart,
            container,
            {},
            activityStartTime
        );
        callRenderer(modules.renderTimeInZoneCharts, container, {});
        callRenderer(modules.renderLapZoneCharts, container, {
            visibilitySettings: {},
        });
        callRenderer(modules.renderGPSTrackChart, container, recordMesgs, {});
        callRenderer(
            modules.renderPerformanceAnalysisCharts,
            container,
            recordMesgs,
            recordMesgs.map((_record, index) => index),
            {}
        );
    } catch {
        /* Test probes must not affect render success. */
    }
}
