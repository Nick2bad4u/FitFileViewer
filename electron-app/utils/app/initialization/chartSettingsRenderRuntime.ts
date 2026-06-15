export interface ChartSettingsRenderRuntime {
    readonly createRenderRequestEvent: (
        reason: string
    ) => CustomEvent<{ reason: string }>;
    readonly eventTarget: Pick<EventTarget, "dispatchEvent">;
}

interface ChartSettingsRenderRuntimeScope {
    readonly CustomEvent?: typeof CustomEvent | undefined;
    readonly dispatchEvent: EventTarget["dispatchEvent"];
}

function getCustomEventConstructor(
    scope: ChartSettingsRenderRuntimeScope
): typeof CustomEvent {
    const CustomEventConstructor = scope.CustomEvent;
    if (typeof CustomEventConstructor !== "function") {
        throw new TypeError(
            "chartSettingsRender requires a CustomEvent runtime"
        );
    }

    return CustomEventConstructor;
}

const defaultChartSettingsRenderRuntimeScope: ChartSettingsRenderRuntimeScope =
    globalThis;

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
        eventTarget: scope,
    };
}
