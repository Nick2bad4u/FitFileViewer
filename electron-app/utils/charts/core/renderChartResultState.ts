type RenderNoDataMessageFunction = (
    chartContainer: HTMLElement | null | undefined,
    message: string
) => void;

interface ChartRenderResultStateDependencies {
    chartContainer: HTMLElement | null | undefined;
    chartInstances: unknown;
    renderNoDataMessage: RenderNoDataMessageFunction;
}

interface ChartRenderResultStateInput {
    visibleFieldCount: number;
}

interface ChartRenderResultState {
    totalChartsRendered: number;
}

function getRenderedChartCount(chartInstances: unknown): number {
    return Array.isArray(chartInstances) ? chartInstances.length : 0;
}

function getEmptyChartMessage(
    totalChartsRendered: number,
    visibleFieldCount: number
): null | string {
    if (totalChartsRendered !== 0) {
        return null;
    }

    return visibleFieldCount === 0
        ? 'No visible metrics selected. Enable metrics in the "Visible Metrics" section above.'
        : "No suitable numeric data available for selected chart type.";
}

/**
 * Resolves the post-render chart count and renders the appropriate empty-state
 * message when no chart instances were created.
 *
 * @param dependencies - Chart instance and empty-state rendering dependencies.
 * @param input - Render-visible metric count.
 * @returns Resolved render result state.
 */
export function resolveChartRenderResultState(
    dependencies: ChartRenderResultStateDependencies,
    input: ChartRenderResultStateInput
): ChartRenderResultState {
    const totalChartsRendered = getRenderedChartCount(
        dependencies.chartInstances
    );
    const emptyChartMessage = getEmptyChartMessage(
        totalChartsRendered,
        input.visibleFieldCount
    );

    if (emptyChartMessage !== null) {
        dependencies.renderNoDataMessage(
            dependencies.chartContainer,
            emptyChartMessage
        );
    }

    return { totalChartsRendered };
}
