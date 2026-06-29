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
    readonly getAddEventListener: RendererRuntimeEnvironmentProvider<
        RendererAddEventListener
    >;
    readonly getClearInterval: RendererRuntimeEnvironmentProvider<
        RendererClearInterval
    >;
    readonly getConsole: RendererRuntimeEnvironmentProvider<Console>;
    readonly getDocument: RendererRuntimeEnvironmentProvider<Document>;
    readonly getElectronAPI: RendererRuntimeEnvironmentProvider<unknown>;
    readonly getRemoveEventListener: RendererRuntimeEnvironmentProvider<
        RendererRemoveEventListener
    >;
    readonly getRendererEventTarget: RendererRuntimeEnvironmentProvider<
        RendererRuntimeEventTarget
    >;
    readonly getSetInterval: RendererRuntimeEnvironmentProvider<
        RendererSetInterval
    >;
    readonly getSetTimeout: RendererRuntimeEnvironmentProvider<
        RendererSetTimeout
    >;
};

type RendererRuntimeEnvironmentProvider<T> = (() => T | undefined) | undefined;

function getRequiredRuntimeValue<T>(value: T | undefined, message: string): T {
    if (value === undefined) {
        throw new TypeError(message);
    }

    return value;
}

export function createRendererRuntimeEnvironment(
    scope: RendererRuntimeEnvironmentScope
): RendererRuntimeEnvironment {
    const getAddEventListener = getRequiredProvider(
        scope.getAddEventListener,
        "addEventListener"
    );
    const getClearInterval = getRequiredProvider(
        scope.getClearInterval,
        "clearInterval"
    );
    const getConsole = getRequiredProvider(scope.getConsole, "console");
    const getDocument = getRequiredProvider(scope.getDocument, "document");
    const getElectronAPI = getRequiredProvider(
        scope.getElectronAPI,
        "electron API"
    );
    const getRemoveEventListener = getRequiredProvider(
        scope.getRemoveEventListener,
        "removeEventListener"
    );
    const getRendererEventTarget = getRequiredProvider(
        scope.getRendererEventTarget,
        "renderer event target"
    );
    const getSetInterval = getRequiredProvider(
        scope.getSetInterval,
        "setInterval"
    );
    const getSetTimeout = getRequiredProvider(
        scope.getSetTimeout,
        "setTimeout"
    );

    return {
        addEventListener: getRequiredRuntimeValue(
            getAddEventListener(),
            "renderer runtime environment requires addEventListener"
        ),
        clearInterval: getRequiredRuntimeValue(
            getClearInterval(),
            "renderer runtime environment requires clearInterval"
        ),
        console: getRequiredRuntimeValue(
            getConsole(),
            "renderer runtime environment requires a console reference"
        ),
        documentTarget: getRequiredRuntimeValue(
            getDocument(),
            "renderer runtime environment requires a document reference"
        ),
        electronApiScope: createRendererElectronApiScope(getElectronAPI),
        removeEventListener: getRequiredRuntimeValue(
            getRemoveEventListener(),
            "renderer runtime environment requires removeEventListener"
        ),
        rendererEventTarget: getRequiredRuntimeValue(
            getRendererEventTarget(),
            "renderer runtime environment requires a renderer event target"
        ),
        setInterval: getRequiredRuntimeValue(
            getSetInterval(),
            "renderer runtime environment requires setInterval"
        ),
        setTimeout: getRequiredRuntimeValue(
            getSetTimeout(),
            "renderer runtime environment requires setTimeout"
        ),
    };
}

function getRequiredProvider<T>(
    provider: RendererRuntimeEnvironmentProvider<T>,
    providerLabel: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `renderer runtime environment requires ${providerLabel} provider`
        );
    }

    return provider;
}
