type PowerHeartRateDatum = Record<string, unknown>;

interface PowerHeartRateOptions {
    maxPoints: number | "all";
    [key: string]: unknown;
}

export function renderPowerVsHeartRateChart(
    container: HTMLElement,
    data: PowerHeartRateDatum[],
    options: PowerHeartRateOptions
): void;
