type AltitudeProfileDatum = Record<string, unknown>;

interface AltitudeProfileOptions {
    maxPoints: number | "all";
    [key: string]: unknown;
}

export function renderAltitudeProfileChart(
    container: HTMLElement,
    data: AltitudeProfileDatum[],
    labels: number[],
    options: AltitudeProfileOptions
): void;
