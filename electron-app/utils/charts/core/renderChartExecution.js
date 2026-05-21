/**
 * Runs the chart renderer and preserves the legacy graceful-completion
 * fallback.
 */
export async function runChartRender(
    dependencies,
    targetContainer,
    recordMesgs,
    activityStartTime,
    options
) {
    try {
        return (
            (await dependencies.renderChartsWithData(
                targetContainer,
                recordMesgs,
                activityStartTime,
                options
            )) === true
        );
    } catch (error) {
        dependencies.warn(
            "[ChartJS] renderChartsWithData threw, continuing with graceful completion:",
            error
        );
        return recordMesgs.length > 0;
    }
}
