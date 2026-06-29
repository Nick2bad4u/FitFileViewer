import {
    type BrowserHTMLElementConstructor,
    getBrowserHTMLElement,
} from "../../runtime/browserRuntime.js";

export interface OpenFitFileFromPathRuntimeScope {
    readonly getHTMLElement:
        | (() => BrowserHTMLElementConstructor | undefined)
        | undefined;
}

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
    const getHTMLElement = scope.getHTMLElement;
    if (typeof getHTMLElement !== "function") {
        throw new TypeError(
            "openFitFileFromPath requires an HTMLElement provider"
        );
    }

    const HTMLElementConstructor = getHTMLElement();
    if (typeof HTMLElementConstructor !== "function") {
        throw new TypeError(
            "openFitFileFromPath requires an HTMLElement runtime"
        );
    }

    return HTMLElementConstructor;
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
