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
    const rendererGlobal = resolveRendererScope(scope);

    return {
        addEventListener: rendererGlobal.addEventListener.bind(rendererGlobal),
        clearInterval: rendererGlobal.clearInterval.bind(rendererGlobal),
        console: rendererGlobal.console,
        documentTarget: rendererGlobal.document,
        electronApiCandidate: Reflect.get(rendererGlobal, "electronAPI"),
        removeEventListener:
            rendererGlobal.removeEventListener.bind(rendererGlobal),
        rendererGlobal,
        setInterval: rendererGlobal.setInterval.bind(rendererGlobal),
        setTimeout: rendererGlobal.setTimeout.bind(rendererGlobal),
    };
}
