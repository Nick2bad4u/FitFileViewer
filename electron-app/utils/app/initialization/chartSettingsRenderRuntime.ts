import {
    type BrowserCustomEventConstructor,
    getBrowserCustomEvent,
    getBrowserDocument,
    getBrowserEventTarget,
} from "../../runtime/browserRuntime.js";

export interface ChartSettingsRenderRuntime {
    readonly createRenderRequestEvent: (
        reason: string
    ) => CustomEvent<{ reason: string }>;
    readonly documentRef: Document;
    readonly eventTarget: Pick<EventTarget, "dispatchEvent">;
}

export interface ChartSettingsRenderRuntimeScope {
    readonly getCustomEvent: () => BrowserCustomEventConstructor | undefined;
    readonly getDocument: () => Document | undefined;
    readonly getEventTarget: () =>
        | Pick<EventTarget, "dispatchEvent">
        | undefined;
}

function getCustomEventConstructor(
    scope: ChartSettingsRenderRuntimeScope
): BrowserCustomEventConstructor {
    if (typeof scope.getCustomEvent !== "function") {
        throw new TypeError(
            "chartSettingsRender requires a CustomEvent provider"
        );
    }

    const CustomEventConstructor = scope.getCustomEvent();
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
    if (typeof scope.getEventTarget !== "function") {
        throw new TypeError(
            "chartSettingsRender requires an event target provider"
        );
    }

    const eventTarget = scope.getEventTarget();
    if (!eventTarget || typeof eventTarget.dispatchEvent !== "function") {
        throw new TypeError(
            "chartSettingsRender requires an event target runtime"
        );
    }

    return eventTarget;
}

function getDocument(scope: ChartSettingsRenderRuntimeScope): Document {
    if (typeof scope.getDocument !== "function") {
        throw new TypeError("chartSettingsRender requires a document provider");
    }

    const documentRef = scope.getDocument();
    if (!documentRef) {
        throw new TypeError("chartSettingsRender requires a document runtime");
    }

    return documentRef;
}

const defaultChartSettingsRenderRuntimeScope: ChartSettingsRenderRuntimeScope =
    {
        getCustomEvent: getBrowserCustomEvent,
        getDocument: getBrowserDocument,
        getEventTarget: getBrowserEventTarget,
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
        get documentRef(): Document {
            return getDocument(scope);
        },
        get eventTarget(): Pick<EventTarget, "dispatchEvent"> {
            return getEventTarget(scope);
        },
    };
}
