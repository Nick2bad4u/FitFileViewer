/** Numeric point used by Chart.js datasets in renderChartJS. */
export type ChartPoint = {
    readonly x: number;
    readonly y: null | number;
};

/** Minimum and maximum axis bounds inferred from chart points. */
export type AxisRanges = {
    readonly x: {
        readonly max: number;
        readonly min: number;
    };
    readonly y: {
        readonly max: number;
        readonly min: number;
    };
};

/** Normalized point-limit setting used by renderChartJS caches. */
export type MaxPointsValue = "all" | number;

/** Calculates finite x/y axis bounds for a set of chart points. */
export function calculateAxisRanges(
    points: readonly (ChartPoint | null | undefined)[]
): AxisRanges | null {
    if (points.length === 0) {
        return null;
    }

    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const point of points) {
        if (point === null || point === undefined) {
            continue;
        }

        const { x, y } = point;
        if (Number.isFinite(x)) {
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
        }

        if (typeof y === "number" && Number.isFinite(y)) {
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }
    }

    if (!Number.isFinite(minX) || !Number.isFinite(maxX)) {
        return null;
    }

    if (!Number.isFinite(minY) || !Number.isFinite(maxY)) {
        minY = 0;
        maxY = 0;
    }

    if (minX === maxX) {
        maxX = minX + 1;
    }

    if (minY === maxY) {
        const delta = Math.abs(minY) < 1 ? 1 : Math.abs(minY * 0.05) || 1;
        minY -= delta;
        maxY += delta;
    }

    return {
        x: { min: minX, max: maxX },
        y: { min: minY, max: maxY },
    };
}

/** Combines chart labels and field values into x/y points. */
export function createChartPoints(
    labels: readonly unknown[] | null | undefined,
    values: readonly unknown[] | null | undefined
): ChartPoint[] {
    const labelValues = labels ?? [];
    const pointValues = values ?? [];
    const labelCount = labelValues.length;
    const valueCount = pointValues.length;
    const length = Math.min(labelCount, valueCount);

    return Array.from({ length }, (_, index) => {
        const labelValue = labelValues[index];
        const yValue = pointValues[index];
        const x =
            typeof labelValue === "number" && Number.isFinite(labelValue)
                ? labelValue
                : index;
        const y =
            typeof yValue === "number" && Number.isFinite(yValue)
                ? yValue
                : null;

        return { x, y };
    });
}

/** Returns the cache key for a normalized max-points setting. */
export function getMaxPointCacheKey(maxPointsValue: MaxPointsValue): string {
    return maxPointsValue === "all" ? "all" : `n:${maxPointsValue}`;
}

/** Returns a sampled copy of chart points that respects the max-points setting. */
export function limitChartPoints<T>(
    points: readonly T[] | null | undefined,
    maxPoints: number | string | null | undefined
): T[] {
    if (points === null || points === undefined || points.length === 0) {
        return [];
    }

    if (maxPoints === "all" || maxPoints === undefined || maxPoints === null) {
        return [...points];
    }

    const limit = parsePositiveInteger(maxPoints);
    if (!Number.isFinite(limit) || limit <= 0 || points.length <= limit) {
        return [...points];
    }

    const step = Math.max(1, Math.ceil(points.length / limit));
    const limited: T[] = [];
    for (const [index, point] of points.entries()) {
        if (index % step === 0) {
            limited.push(point);
        }
    }

    const lastPoint = points.at(-1);
    if (lastPoint !== undefined && limited.at(-1) !== lastPoint) {
        limited.push(lastPoint);
    }

    return limited;
}

/** Normalizes a user-facing max-points setting into the cache representation. */
export function normalizeMaxPointsValue(maxPoints: unknown): MaxPointsValue {
    if (maxPoints === "all" || maxPoints === undefined || maxPoints === null) {
        return "all";
    }

    const numeric = parsePositiveInteger(maxPoints);
    if (!Number.isFinite(numeric) || numeric <= 0) {
        return "all";
    }

    return numeric;
}

function parsePositiveInteger(value: unknown): number {
    if (typeof value === "number") {
        return value;
    }

    if (typeof value === "string") {
        return Number.parseInt(value, 10);
    }

    return Number.NaN;
}
