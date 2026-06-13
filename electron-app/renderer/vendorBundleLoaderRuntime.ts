export type RendererVendorBundleLoaderTimerHandle =
    ReturnType<typeof globalThis.setTimeout>;

export interface RendererVendorBundleLoaderRuntimeScope {
    readonly addEventListener?: typeof globalThis.addEventListener | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly removeEventListener?:
        | typeof globalThis.removeEventListener
        | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface RendererVendorBundleLoaderRuntime {
    addEventListener(
        type: string,
        listener: EventListener,
        options?: AddEventListenerOptions
    ): void;
    clearTimeout(handle: RendererVendorBundleLoaderTimerHandle): void;
    removeEventListener(type: string, listener: EventListener): void;
    setTimeout(
        callback: () => void,
        delay: number
    ): RendererVendorBundleLoaderTimerHandle;
}

export function getRendererVendorBundleLoaderRuntime(
    scope: RendererVendorBundleLoaderRuntimeScope = globalThis
): RendererVendorBundleLoaderRuntime {
    return {
        addEventListener(
            type: string,
            listener: EventListener,
            options?: AddEventListenerOptions
        ): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- Vendor loader callers pair readiness listeners with caller-owned AbortSignal and removeEventListener cleanup.
            scope.addEventListener?.(type, listener, options);
        },
        clearTimeout(handle: RendererVendorBundleLoaderTimerHandle): void {
            const clearTimeoutRef = scope.clearTimeout ?? globalThis.clearTimeout;
            clearTimeoutRef(handle);
        },
        removeEventListener(type: string, listener: EventListener): void {
            scope.removeEventListener?.(type, listener);
        },
        setTimeout(
            callback: () => void,
            delay: number
        ): RendererVendorBundleLoaderTimerHandle {
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, delay);
        },
    };
}
