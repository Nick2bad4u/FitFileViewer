export interface OpenZoneColorPickerRuntimeScope {
    readonly getCustomEvent?:
        | (() => typeof globalThis.CustomEvent | undefined)
        | undefined;
    readonly getDispatchEvent?:
        | (() => ((event: Event) => boolean) | undefined)
        | undefined;
}

export interface OpenZoneColorPickerRuntime {
    createCustomEvent: <T>(
        type: string,
        eventInitDict?: CustomEventInit<T>
    ) => CustomEvent<T>;
    dispatchEvent: (event: Event) => boolean;
}

function getCustomEventConstructor(
    scope: OpenZoneColorPickerRuntimeScope
): typeof globalThis.CustomEvent {
    const CustomEventConstructor = scope.getCustomEvent?.();
    if (typeof CustomEventConstructor !== "function") {
        throw new TypeError(
            "openZoneColorPicker requires a CustomEvent runtime"
        );
    }

    return CustomEventConstructor;
}

function getDispatchEvent(
    scope: OpenZoneColorPickerRuntimeScope
): (event: Event) => boolean {
    const dispatchEvent = scope.getDispatchEvent?.();
    if (typeof dispatchEvent !== "function") {
        throw new TypeError(
            "openZoneColorPicker requires a dispatchEvent runtime"
        );
    }

    return dispatchEvent;
}

const defaultOpenZoneColorPickerRuntimeScope: OpenZoneColorPickerRuntimeScope =
    {
        getCustomEvent: () => globalThis.CustomEvent,
        getDispatchEvent: () => globalThis.dispatchEvent.bind(globalThis),
    };

export function getOpenZoneColorPickerRuntime(
    scope: OpenZoneColorPickerRuntimeScope = defaultOpenZoneColorPickerRuntimeScope
): OpenZoneColorPickerRuntime {
    return {
        createCustomEvent<T>(
            type: string,
            eventInitDict?: CustomEventInit<T>
        ): CustomEvent<T> {
            return new (getCustomEventConstructor(scope))<T>(
                type,
                eventInitDict
            );
        },
        dispatchEvent(event: Event): boolean {
            return getDispatchEvent(scope)(event);
        },
    };
}
