import type { ChartHoverThemeConfig } from "../plugins/addChartHoverEffects.js";
import { renderNoDataMessage } from "./renderChartDomHelpers.js";
import { applyCompletedChartHoverEffects } from "./renderChartHoverCompletion.js";
import { handleChartRenderNotification } from "./renderChartNotificationFlow.js";
import { updateChartRenderPerformanceState } from "./renderChartPerformanceState.js";
import { completeChartRenderState } from "./renderChartCompletionState.js";
import { emitChartsRenderedEvent } from "./renderChartRenderedEvent.js";
import { resolveChartRenderResultState } from "./renderChartResultState.js";
import type { NotificationType } from "../../state/domain/rendererNotificationState.js";

type GetChartOptionsFunction = () => unknown;
type NotifySuccessFunction = (
    message: string,
    type: "success"
) => Promise<unknown> | unknown;
type ShowRenderNotificationFunction = (
    totalChartsRendered: number,
    visibleFieldCount: number
) => boolean;
type ChartStateUpdateSourceOptions = { source?: string };
type UpdatePerformanceSummaryFunction = (
    summary: { chartsRendered: number; lastChartRender: number },
    options?: ChartStateUpdateSourceOptions
) => void;
type SetLastNotificationFunction = (
    notification: {
        message: string;
        timestamp: number;
        type: NotificationType;
    },
    options?: ChartStateUpdateSourceOptions
) => void;
type AddChartHoverEffectsFunction = (
    chartContainer: HTMLElement | null | undefined,
    themeConfig: ChartHoverThemeConfig | null | undefined
) => void;
type AddHoverEffectsToExistingChartsFunction = () => void;
type GetThemeConfigFunction = () =>
    | ChartHoverThemeConfig
    | Promise<ChartHoverThemeConfig | null | undefined>
    | null
    | undefined;
type UpdateChartControlsUIFunction = (enabled: boolean) => unknown;

interface ComputedStateAccess {
    invalidateComputed?(key: string): unknown;
}

interface SuccessfulChartRenderCompletionDependencies {
    addChartHoverEffects: AddChartHoverEffectsFunction;
    addHoverEffectsToExistingCharts?: AddHoverEffectsToExistingChartsFunction;
    chartContainer: HTMLElement;
    chartInstances: unknown;
    CustomEventConstructor: typeof CustomEvent | undefined;
    doc: Document;
    getComputedStateManager(): ComputedStateAccess;
    getChartOptions: GetChartOptionsFunction;
    getThemeConfig: GetThemeConfigFunction;
    isTestRuntime: boolean;
    notify: NotifySuccessFunction;
    now(): number;
    nowPerformance(): number;
    setLastNotification: SetLastNotificationFunction;
    showRenderNotification: ShowRenderNotificationFunction;
    updateChartControlsUI?: UpdateChartControlsUIFunction;
    updatePreviousChartState(
        chartCount: number,
        visibleFields: number,
        timestamp: number
    ): unknown;
    updatePerformanceSummary: UpdatePerformanceSummaryFunction;
}

interface SuccessfulChartRenderCompletionInput {
    renderStartTime: number;
    visibleFieldCount: number;
}

interface SuccessfulChartRenderCompletionResult {
    renderTime: number;
    totalChartsRendered: number;
}

function renderNoDataForContainer(
    chartContainer: HTMLElement | null | undefined,
    message: string
): void {
    if (chartContainer !== null && chartContainer !== undefined) {
        renderNoDataMessage(chartContainer, message);
    }
}

/**
 * Runs the success side effects that follow chart construction.
 *
 * @param dependencies - Runtime, state, notification, and DOM dependencies.
 * @param input - Render timing and visible field summary.
 *
 * @returns Final render duration and chart count.
 */
export async function completeSuccessfulChartRender(
    dependencies: SuccessfulChartRenderCompletionDependencies,
    input: SuccessfulChartRenderCompletionInput
): Promise<SuccessfulChartRenderCompletionResult> {
    const hoverDependencies: Parameters<
        typeof applyCompletedChartHoverEffects
    >[0] = {
        addChartHoverEffects: dependencies.addChartHoverEffects,
        chartContainer: dependencies.chartContainer,
        getThemeConfig: dependencies.getThemeConfig,
        isTestRuntime: dependencies.isTestRuntime,
    };
    if (dependencies.addHoverEffectsToExistingCharts !== undefined) {
        hoverDependencies.addHoverEffectsToExistingCharts =
            dependencies.addHoverEffectsToExistingCharts;
    }
    if (dependencies.updateChartControlsUI !== undefined) {
        hoverDependencies.updateChartControlsUI =
            dependencies.updateChartControlsUI;
    }

    const { totalChartsRendered } = resolveChartRenderResultState(
        {
            chartContainer: dependencies.chartContainer,
            chartInstances: dependencies.chartInstances,
            renderNoDataMessage: renderNoDataForContainer,
        },
        { visibleFieldCount: input.visibleFieldCount }
    );

    const renderTime = dependencies.nowPerformance() - input.renderStartTime;
    console.log(
        `[ChartJS] Rendered ${totalChartsRendered} charts (sync) in ${renderTime.toFixed(2)}ms`
    );

    updateChartRenderPerformanceState(
        {
            updatePerformanceSummary: dependencies.updatePerformanceSummary,
        },
        { renderTime, totalChartsRendered }
    );

    handleChartRenderNotification(
        {
            isTestRuntime: dependencies.isTestRuntime,
            notify: dependencies.notify,
            setLastNotification: dependencies.setLastNotification,
            showRenderNotification: dependencies.showRenderNotification,
        },
        {
            totalChartsRendered,
            visibleFieldCount: input.visibleFieldCount,
        }
    );

    await applyCompletedChartHoverEffects(hoverDependencies, {
        totalChartsRendered,
    });

    completeChartRenderState(
        {
            CustomEventConstructor: dependencies.CustomEventConstructor,
            doc: dependencies.doc,
            emitChartsRenderedEvent,
            getChartOptions: dependencies.getChartOptions,
            getComputedStateManager: dependencies.getComputedStateManager,
            now: dependencies.now,
            updatePreviousChartState: dependencies.updatePreviousChartState,
        },
        {
            renderTime,
            totalChartsRendered,
            visibleFieldCount: input.visibleFieldCount,
        }
    );

    return { renderTime, totalChartsRendered };
}
