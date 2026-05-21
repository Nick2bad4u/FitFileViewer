import type {
    ActivityStartTime,
    ChartDataRecord,
} from "./renderChartDataPreparation.js";

type ChartLabel = number | string;
type MaxPointsValue = "all" | number;
type FieldVisibilityReader = (field: string) => unknown;

interface BaseChartDisplayOptions {
    readonly showGrid: boolean;
    readonly showLegend: boolean;
    readonly showPoints: boolean;
    readonly showTitle: boolean;
    readonly zoomPluginConfig: Record<string, unknown>;
}

interface SupplementalChartRenderers {
    renderEventMessagesChart(
        container: HTMLElement,
        options: Pick<
            BaseChartDisplayOptions,
            "showGrid" | "showLegend" | "showTitle" | "zoomPluginConfig"
        >,
        startTime: ActivityStartTime
    ): void;
    renderGPSTimeChart(
        container: HTMLElement,
        data: readonly ChartDataRecord[],
        options: Pick<
            BaseChartDisplayOptions,
            "showGrid" | "showLegend" | "showPoints" | "showTitle"
        > & { readonly maxPoints: MaxPointsValue }
    ): void;
    renderGPSTrackChart(
        container: HTMLElement,
        data: readonly ChartDataRecord[],
        options: Pick<
            BaseChartDisplayOptions,
            "showGrid" | "showLegend" | "showPoints" | "showTitle"
        > & { readonly maxPoints: MaxPointsValue }
    ): void;
    renderLapZoneCharts(
        container: HTMLElement,
        options: Pick<
            BaseChartDisplayOptions,
            "showGrid" | "showLegend" | "showTitle" | "zoomPluginConfig"
        > & { readonly visibilitySettings: LapZoneVisibility }
    ): void;
    renderPerformanceAnalysisCharts(
        container: HTMLElement,
        data: readonly ChartDataRecord[],
        labels: readonly ChartLabel[],
        options: PerformanceAnalysisOptions
    ): void;
    renderTimeInZoneCharts(
        container: HTMLElement,
        options: Pick<
            BaseChartDisplayOptions,
            "showGrid" | "showLegend" | "showTitle" | "zoomPluginConfig"
        >
    ): void;
}

interface LapZoneVisibility {
    readonly hrIndividualVisible: boolean;
    readonly hrStackedVisible: boolean;
    readonly powerIndividualVisible: boolean;
    readonly powerStackedVisible: boolean;
}

/** Field visibility access used by supplemental chart orchestration. */
export interface SupplementalChartVisibility {
    getFieldVisibility: FieldVisibilityReader;
}

interface PerformanceAnalysisOptions extends BaseChartDisplayOptions {
    readonly animationStyle: string;
    readonly chartType: string;
    readonly customColors: readonly unknown[];
    readonly interpolation: string;
    readonly maxPoints: MaxPointsValue;
    readonly showFill: boolean;
    readonly smoothing: number;
}

interface RenderSupplementalChartsDependencies {
    readonly chartContainer: HTMLElement;
    readonly labels: readonly ChartLabel[];
    readonly renderers: SupplementalChartRenderers;
    readonly visibility: SupplementalChartVisibility;
}

interface RenderSupplementalChartsInput
    extends BaseChartDisplayOptions,
        Pick<
            PerformanceAnalysisOptions,
            | "animationStyle"
            | "chartType"
            | "customColors"
            | "interpolation"
            | "maxPoints"
            | "showFill"
            | "smoothing"
        > {
    readonly data: readonly ChartDataRecord[];
    readonly startTime: ActivityStartTime;
}

function isVisible(visibility: unknown): boolean {
    return visibility !== "hidden";
}

/**
 * Resolves state-managed visibility for the lap-zone supplemental chart variants.
 */
export function resolveLapZoneVisibility(
    visibility: SupplementalChartVisibility
): LapZoneVisibility {
    return {
        hrIndividualVisible: isVisible(
            visibility.getFieldVisibility("hr_lap_zone_individual")
        ),
        hrStackedVisible: isVisible(
            visibility.getFieldVisibility("hr_lap_zone_stacked")
        ),
        powerIndividualVisible: isVisible(
            visibility.getFieldVisibility("power_lap_zone_individual")
        ),
        powerStackedVisible: isVisible(
            visibility.getFieldVisibility("power_lap_zone_stacked")
        ),
    };
}

function shouldRenderLapZones(visibility: LapZoneVisibility): boolean {
    return Object.values(visibility).some(Boolean);
}

/**
 * Renders the supplemental chart families that sit outside the per-field metric loop.
 */
export function renderSupplementalCharts(
    dependencies: RenderSupplementalChartsDependencies,
    input: RenderSupplementalChartsInput
): void {
    const { chartContainer, labels, renderers, visibility } = dependencies;
    const commonOptions = {
        showGrid: input.showGrid,
        showLegend: input.showLegend,
        showTitle: input.showTitle,
        zoomPluginConfig: input.zoomPluginConfig,
    };
    const gpsOptions = {
        maxPoints: input.maxPoints,
        showGrid: input.showGrid,
        showLegend: input.showLegend,
        showPoints: input.showPoints,
        showTitle: input.showTitle,
    };

    if (isVisible(visibility.getFieldVisibility("event_messages"))) {
        renderers.renderEventMessagesChart(
            chartContainer,
            commonOptions,
            input.startTime
        );
    }

    renderers.renderTimeInZoneCharts(chartContainer, commonOptions);

    const lapZoneVisibility = resolveLapZoneVisibility(visibility);
    if (shouldRenderLapZones(lapZoneVisibility)) {
        renderers.renderLapZoneCharts(chartContainer, {
            ...commonOptions,
            visibilitySettings: lapZoneVisibility,
        });
    }

    renderers.renderGPSTrackChart(chartContainer, input.data, gpsOptions);
    renderers.renderGPSTimeChart(chartContainer, input.data, gpsOptions);
    renderers.renderPerformanceAnalysisCharts(
        chartContainer,
        input.data,
        labels,
        {
            ...commonOptions,
            animationStyle: input.animationStyle,
            chartType: input.chartType,
            customColors: input.customColors,
            interpolation: input.interpolation,
            maxPoints: input.maxPoints,
            showFill: input.showFill,
            showPoints: input.showPoints,
            smoothing: input.smoothing,
        }
    );
}
