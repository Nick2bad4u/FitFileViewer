import { getBrowserAbortController } from "../runtime/browserRuntime.js";

export interface MainUiDomUtilsRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
}

export interface MainUiDomUtilsRuntime {
    createAbortController: () => AbortController;
}

const defaultMainUiDomUtilsRuntimeScope: MainUiDomUtilsRuntimeScope = {
    getAbortController: getBrowserAbortController,
};

export function getMainUiDomUtilsRuntime(
    scope: MainUiDomUtilsRuntimeScope = defaultMainUiDomUtilsRuntimeScope
): MainUiDomUtilsRuntime {
    return {
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.getAbortController?.();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "main UI DOM utilities require an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
    };
}
