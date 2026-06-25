import { getBrowserHTMLElement } from "../../runtime/browserRuntime.js";

export interface ElementIdUtilsRuntimeScope {
    readonly getHTMLElement?:
        | (() => typeof globalThis.HTMLElement | undefined)
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
): typeof globalThis.HTMLElement {
    const HTMLElementConstructor = scope.getHTMLElement?.();
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
