export type RendererRuntimeEnvironment = {
    readonly addEventListener: typeof globalThis.addEventListener;
    readonly clearInterval: typeof globalThis.clearInterval;
    readonly console: Console;
    readonly documentTarget: Document;
    readonly electronApiCandidate: unknown;
    readonly removeEventListener: typeof globalThis.removeEventListener;
    readonly rendererGlobal: Window & typeof globalThis;
    readonly setInterval: typeof globalThis.setInterval;
    readonly setTimeout: typeof globalThis.setTimeout;
};

type RendererRuntimeScope = Window & typeof globalThis;

export type RendererRuntimeEnvironmentScope = {
    readonly getAddEventListener?:
        | (() => typeof globalThis.addEventListener | undefined)
        | undefined;
    readonly getClearInterval?:
        | (() => typeof globalThis.clearInterval | undefined)
        | undefined;
    readonly getConsole?: (() => Console | undefined) | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getElectronApiCandidate?: (() => unknown) | undefined;
    readonly getRemoveEventListener?:
        | (() => typeof globalThis.removeEventListener | undefined)
        | undefined;
    readonly getRendererScope?:
        | (() => RendererRuntimeScope | undefined)
        | undefined;
    readonly getSetInterval?:
        | (() => typeof globalThis.setInterval | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
};

const defaultRendererRuntimeEnvironmentScope: RendererRuntimeEnvironmentScope =
    {
        getAddEventListener: () => globalThis.addEventListener.bind(globalThis),
        getClearInterval: () => globalThis.clearInterval.bind(globalThis),
        getConsole: () => globalThis.console,
        getDocument: () => globalThis.document,
        getElectronApiCandidate: () => Reflect.get(globalThis, "electronAPI"),
        getRemoveEventListener: () =>
            globalThis.removeEventListener.bind(globalThis),
        getRendererScope: () => globalThis as RendererRuntimeScope,
        getSetInterval: () => globalThis.setInterval.bind(globalThis),
        getSetTimeout: () => globalThis.setTimeout.bind(globalThis),
    };

function getRequiredRuntimeValue<T>(value: T | undefined, message: string): T {
    if (value === undefined) {
        throw new TypeError(message);
    }

    return value;
}

export function createRendererRuntimeEnvironment(
    scope: RendererRuntimeEnvironmentScope = defaultRendererRuntimeEnvironmentScope
): RendererRuntimeEnvironment {
    const rendererGlobal = getRequiredRuntimeValue(
        scope.getRendererScope?.(),
        "renderer runtime environment requires a renderer scope"
    );

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
        rendererGlobal,
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
