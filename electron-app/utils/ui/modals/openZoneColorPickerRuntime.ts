export interface OpenZoneColorPickerRuntimeScope {
    readonly CustomEvent?: typeof CustomEvent | undefined;
    readonly dispatchEvent?: ((event: Event) => boolean) | undefined;
    readonly document?: Document | undefined;
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
): typeof CustomEvent {
    const CustomEventConstructor =
        scope.CustomEvent ?? scope.document?.defaultView?.CustomEvent;
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
    const dispatchEvent =
        scope.dispatchEvent ??
        scope.document?.defaultView?.dispatchEvent?.bind(
            scope.document.defaultView
        );
    if (typeof dispatchEvent !== "function") {
        throw new TypeError(
            "openZoneColorPicker requires a dispatchEvent runtime"
        );
    }

    return dispatchEvent;
}

const defaultOpenZoneColorPickerRuntimeScope: OpenZoneColorPickerRuntimeScope =
    globalThis;

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
