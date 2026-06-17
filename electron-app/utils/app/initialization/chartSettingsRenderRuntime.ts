export interface ChartSettingsRenderRuntime {
    readonly createRenderRequestEvent: (
        reason: string
    ) => CustomEvent<{ reason: string }>;
    readonly eventTarget: Pick<EventTarget, "dispatchEvent">;
}

export interface ChartSettingsRenderRuntimeScope {
    readonly getCustomEvent?:
        | (() => typeof CustomEvent | undefined)
        | undefined;
    readonly getEventTarget?:
        | (() => Pick<EventTarget, "dispatchEvent"> | undefined)
        | undefined;
}

function getCustomEventConstructor(
    scope: ChartSettingsRenderRuntimeScope
): typeof CustomEvent {
    const CustomEventConstructor = scope.getCustomEvent?.();
    if (typeof CustomEventConstructor !== "function") {
        throw new TypeError(
            "chartSettingsRender requires a CustomEvent runtime"
        );
    }

    return CustomEventConstructor;
}

function getEventTarget(
    scope: ChartSettingsRenderRuntimeScope
): Pick<EventTarget, "dispatchEvent"> {
    const eventTarget = scope.getEventTarget?.();
    if (!eventTarget || typeof eventTarget.dispatchEvent !== "function") {
        throw new TypeError(
            "chartSettingsRender requires an event target runtime"
        );
    }

    return eventTarget;
}

const defaultChartSettingsRenderRuntimeScope: ChartSettingsRenderRuntimeScope =
    {
        getCustomEvent: () => globalThis.CustomEvent,
        getEventTarget: () => globalThis,
    };

export function getChartSettingsRenderRuntime(
    scope: ChartSettingsRenderRuntimeScope = defaultChartSettingsRenderRuntimeScope
): ChartSettingsRenderRuntime {
    return {
        createRenderRequestEvent(reason: string): CustomEvent<{
            reason: string;
        }> {
            return new (getCustomEventConstructor(scope))(
                "ffv:request-render-charts",
                {
                    detail: { reason },
                }
            );
        },
        get eventTarget(): Pick<EventTarget, "dispatchEvent"> {
            return getEventTarget(scope);
        },
    };
}
