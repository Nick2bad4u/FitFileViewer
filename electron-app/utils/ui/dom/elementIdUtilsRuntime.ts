import {
    type BrowserHTMLElementConstructor,
    getBrowserHTMLElement,
} from "../../runtime/browserRuntime.js";

export interface ElementIdUtilsRuntimeScope {
    readonly getHTMLElement: ElementIdUtilsRuntimeProvider<BrowserHTMLElementConstructor>;
}

type ElementIdUtilsRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface ElementIdUtilsRuntime {
    isHTMLElement: (value: unknown) => value is HTMLElement;
}

const defaultElementIdUtilsRuntimeScope: ElementIdUtilsRuntimeScope = {
    getHTMLElement: getBrowserHTMLElement,
};

function getHTMLElementConstructor(
    scope: ElementIdUtilsRuntimeScope
): BrowserHTMLElementConstructor {
    const HTMLElementConstructor = getRequiredProvider(
        scope.getHTMLElement,
        "HTMLElement"
    )();
    if (typeof HTMLElementConstructor !== "function") {
        throw new TypeError("elementIdUtils requires an HTMLElement runtime");
    }

    return HTMLElementConstructor;
}

function getRequiredProvider<T>(
    provider: ElementIdUtilsRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `elementIdUtils requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

export function getElementIdUtilsRuntime(
    scope: ElementIdUtilsRuntimeScope = defaultElementIdUtilsRuntimeScope
): ElementIdUtilsRuntime {
    return {
        isHTMLElement(value: unknown): value is HTMLElement {
            return value instanceof getHTMLElementConstructor(scope);
        },
    };
}
