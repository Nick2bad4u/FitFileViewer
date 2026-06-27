export type DisposableMapPluginControl = {
    _miniMap?: { invalidateSize?: () => void };
    remove?: () => void;
};

export type ClearableMapDrawnItems = {
    clearLayers?: () => void;
};

let registeredMapDrawControl: DisposableMapPluginControl | null = null;
let registeredMapDrawnItems: ClearableMapDrawnItems | null = null;
let registeredMapMiniMapControl: DisposableMapPluginControl | null = null;

export function clearRegisteredMapDrawnItems(): void {
    registeredMapDrawnItems?.clearLayers?.();
}

export function getRegisteredMapDrawControl<
    T extends object = DisposableMapPluginControl,
>(): T | null {
    return registeredMapDrawControl as T | null;
}

export function getRegisteredMapDrawnItems<T extends object>(): T | null {
    return registeredMapDrawnItems as T | null;
}

export function getRegisteredMapMiniMapControl<
    T extends object = DisposableMapPluginControl,
>(): T | null {
    return registeredMapMiniMapControl as T | null;
}

export function removeRegisteredMapDrawControl(): void {
    try {
        registeredMapDrawControl?.remove?.();
    } finally {
        registeredMapDrawControl = null;
    }
}

export function removeRegisteredMapMiniMapControl(): void {
    try {
        registeredMapMiniMapControl?.remove?.();
    } finally {
        registeredMapMiniMapControl = null;
    }
}

export function resetRegisteredMapPluginControlsForTests(): void {
    registeredMapDrawControl = null;
    registeredMapDrawnItems = null;
    registeredMapMiniMapControl = null;
}

export function setRegisteredMapDrawControl<
    T extends DisposableMapPluginControl,
>(control: T | null): void {
    registeredMapDrawControl = control;
}

export function setRegisteredMapDrawnItems<T extends ClearableMapDrawnItems>(
    drawnItems: T | null
): void {
    registeredMapDrawnItems = drawnItems;
}

export function setRegisteredMapMiniMapControl<
    T extends DisposableMapPluginControl,
>(control: T | null): void {
    registeredMapMiniMapControl = control;
}
