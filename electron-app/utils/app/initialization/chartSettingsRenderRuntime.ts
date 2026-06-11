export interface ChartSettingsRenderRuntime {
    readonly eventTarget: Pick<EventTarget, "dispatchEvent">;
}

export function getChartSettingsRenderRuntime(
    eventTarget: Pick<EventTarget, "dispatchEvent"> = globalThis
): ChartSettingsRenderRuntime {
    return { eventTarget };
}
