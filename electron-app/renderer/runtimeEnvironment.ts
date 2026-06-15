export type RendererRuntimeEnvironment = {
    readonly addEventListener: typeof globalThis.addEventListener;
    readonly clearInterval: typeof globalThis.clearInterval;
    readonly console: Console;
    readonly documentTarget: Document;
    readonly electronApiCandidate: unknown;
    readonly removeEventListener: typeof globalThis.removeEventListener;
    readonly scope: typeof globalThis;
    readonly setInterval: typeof globalThis.setInterval;
    readonly setTimeout: typeof globalThis.setTimeout;
    readonly windowTarget: Window & typeof globalThis;
};

export type RendererRuntimeEnvironmentScope =
    | (Window & typeof globalThis)
    | {
          readonly getWindow: () => (Window & typeof globalThis) | undefined;
      };

const defaultRendererRuntimeEnvironmentScope: RendererRuntimeEnvironmentScope = {
    getWindow: () => globalThis.window,
};

function resolveRendererWindow(
    scope: RendererRuntimeEnvironmentScope
): Window & typeof globalThis {
    if ("getWindow" in scope) {
        const windowTarget = scope.getWindow();
        if (windowTarget === undefined) {
            throw new TypeError(
                "renderer runtime environment requires a window runtime"
            );
        }

        return windowTarget;
    }

    return scope;
}

export function createRendererRuntimeEnvironment(
    scope: RendererRuntimeEnvironmentScope = defaultRendererRuntimeEnvironmentScope
): RendererRuntimeEnvironment {
    const windowTarget = resolveRendererWindow(scope);

    return {
        addEventListener: windowTarget.addEventListener.bind(windowTarget),
        clearInterval: windowTarget.clearInterval.bind(windowTarget),
        console: windowTarget.console,
        documentTarget: windowTarget.document,
        electronApiCandidate: Reflect.get(windowTarget, "electronAPI"),
        removeEventListener:
            windowTarget.removeEventListener.bind(windowTarget),
        scope: windowTarget,
        setInterval: windowTarget.setInterval.bind(windowTarget),
        setTimeout: windowTarget.setTimeout.bind(windowTarget),
        windowTarget,
    };
}
