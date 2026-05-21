/** Calculates finite x/y axis bounds for a set of chart points. */
export function calculateAxisRanges(points) {
    if (!Array.isArray(points) || points.length === 0) {
        return null;
    }
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (const point of points) {
        if (!point) {
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
export function createChartPoints(labels, values) {
    const labelCount = Array.isArray(labels) ? labels.length : 0;
    const valueCount = Array.isArray(values) ? values.length : 0;
    const length = Math.min(labelCount, valueCount);
    return Array.from({ length }, (_, index) => {
        const labelValue = labels?.[index];
        const yValue = values?.[index];
        const x = typeof labelValue === "number" && Number.isFinite(labelValue)
            ? labelValue
            : index;
        const y = typeof yValue === "number" && Number.isFinite(yValue)
            ? yValue
            : null;
        return { x, y };
    });
}
/** Returns the cache key for a normalized max-points setting. */
export function getMaxPointCacheKey(maxPointsValue) {
    return maxPointsValue === "all" ? "all" : `n:${maxPointsValue}`;
}
/** Returns a sampled copy of chart points that respects the max-points setting. */
export function limitChartPoints(points, maxPoints) {
    if (!Array.isArray(points) || points.length === 0) {
        return [];
    }
    if (maxPoints === "all" || maxPoints === undefined || maxPoints === null) {
        return [...points];
    }
    const limit = typeof maxPoints === "number"
        ? maxPoints
        : Number.parseInt(String(maxPoints), 10);
    if (!Number.isFinite(limit) || limit <= 0 || points.length <= limit) {
        return [...points];
    }
    const step = Math.max(1, Math.ceil(points.length / limit));
    const limited = [];
    for (let i = 0; i < points.length; i += step) {
        limited.push(points[i]);
    }
    const lastPoint = points.at(-1);
    if (lastPoint && limited.at(-1) !== lastPoint) {
        limited.push(lastPoint);
    }
    return limited;
}
/** Normalizes a user-facing max-points setting into the cache representation. */
export function normalizeMaxPointsValue(maxPoints) {
    if (maxPoints === "all" || maxPoints === undefined || maxPoints === null) {
        return "all";
    }
    const numeric = typeof maxPoints === "number"
        ? maxPoints
        : Number.parseInt(String(maxPoints), 10);
    if (!Number.isFinite(numeric) || numeric <= 0) {
        return "all";
    }
    return numeric;
}
