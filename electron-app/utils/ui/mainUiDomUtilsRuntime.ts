import {
    type BrowserAbortControllerConstructor,
    getBrowserAbortController,
} from "../runtime/browserRuntime.js";

export interface MainUiDomUtilsRuntimeScope {
    readonly getAbortController: MainUiDomUtilsRuntimeProvider<BrowserAbortControllerConstructor>;
}

type MainUiDomUtilsRuntimeProvider<T> = (() => T | undefined) | undefined;

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
            const AbortControllerConstructor = getRequiredProvider(
                scope.getAbortController,
                "AbortController"
            )();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "main UI DOM utilities require an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
    };
}

function getRequiredProvider<T>(
    provider: MainUiDomUtilsRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `main UI DOM utilities require ${article} ${providerName} provider`
        );
    }

    return provider;
}
