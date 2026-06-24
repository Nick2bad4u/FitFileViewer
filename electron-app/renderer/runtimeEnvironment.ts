type RendererRuntimeEventTarget = Pick<
    EventTarget,
    "addEventListener" | "removeEventListener"
>;

type RendererRuntimeGlobalScope = typeof globalThis & {
    readonly electronAPI?: unknown;
};

export type RendererAddEventListener = typeof globalThis.addEventListener;
export type RendererClearInterval = typeof globalThis.clearInterval;
export type RendererRemoveEventListener = typeof globalThis.removeEventListener;
export type RendererSetInterval = typeof globalThis.setInterval;
export type RendererSetTimeout = typeof globalThis.setTimeout;

export type RendererRuntimeEnvironment = {
    readonly addEventListener: RendererAddEventListener;
    readonly clearInterval: RendererClearInterval;
    readonly console: Console;
    readonly documentTarget: Document;
    readonly electronApiCandidate: unknown;
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
    readonly getElectronApiCandidate?: (() => unknown) | undefined;
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

const defaultRendererRuntimeEnvironmentScope: RendererRuntimeEnvironmentScope =
    {
        getAddEventListener: () => globalThis.addEventListener.bind(globalThis),
        getClearInterval: () => globalThis.clearInterval.bind(globalThis),
        getConsole: () => globalThis.console,
        getDocument: () => globalThis.document,
        getElectronApiCandidate: getDefaultElectronApiCandidate,
        getRemoveEventListener: () =>
            globalThis.removeEventListener.bind(globalThis),
        getRendererEventTarget: getDefaultRendererEventTarget,
        getSetInterval: () => globalThis.setInterval.bind(globalThis),
        getSetTimeout: () => globalThis.setTimeout.bind(globalThis),
    };

function getDefaultElectronApiCandidate(): unknown {
    const rendererScope = globalThis as RendererRuntimeGlobalScope;

    return rendererScope.electronAPI;
}

function getDefaultRendererEventTarget():
    | RendererRuntimeEventTarget
    | undefined {
    return globalThis;
}

function getRequiredRuntimeValue<T>(value: T | undefined, message: string): T {
    if (value === undefined) {
        throw new TypeError(message);
    }

    return value;
}

export function createRendererRuntimeEnvironment(
    scope: RendererRuntimeEnvironmentScope = defaultRendererRuntimeEnvironmentScope
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
        electronApiCandidate: scope.getElectronApiCandidate?.(),
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
