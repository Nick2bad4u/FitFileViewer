let activityLayerGroup: object | null = null;
let dataPointMarkers: object[] = [];

export function getRegisteredMapActivityLayerGroup<
    T extends object = object,
>(): T | null {
    return activityLayerGroup as T | null;
}

export function getRegisteredMapDataPointMarkers<
    T extends object = object,
>(): T[] {
    return dataPointMarkers as T[];
}

export function registerMapDataPointMarker<T extends object>(marker: T): void {
    dataPointMarkers.push(marker);
}

export function resetMapActivityLayerStateForTests(): void {
    setRegisteredMapActivityLayerGroup(null);
    resetRegisteredMapDataPointMarkers();
}

export function resetRegisteredMapDataPointMarkers(): void {
    dataPointMarkers = [];
}

export function setRegisteredMapActivityLayerGroup<T extends object>(
    layerGroup: T | null
): void {
    activityLayerGroup = layerGroup;
}
