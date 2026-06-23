export interface RendererEnvironmentInput {
    readonly developmentFlag?: unknown;
    readonly document?: unknown;
    readonly electronAPI?: unknown;
    readonly location?: unknown;
}

export interface RendererEnvironmentRuntimeScope {
    readonly getDevelopmentFlag?: (() => unknown) | undefined;
    readonly getDocument?: (() => unknown) | undefined;
    readonly getElectronAPI?: (() => unknown) | undefined;
    readonly getLocation?: (() => unknown) | undefined;
}

export interface RendererEnvironmentRuntime {
    getDefaultRendererEnvironmentInput: () => RendererEnvironmentInput;
}

const defaultRendererEnvironmentRuntimeScope: RendererEnvironmentRuntimeScope =
    {
        getDevelopmentFlag: () => Reflect.get(globalThis, "__DEVELOPMENT__"),
        getDocument: () => globalThis.document,
        getElectronAPI: () => Reflect.get(globalThis, "electronAPI"),
        getLocation: () => globalThis.location,
    };

export function getRendererEnvironmentRuntime(
    scope: RendererEnvironmentRuntimeScope = defaultRendererEnvironmentRuntimeScope
): RendererEnvironmentRuntime {
    return {
        getDefaultRendererEnvironmentInput(): RendererEnvironmentInput {
            return {
                developmentFlag: scope.getDevelopmentFlag?.(),
                document: scope.getDocument?.(),
                electronAPI: scope.getElectronAPI?.(),
                location: scope.getLocation?.(),
            };
        },
    };
}
