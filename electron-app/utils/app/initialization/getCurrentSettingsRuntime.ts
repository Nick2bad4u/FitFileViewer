export type GetCurrentSettingsTimer = ReturnType<typeof globalThis.setTimeout>;

export interface GetCurrentSettingsRuntimeScope {
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getHTMLInputElement?:
        | (() => typeof globalThis.HTMLInputElement | undefined)
        | undefined;
    readonly getHTMLSelectElement?:
        | (() => typeof globalThis.HTMLSelectElement | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
}

export interface GetCurrentSettingsRuntime {
    readonly clearTimeout: (timer: GetCurrentSettingsTimer) => void;
    readonly isHTMLInputElement: (
        value: unknown
    ) => value is HTMLInputElement;
    readonly isHTMLSelectElement: (
        value: unknown
    ) => value is HTMLSelectElement;
    readonly setTimeout: (
        callback: () => void,
        delayMs: number
    ) => GetCurrentSettingsTimer;
}

const defaultGetCurrentSettingsRuntimeScope: GetCurrentSettingsRuntimeScope = {
    getClearTimeout: () => globalThis.clearTimeout,
    getHTMLInputElement: () => globalThis.HTMLInputElement,
    getHTMLSelectElement: () => globalThis.HTMLSelectElement,
    getSetTimeout: () => globalThis.setTimeout,
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
): typeof globalThis.HTMLInputElement {
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
): typeof globalThis.HTMLSelectElement {
    const HTMLSelectElementConstructor = scope.getHTMLSelectElement?.();
    if (typeof HTMLSelectElementConstructor !== "function") {
        throw new TypeError(
            "getCurrentSettingsRuntime requires HTMLSelectElement"
        );
    }

    return HTMLSelectElementConstructor;
}
