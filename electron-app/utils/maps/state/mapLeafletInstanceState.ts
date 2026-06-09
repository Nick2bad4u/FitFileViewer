export type MapLeafletInstance = {
    invalidateSize?: (options?: {
        animate?: boolean;
        pan?: boolean;
    }) => unknown;
    remove?: () => void;
};

let registeredLeafletMapInstance: MapLeafletInstance | null = null;

export function getRegisteredLeafletMapInstance<
    T extends object = MapLeafletInstance,
>(): T | null {
    return registeredLeafletMapInstance as T | null;
}

export function removeRegisteredLeafletMapInstance(): void {
    try {
        registeredLeafletMapInstance?.remove?.();
    } finally {
        registeredLeafletMapInstance = null;
    }
}

export function resetRegisteredLeafletMapInstanceForTests(): void {
    registeredLeafletMapInstance = null;
}

export function setRegisteredLeafletMapInstance<T extends MapLeafletInstance>(
    mapInstance: T | null
): void {
    registeredLeafletMapInstance = mapInstance;
}
