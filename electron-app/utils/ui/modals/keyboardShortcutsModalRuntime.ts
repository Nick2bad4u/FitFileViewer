import { getIconFactoryRuntime } from "../icons/iconFactoryRuntime.js";

export type KeyboardShortcutsModalTimerHandle = ReturnType<
    typeof globalThis.setTimeout
>;

export interface KeyboardShortcutsModalRuntimeScope {
    readonly getCancelAnimationFrame?:
        | (() => typeof globalThis.cancelAnimationFrame | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getDocument?:
        | (() => Document | undefined)
        | undefined;
    readonly getRequestAnimationFrame?:
        | (() => typeof globalThis.requestAnimationFrame | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
}

export interface KeyboardShortcutsModalRuntime {
    readonly cancelAnimationFrame: (handle: number) => void;
    readonly clearTimeout: (handle: KeyboardShortcutsModalTimerHandle) => void;
    readonly createSvgElement: <K extends keyof SVGElementTagNameMap>(
        tagName: K
    ) => SVGElementTagNameMap[K];
    readonly requestAnimationFrame: (
        callback: FrameRequestCallback
    ) => null | number;
    readonly setTimeout: (
        callback: () => void,
        delay: number
    ) => KeyboardShortcutsModalTimerHandle;
}

export const KEYBOARD_SHORTCUTS_MODAL_SVG_NAMESPACE =
    "http://www.w3.org/2000/svg";

const defaultKeyboardShortcutsModalRuntimeScope: KeyboardShortcutsModalRuntimeScope =
    {
        getCancelAnimationFrame: () => globalThis.cancelAnimationFrame,
        getClearTimeout: () => globalThis.clearTimeout,
        getDocument: () => globalThis.document,
        getRequestAnimationFrame: () => globalThis.requestAnimationFrame,
        getSetTimeout: () => globalThis.setTimeout,
    };

function getScopeCancelAnimationFrame(
    scope: KeyboardShortcutsModalRuntimeScope
): typeof globalThis.cancelAnimationFrame | undefined {
    return scope.getCancelAnimationFrame?.();
}

function getScopeClearTimeout(
    scope: KeyboardShortcutsModalRuntimeScope
): typeof globalThis.clearTimeout | undefined {
    return scope.getClearTimeout?.();
}

function getScopeDocument(
    scope: KeyboardShortcutsModalRuntimeScope
): Document {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError(
            "keyboardShortcutsModalRuntime requires a document runtime"
        );
    }

    return runtimeDocument;
}

function getScopeRequestAnimationFrame(
    scope: KeyboardShortcutsModalRuntimeScope
): typeof globalThis.requestAnimationFrame | undefined {
    return scope.getRequestAnimationFrame?.();
}

function getScopeSetTimeout(
    scope: KeyboardShortcutsModalRuntimeScope
): typeof globalThis.setTimeout | undefined {
    return scope.getSetTimeout?.();
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
    scope: KeyboardShortcutsModalRuntimeScope,
    tagName: K
): SVGElementTagNameMap[K] {
    const runtimeDocument = getScopeDocument(scope);
    return getIconFactoryRuntime({
        getDocument: () => runtimeDocument,
    }).createSvgElement(tagName);
}

export function getKeyboardShortcutsModalRuntime(
    scope: KeyboardShortcutsModalRuntimeScope = defaultKeyboardShortcutsModalRuntimeScope
): KeyboardShortcutsModalRuntime {
    return {
        cancelAnimationFrame(handle: number): void {
            getScopeCancelAnimationFrame(scope)?.call(scope, handle);
        },
        clearTimeout(handle: KeyboardShortcutsModalTimerHandle): void {
            const clearTimeoutRef = getScopeClearTimeout(scope);
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "keyboardShortcutsModalRuntime requires a clearTimeout runtime"
                );
            }
            clearTimeoutRef.call(scope, handle);
        },
        createSvgElement<K extends keyof SVGElementTagNameMap>(
            tagName: K
        ): SVGElementTagNameMap[K] {
            return createSvgElement(scope, tagName);
        },
        requestAnimationFrame(callback: FrameRequestCallback): null | number {
            const requestAnimationFrameRef =
                getScopeRequestAnimationFrame(scope);
            if (typeof requestAnimationFrameRef !== "function") {
                return null;
            }

            return requestAnimationFrameRef.call(scope, callback);
        },
        setTimeout(
            callback: () => void,
            delay: number
        ): KeyboardShortcutsModalTimerHandle {
            const setTimeoutRef = getScopeSetTimeout(scope);
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "keyboardShortcutsModalRuntime requires a setTimeout runtime"
                );
            }
            return setTimeoutRef.call(scope, callback, delay);
        },
    };
}
