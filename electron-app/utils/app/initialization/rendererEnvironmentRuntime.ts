import {
    getBrowserDevelopmentFlag,
    getBrowserDocument,
    getBrowserLocation,
} from "../../runtime/browserRuntime.js";

export interface RendererEnvironmentInput {
    readonly developmentFlag?: unknown;
    readonly document?: unknown;
    readonly location?: unknown;
}

export interface RendererEnvironmentRuntimeScope {
    readonly getDevelopmentFlag?: (() => unknown) | undefined;
    readonly getDocument?: (() => unknown) | undefined;
    readonly getLocation?: (() => unknown) | undefined;
}

export interface RendererEnvironmentRuntime {
    getDefaultRendererEnvironmentInput: () => RendererEnvironmentInput;
}

const defaultRendererEnvironmentRuntimeScope: RendererEnvironmentRuntimeScope =
    {
        getDevelopmentFlag: getBrowserDevelopmentFlag,
        getDocument: getBrowserDocument,
        getLocation: getBrowserLocation,
    };

export function getRendererEnvironmentRuntime(
    scope: RendererEnvironmentRuntimeScope = defaultRendererEnvironmentRuntimeScope
): RendererEnvironmentRuntime {
    return {
        getDefaultRendererEnvironmentInput(): RendererEnvironmentInput {
            return {
                developmentFlag: scope.getDevelopmentFlag?.(),
                document: scope.getDocument?.(),
                location: scope.getLocation?.(),
            };
        },
    };
}
