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

type RendererRuntimeScope = Window & typeof globalThis;

export type RendererRuntimeEnvironmentScope =
    | RendererRuntimeScope
    | {
          readonly getRendererScope: () => RendererRuntimeScope | undefined;
      };

const defaultRendererRuntimeEnvironmentScope: RendererRuntimeEnvironmentScope =
    {
        getRendererScope: () => globalThis as RendererRuntimeScope,
    };

function resolveRendererScope(
    scope: RendererRuntimeEnvironmentScope
): RendererRuntimeScope {
    if ("getRendererScope" in scope) {
        const rendererScope = scope.getRendererScope();
        if (rendererScope === undefined) {
            throw new TypeError(
                "renderer runtime environment requires a renderer scope"
            );
        }

        return rendererScope;
    }

    return scope;
}

export function createRendererRuntimeEnvironment(
    scope: RendererRuntimeEnvironmentScope = defaultRendererRuntimeEnvironmentScope
): RendererRuntimeEnvironment {
    const windowTarget = resolveRendererScope(scope);

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
