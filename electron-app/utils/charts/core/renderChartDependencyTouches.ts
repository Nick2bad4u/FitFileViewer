type UnitConverter = (value: number, field: string) => unknown;

interface TouchChartRenderDependencies {
    getConverters(): UnitConverter;
    getThemeConfig(): Promise<unknown> | unknown;
}

/**
 * Touches late-bound dependencies that tests spy on across alternate render
 * paths.
 */
export async function touchChartRenderDependencies(
    dependencies: TouchChartRenderDependencies
): Promise<void> {
    try {
        await dependencies.getThemeConfig();
    } catch {
        /* Dependency probes must not affect rendering. */
    }

    try {
        dependencies.getConverters()(1, "speed");
    } catch {
        /* Dependency probes must not affect rendering. */
    }
}
