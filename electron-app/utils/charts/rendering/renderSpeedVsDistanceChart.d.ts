type SpeedDistanceDatum = Record<string, unknown>;

interface SpeedDistanceOptions {
    maxPoints: number | "all";
    [key: string]: unknown;
}

export function renderSpeedVsDistanceChart(
    container: HTMLElement,
    data: SpeedDistanceDatum[],
    options: SpeedDistanceOptions
): void;
