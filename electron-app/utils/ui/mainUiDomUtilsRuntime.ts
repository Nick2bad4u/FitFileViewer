import {
    type BrowserAbortControllerConstructor,
    getBrowserAbortController,
    getBrowserDocument,
} from "../runtime/browserRuntime.js";
import { getElementByIdFlexible } from "./dom/elementIdUtils.js";

export interface MainUiDomUtilsRuntimeScope {
    readonly getAbortController: MainUiDomUtilsRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getDocument: MainUiDomUtilsRuntimeProvider<Document>;
}

type MainUiDomUtilsRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface MainUiDomUtilsRuntime {
    createAbortController: () => AbortController;
    getElementByIdFlexible: (id: string) => HTMLElement | null;
}

const defaultMainUiDomUtilsRuntimeScope: MainUiDomUtilsRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getDocument: getBrowserDocument,
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
        getElementByIdFlexible(id: string): HTMLElement | null {
            return getElementByIdFlexible(
                getRequiredDocument(scope.getDocument),
                id
            );
        },
    };
}

function getRequiredDocument(
    provider: MainUiDomUtilsRuntimeProvider<Document>
): Document {
    const documentRef = getRequiredProvider(provider, "document")();
    if (!documentRef) {
        throw new TypeError(
            "main UI DOM utilities require a document runtime"
        );
    }

    return documentRef;
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
