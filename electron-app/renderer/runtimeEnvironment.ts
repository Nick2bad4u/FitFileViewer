import type {
    BrowserAddEventListener,
    BrowserClearInterval,
    BrowserRemoveEventListener,
    BrowserSetInterval,
    BrowserSetTimeout,
} from "../utils/runtime/browserRuntime.js";
import {
    createRendererElectronApiScope,
    type RendererElectronApiScope,
} from "../utils/runtime/electronApiRuntime.js";

export type RendererRuntimeEventTarget = Pick<
    EventTarget,
    "addEventListener" | "removeEventListener"
>;

export type RendererAddEventListener = BrowserAddEventListener;
export type RendererClearInterval = BrowserClearInterval;
export type RendererRemoveEventListener = BrowserRemoveEventListener;
export type RendererSetInterval = BrowserSetInterval;
export type RendererSetTimeout = BrowserSetTimeout;

export type RendererRuntimeEnvironment = {
    readonly addEventListener: RendererAddEventListener;
    readonly clearInterval: RendererClearInterval;
    readonly console: Console;
    readonly documentTarget: Document;
    readonly electronApiScope: RendererElectronApiScope;
    readonly removeEventListener: RendererRemoveEventListener;
    readonly rendererEventTarget: RendererRuntimeEventTarget;
    readonly setInterval: RendererSetInterval;
    readonly setTimeout: RendererSetTimeout;
};

export type RendererRuntimeEnvironmentScope = {
    readonly getAddEventListener?:
        | (() => RendererAddEventListener | undefined)
        | undefined;
    readonly getClearInterval?:
        | (() => RendererClearInterval | undefined)
        | undefined;
    readonly getConsole?: (() => Console | undefined) | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getElectronAPI: () => unknown;
    readonly getRemoveEventListener?:
        | (() => RendererRemoveEventListener | undefined)
        | undefined;
    readonly getRendererEventTarget?:
        | (() => RendererRuntimeEventTarget | undefined)
        | undefined;
    readonly getSetInterval?:
        | (() => RendererSetInterval | undefined)
        | undefined;
    readonly getSetTimeout?: (() => RendererSetTimeout | undefined) | undefined;
};

function getRequiredRuntimeValue<T>(value: T | undefined, message: string): T {
    if (value === undefined) {
        throw new TypeError(message);
    }

    return value;
}

export function createRendererRuntimeEnvironment(
    scope: RendererRuntimeEnvironmentScope
): RendererRuntimeEnvironment {
    return {
        addEventListener: getRequiredRuntimeValue(
            scope.getAddEventListener?.(),
            "renderer runtime environment requires addEventListener"
        ),
        clearInterval: getRequiredRuntimeValue(
            scope.getClearInterval?.(),
            "renderer runtime environment requires clearInterval"
        ),
        console: getRequiredRuntimeValue(
            scope.getConsole?.(),
            "renderer runtime environment requires a console reference"
        ),
        documentTarget: getRequiredRuntimeValue(
            scope.getDocument?.(),
            "renderer runtime environment requires a document reference"
        ),
        electronApiScope: createRendererElectronApiScope(
            getRequiredRuntimeValue(
                scope.getElectronAPI,
                "renderer runtime environment requires an electron API provider"
            )
        ),
        removeEventListener: getRequiredRuntimeValue(
            scope.getRemoveEventListener?.(),
            "renderer runtime environment requires removeEventListener"
        ),
        rendererEventTarget: getRequiredRuntimeValue(
            scope.getRendererEventTarget?.(),
            "renderer runtime environment requires a renderer event target"
        ),
        setInterval: getRequiredRuntimeValue(
            scope.getSetInterval?.(),
            "renderer runtime environment requires setInterval"
        ),
        setTimeout: getRequiredRuntimeValue(
            scope.getSetTimeout?.(),
            "renderer runtime environment requires setTimeout"
        ),
    };
}
