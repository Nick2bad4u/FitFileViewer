import {
    type BrowserHTMLElementConstructor,
    getBrowserHTMLElement,
} from "../../runtime/browserRuntime.js";

export interface ElementIdUtilsRuntimeScope {
    readonly getHTMLElement:
        | (() => BrowserHTMLElementConstructor | undefined)
        | undefined;
}

export interface ElementIdUtilsRuntime {
    isHTMLElement: (value: unknown) => value is HTMLElement;
}

const defaultElementIdUtilsRuntimeScope: ElementIdUtilsRuntimeScope = {
    getHTMLElement: getBrowserHTMLElement,
};

function getHTMLElementConstructor(
    scope: ElementIdUtilsRuntimeScope
): BrowserHTMLElementConstructor {
    const getHTMLElement = scope.getHTMLElement;
    if (typeof getHTMLElement !== "function") {
        throw new TypeError("elementIdUtils requires an HTMLElement provider");
    }

    const HTMLElementConstructor = getHTMLElement();
    if (typeof HTMLElementConstructor !== "function") {
        throw new TypeError("elementIdUtils requires an HTMLElement runtime");
    }

    return HTMLElementConstructor;
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
