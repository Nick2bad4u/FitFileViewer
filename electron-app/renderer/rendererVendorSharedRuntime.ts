type RendererVendorEventTarget = Pick<EventTarget, "dispatchEvent">;

export interface RendererVendorSharedRuntimeScope {
    readonly getCustomEvent?: (() => typeof CustomEvent | undefined) | undefined;
    readonly getEventTarget?:
        | (() => RendererVendorEventTarget | undefined)
        | undefined;
}

export interface RendererVendorSharedRuntime {
    dispatchRendererVendorEntryLoadedEvent: <T>(
        eventName: string,
        detail: T
    ) => boolean;
}

export function getRendererVendorSharedRuntime(
    scope: RendererVendorSharedRuntimeScope = {
        getCustomEvent: () => globalThis.CustomEvent,
        getEventTarget: () => globalThis,
    }
): RendererVendorSharedRuntime {
    return {
        dispatchRendererVendorEntryLoadedEvent(eventName, detail): boolean {
            const CustomEventConstructor = scope.getCustomEvent?.();
            const eventTarget = scope.getEventTarget?.();
            if (
                typeof CustomEventConstructor !== "function" ||
                eventTarget === undefined
            ) {
                return false;
            }

            return eventTarget.dispatchEvent(
                new CustomEventConstructor(eventName, { detail })
            );
        },
    };
}
