const METERS_IN_KILOMETER = 1000;
const METERS_IN_MILE = 1609.344;
const SQUARE_METERS_IN_HECTARE = 10_000;
const SQUARE_METERS_IN_SQUARE_KILOMETER = 1_000_000;

export function calculatePolygonArea(LeafletLib, latLngs) {
    if (!Array.isArray(latLngs) || latLngs.length === 0) {
        return 0;
    }
    const geometryUtil = LeafletLib?.GeometryUtil;
    if (geometryUtil && typeof geometryUtil.geodesicArea === "function") {
        try {
            return Math.abs(geometryUtil.geodesicArea(latLngs));
        } catch {
            return 0;
        }
    }
    return 0;
}

export function calculatePolylineLength(map, latLngs) {
    if (!map || typeof map.distance !== "function" || !Array.isArray(latLngs)) {
        return 0;
    }
    let total = 0;
    for (let index = 1; index < latLngs.length; index += 1) {
        const previous = latLngs[index - 1];
        const current = latLngs[index];
        if (!previous || !current) {
            continue;
        }
        try {
            total += map.distance(previous, current);
        } catch {
            /* ignore distance errors */
        }
    }
    return total;
}

export function flattenLatLngs(latLngs) {
    const result = [];
    const stack = Array.isArray(latLngs) ? [...latLngs] : [];
    while (stack.length > 0) {
        const value = stack.shift();
        if (!value) {
            continue;
        }
        if (Array.isArray(value)) {
            stack.unshift(...value);
        } else {
            result.push(value);
        }
    }
    return result;
}

export function formatArea(areaSqMeters) {
    if (!Number.isFinite(areaSqMeters)) {
        return "0 m²";
    }
    if (areaSqMeters >= SQUARE_METERS_IN_SQUARE_KILOMETER) {
        return `${(areaSqMeters / SQUARE_METERS_IN_SQUARE_KILOMETER).toFixed(2)} km²`;
    }
    if (areaSqMeters >= SQUARE_METERS_IN_HECTARE) {
        return `${(areaSqMeters / SQUARE_METERS_IN_HECTARE).toFixed(2)} ha`;
    }
    return `${areaSqMeters.toFixed(2)} m²`;
}

export function formatCircleSummary(radius) {
    const radiusText = `Radius: ${formatMetricDistance(radius)} (${formatImperialDistance(radius)})`;
    const areaText = `Area: ${formatArea(Math.PI * radius * radius)}`;
    const circumferenceText = `Circumference: ${formatMetricDistance(2 * Math.PI * radius)}`;
    return `${radiusText}<br>${areaText}<br>${circumferenceText}`;
}

export function formatDistanceSummary(distance) {
    return `Distance: ${formatMetricDistance(distance)} (${formatImperialDistance(distance)})`;
}

export function formatImperialDistance(distanceMeters) {
    if (!Number.isFinite(distanceMeters)) {
        return "0 mi";
    }
    return `${(distanceMeters / METERS_IN_MILE).toFixed(2)} mi`;
}

export function formatMetricDistance(distanceMeters) {
    if (!Number.isFinite(distanceMeters)) {
        return "0 m";
    }
    if (distanceMeters >= METERS_IN_KILOMETER) {
        return `${(distanceMeters / METERS_IN_KILOMETER).toFixed(2)} km`;
    }
    return `${distanceMeters.toFixed(1)} m`;
}
