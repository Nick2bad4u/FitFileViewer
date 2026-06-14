type RendererVendorEventTarget = Pick<EventTarget, "dispatchEvent">;

export interface RendererVendorSharedRuntimeScope {
    readonly CustomEvent?: typeof CustomEvent | undefined;
    readonly eventTarget?: RendererVendorEventTarget | undefined;
}

export interface RendererVendorSharedRuntime {
    dispatchRendererVendorEntryLoadedEvent: <T>(
        eventName: string,
        detail: T
    ) => boolean;
}

export function getRendererVendorSharedRuntime(
    scope: RendererVendorSharedRuntimeScope = {
        CustomEvent: globalThis.CustomEvent,
        eventTarget: globalThis,
    }
): RendererVendorSharedRuntime {
    return {
        dispatchRendererVendorEntryLoadedEvent(eventName, detail): boolean {
            const CustomEventConstructor = scope.CustomEvent;
            const eventTarget = scope.eventTarget;
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
