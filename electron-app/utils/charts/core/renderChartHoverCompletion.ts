import type { ChartHoverThemeConfig } from "../plugins/addChartHoverEffects.js";

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
type ScheduleFunction = (callback: () => void, delay: number) => unknown;
type UpdateChartControlsUIFunction = (enabled: boolean) => unknown;

interface CompletedChartHoverEffectsDependencies {
    addChartHoverEffects: AddChartHoverEffectsFunction;
    addHoverEffectsToExistingCharts?: AddHoverEffectsToExistingChartsFunction;
    chartContainer: HTMLElement | null | undefined;
    getThemeConfig: GetThemeConfigFunction;
    isTestRuntime: boolean;
    schedule?: ScheduleFunction;
    updateChartControlsUI?: UpdateChartControlsUIFunction;
}

interface CompletedChartHoverEffectsInput {
    totalChartsRendered: number;
}

async function applyHoverEffects(
    dependencies: CompletedChartHoverEffectsDependencies
): Promise<void> {
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
export async function applyCompletedChartHoverEffects(
    dependencies: CompletedChartHoverEffectsDependencies,
    input: CompletedChartHoverEffectsInput
): Promise<void> {
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
