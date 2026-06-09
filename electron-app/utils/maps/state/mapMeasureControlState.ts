export type MapMeasureControl = {
    clearMeasurements?: () => void;
    remove?: () => void;
};

let registeredMapMeasureControl: MapMeasureControl | null = null;

export function clearRegisteredMapMeasurements(): void {
    registeredMapMeasureControl?.clearMeasurements?.();
}

export function getRegisteredMapMeasureControl(): MapMeasureControl | null {
    return registeredMapMeasureControl;
}

export function removeRegisteredMapMeasureControl(): void {
    try {
        registeredMapMeasureControl?.remove?.();
    } finally {
        registeredMapMeasureControl = null;
    }
}

export function resetRegisteredMapMeasureControlForTests(): void {
    registeredMapMeasureControl = null;
}

export function setRegisteredMapMeasureControl(
    measureControl: MapMeasureControl | null
): void {
    registeredMapMeasureControl = measureControl;
}
