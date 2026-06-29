import {
    type BrowserCustomEventConstructor,
    getBrowserCustomEvent,
    getBrowserEventTarget,
} from "../utils/runtime/browserRuntime.js";

type RendererVendorEventTarget = Pick<EventTarget, "dispatchEvent">;

export interface RendererVendorSharedRuntimeScope {
    readonly getCustomEvent: RendererVendorSharedRuntimeProvider<BrowserCustomEventConstructor>;
    readonly getEventTarget: RendererVendorSharedRuntimeProvider<RendererVendorEventTarget>;
}

type RendererVendorSharedRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface RendererVendorSharedRuntime {
    dispatchRendererVendorEntryLoadedEvent: <T>(
        eventName: string,
        detail: T
    ) => boolean;
}

function getDefaultRendererVendorSharedRuntimeScope(): RendererVendorSharedRuntimeScope {
    return {
        getCustomEvent: getBrowserCustomEvent,
        getEventTarget: getBrowserEventTarget,
    };
}

export function getRendererVendorSharedRuntime(
    scope: RendererVendorSharedRuntimeScope = getDefaultRendererVendorSharedRuntimeScope()
): RendererVendorSharedRuntime {
    const getCustomEvent = getRequiredProvider(
        scope.getCustomEvent,
        "CustomEvent"
    );
    const getEventTarget = getRequiredProvider(
        scope.getEventTarget,
        "event target"
    );

    return {
        dispatchRendererVendorEntryLoadedEvent(eventName, detail): boolean {
            const CustomEventConstructor = getCustomEvent();
            const eventTarget = getEventTarget();
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

function getRequiredProvider<T>(
    provider: RendererVendorSharedRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `rendererVendorSharedRuntime requires ${article} ${providerName} provider`
        );
    }

    return provider;
}
