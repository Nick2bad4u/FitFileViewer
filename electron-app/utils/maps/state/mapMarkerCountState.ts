export const DEFAULT_MAP_MARKER_COUNT = 50;
export const ALL_MAP_MARKERS_COUNT = 0;
export const NUMERIC_MAP_MARKER_COUNT_OPTIONS = [
    10,
    25,
    50,
    100,
    200,
    500,
    1000,
] as const;
export const MAP_MARKER_COUNT_OPTIONS = [
    ...NUMERIC_MAP_MARKER_COUNT_OPTIONS,
    "all",
] as const;

let mapMarkerCount = DEFAULT_MAP_MARKER_COUNT;

type NumericMapMarkerCountOption =
    (typeof NUMERIC_MAP_MARKER_COUNT_OPTIONS)[number];

const NUMERIC_MAP_MARKER_COUNT_OPTION_SET: ReadonlySet<number> = new Set(
    NUMERIC_MAP_MARKER_COUNT_OPTIONS
);

export function getMapMarkerCount(): number {
    return mapMarkerCount;
}

export function resetMapMarkerCount(): void {
    mapMarkerCount = DEFAULT_MAP_MARKER_COUNT;
}

export function setMapMarkerCount(count: number): number {
    mapMarkerCount = normalizeMapMarkerCount(count);
    return mapMarkerCount;
}

function normalizeMapMarkerCount(count: number): number {
    if (count === ALL_MAP_MARKERS_COUNT) {
        return ALL_MAP_MARKERS_COUNT;
    }

    if (!isNumericMapMarkerCountOption(count)) {
        return DEFAULT_MAP_MARKER_COUNT;
    }

    return count;
}

function isNumericMapMarkerCountOption(
    value: number
): value is NumericMapMarkerCountOption {
    return NUMERIC_MAP_MARKER_COUNT_OPTION_SET.has(value);
}
