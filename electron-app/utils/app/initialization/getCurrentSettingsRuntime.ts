import {
    type BrowserClearTimeout,
    type BrowserHTMLInputElementConstructor,
    type BrowserHTMLSelectElementConstructor,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserClearTimeout,
    getBrowserHTMLInputElement,
    getBrowserHTMLSelectElement,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type GetCurrentSettingsTimer = BrowserTimerHandle;

export interface GetCurrentSettingsRuntimeScope {
    readonly getClearTimeout?:
        | (() => BrowserClearTimeout | undefined)
        | undefined;
    readonly getHTMLInputElement?:
        | (() => BrowserHTMLInputElementConstructor | undefined)
        | undefined;
    readonly getHTMLSelectElement?:
        | (() => BrowserHTMLSelectElementConstructor | undefined)
        | undefined;
    readonly getSetTimeout?: (() => BrowserSetTimeout | undefined) | undefined;
}

export interface GetCurrentSettingsRuntime {
    readonly clearTimeout: (timer: GetCurrentSettingsTimer) => void;
    readonly isHTMLInputElement: (value: unknown) => value is HTMLInputElement;
    readonly isHTMLSelectElement: (
        value: unknown
    ) => value is HTMLSelectElement;
    readonly setTimeout: (
        callback: () => void,
        delayMs: number
    ) => GetCurrentSettingsTimer;
}

const defaultGetCurrentSettingsRuntimeScope: GetCurrentSettingsRuntimeScope = {
    getClearTimeout: getBrowserClearTimeout,
    getHTMLInputElement: getBrowserHTMLInputElement,
    getHTMLSelectElement: getBrowserHTMLSelectElement,
    getSetTimeout: getBrowserSetTimeout,
};

export function getGetCurrentSettingsRuntime(
    scope: GetCurrentSettingsRuntimeScope = defaultGetCurrentSettingsRuntimeScope
): GetCurrentSettingsRuntime {
    return {
        clearTimeout(timer): void {
            const clearTimeoutRef = scope.getClearTimeout?.();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "getCurrentSettingsRuntime requires clearTimeout"
                );
            }

            clearTimeoutRef(timer);
        },
        isHTMLInputElement(value): value is HTMLInputElement {
            return value instanceof getHTMLInputElementConstructor(scope);
        },
        isHTMLSelectElement(value): value is HTMLSelectElement {
            return value instanceof getHTMLSelectElementConstructor(scope);
        },
        setTimeout(callback, delayMs): GetCurrentSettingsTimer {
            const setTimeoutRef = scope.getSetTimeout?.();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "getCurrentSettingsRuntime requires setTimeout"
                );
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}

function getHTMLInputElementConstructor(
    scope: GetCurrentSettingsRuntimeScope
): BrowserHTMLInputElementConstructor {
    const HTMLInputElementConstructor = scope.getHTMLInputElement?.();
    if (typeof HTMLInputElementConstructor !== "function") {
        throw new TypeError(
            "getCurrentSettingsRuntime requires HTMLInputElement"
        );
    }

    return HTMLInputElementConstructor;
}

function getHTMLSelectElementConstructor(
    scope: GetCurrentSettingsRuntimeScope
): BrowserHTMLSelectElementConstructor {
    const HTMLSelectElementConstructor = scope.getHTMLSelectElement?.();
    if (typeof HTMLSelectElementConstructor !== "function") {
        throw new TypeError(
            "getCurrentSettingsRuntime requires HTMLSelectElement"
        );
    }

    return HTMLSelectElementConstructor;
}
