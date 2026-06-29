import {
    type BrowserHTMLElementConstructor,
    getBrowserHTMLElement,
} from "../../runtime/browserRuntime.js";

export interface OpenFitFileFromPathRuntimeScope {
    readonly getHTMLElement: OpenFitFileFromPathRuntimeProvider<BrowserHTMLElementConstructor>;
}

type OpenFitFileFromPathRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface OpenFitFileFromPathRuntime {
    isHTMLElement: (value: unknown) => value is HTMLElement;
}

const defaultOpenFitFileFromPathRuntimeScope: OpenFitFileFromPathRuntimeScope =
    {
        getHTMLElement: getBrowserHTMLElement,
    };

function getHTMLElementConstructor(
    scope: OpenFitFileFromPathRuntimeScope
): BrowserHTMLElementConstructor {
    const HTMLElementConstructor = getRequiredProvider(
        scope.getHTMLElement,
        "HTMLElement"
    )();
    if (typeof HTMLElementConstructor !== "function") {
        throw new TypeError(
            "openFitFileFromPath requires an HTMLElement runtime"
        );
    }

    return HTMLElementConstructor;
}

function getRequiredProvider<T>(
    provider: OpenFitFileFromPathRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `openFitFileFromPath requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

export function getOpenFitFileFromPathRuntime(
    scope: OpenFitFileFromPathRuntimeScope = defaultOpenFitFileFromPathRuntimeScope
): OpenFitFileFromPathRuntime {
    return {
        isHTMLElement(value: unknown): value is HTMLElement {
            return value instanceof getHTMLElementConstructor(scope);
        },
    };
}
