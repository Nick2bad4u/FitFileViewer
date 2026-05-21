async function applyHoverEffects(dependencies) {
    try {
        const hoverThemeConfig = await dependencies.getThemeConfig();
        dependencies.addChartHoverEffects(
            dependencies.chartContainer,
            hoverThemeConfig
        );
    } catch {
        /* ignore */
    }
    if (dependencies.isTestRuntime) {
        try {
            dependencies.addHoverEffectsToExistingCharts?.();
        } catch {
            /* ignore */
        }
    }
}
/**
 * Applies hover affordances after chart rendering completes.
 *
 * @param dependencies - DOM, theme, scheduler, and UI dependencies.
 * @param input - Render result counts.
 */
export async function applyCompletedChartHoverEffects(dependencies, input) {
    if (input.totalChartsRendered <= 0) {
        return;
    }
    if (dependencies.isTestRuntime) {
        await applyHoverEffects(dependencies);
    } else {
        const schedule = dependencies.schedule ?? setTimeout;
        schedule(() => {
            applyHoverEffects(dependencies).catch(() => {
                /* ignore */
            });
        }, 0);
    }
    dependencies.updateChartControlsUI?.(true);
}
