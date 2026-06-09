export type RegisteredMapBounds = {
    isValid?: () => boolean;
};

export type RegisteredMapPolyline = {
    _map?: {
        _layers?: Record<string, unknown>;
    };
    bringToFront?: () => unknown;
    getBounds?: () => RegisteredMapBounds | unknown;
    getElement?: () => HTMLElement | SVGElement | null;
    options?: {
        color?: string;
        opacity?: number;
        [key: string]: unknown;
    };
    setStyle?: (options: Record<string, unknown>) => unknown;
};

let mainPolyline: object | null = null;
let mainPolylineOriginalBounds: object | null = null;
let overlayPolylines: Record<string, object> = {};

export function clearMainMapPolyline(): void {
    mainPolyline = null;
    mainPolylineOriginalBounds = null;
}

export function getMainMapPolyline<
    T extends object = RegisteredMapPolyline,
>(): T | null {
    return mainPolyline as T | null;
}

export function getMainMapPolylineOriginalBounds<
    T extends object = RegisteredMapBounds,
>(): T | null {
    return mainPolylineOriginalBounds as T | null;
}

export function getOverlayMapPolyline<T extends object = RegisteredMapPolyline>(
    overlayIndex: number | string
): T | undefined {
    return overlayPolylines[String(overlayIndex)] as T | undefined;
}

export function getOverlayMapPolylines<
    T extends object = RegisteredMapPolyline,
>(): Record<string, T> {
    return overlayPolylines as Record<string, T>;
}

export function registerOverlayMapPolyline<T extends object>(
    overlayIndex: number | string,
    polyline: T
): void {
    overlayPolylines[String(overlayIndex)] = polyline;
}

export function resetMapPolylineRegistryForTests(): void {
    clearMainMapPolyline();
    resetOverlayMapPolylines();
}

export function resetOverlayMapPolylines(): void {
    overlayPolylines = {};
}

export function setMainMapPolyline<T extends object>(polyline: T | null): void {
    mainPolyline = polyline;
}

export function setMainMapPolylineOriginalBounds<T extends object>(
    bounds: T | null
): void {
    mainPolylineOriginalBounds = bounds;
}
