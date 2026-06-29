import { getBrowserDateNow } from "../../runtime/browserRuntime.js";

export interface ShowRenderNotificationRuntimeScope {
    readonly getDateNow: (() => (() => number) | undefined) | undefined;
}

export interface ShowRenderNotificationRuntime {
    readonly dateNow: () => number;
}

const defaultShowRenderNotificationRuntimeScope: ShowRenderNotificationRuntimeScope =
    {
        getDateNow: getBrowserDateNow,
    };

function getRequiredDateNow(
    scope: ShowRenderNotificationRuntimeScope
): () => number {
    if (typeof scope.getDateNow !== "function") {
        throw new TypeError(
            "render notification runtime requires dateNow provider"
        );
    }

    const dateNow = scope.getDateNow();
    if (typeof dateNow !== "function") {
        throw new TypeError("render notification runtime requires dateNow");
    }

    return dateNow;
}

export function getShowRenderNotificationRuntime(
    scope: ShowRenderNotificationRuntimeScope = defaultShowRenderNotificationRuntimeScope
): ShowRenderNotificationRuntime {
    return {
        dateNow() {
            return getRequiredDateNow(scope)();
        },
    };
}
