import {
    getBrowserDocument,
    getBrowserLocation,
} from "../../runtime/browserRuntime.js";

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

interface RendererEnvironmentGlobalScope {
    readonly __DEVELOPMENT__?: unknown;
    readonly electronAPI?: unknown;
}

const defaultRendererEnvironmentRuntimeScope: RendererEnvironmentRuntimeScope =
    {
        getDevelopmentFlag: getGlobalDevelopmentFlag,
        getDocument: getBrowserDocument,
        getElectronAPI: getGlobalElectronAPI,
        getLocation: getBrowserLocation,
    };

function getGlobalDevelopmentFlag(): unknown {
    const rendererGlobal = globalThis as RendererEnvironmentGlobalScope;
    return rendererGlobal.__DEVELOPMENT__;
}

function getGlobalElectronAPI(): unknown {
    const rendererGlobal = globalThis as RendererEnvironmentGlobalScope;
    return rendererGlobal.electronAPI;
}

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
