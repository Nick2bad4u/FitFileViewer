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

export function createRendererRuntimeEnvironment(
    scope: Window & typeof globalThis = globalThis.window
): RendererRuntimeEnvironment {
    return {
        addEventListener: scope.addEventListener.bind(scope),
        clearInterval: scope.clearInterval.bind(scope),
        console: scope.console,
        documentTarget: scope.document,
        electronApiCandidate: Reflect.get(scope, "electronAPI"),
        removeEventListener: scope.removeEventListener.bind(scope),
        scope,
        setInterval: scope.setInterval.bind(scope),
        setTimeout: scope.setTimeout.bind(scope),
        windowTarget: scope,
    };
}
