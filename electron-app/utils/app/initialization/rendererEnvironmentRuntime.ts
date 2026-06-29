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
    readonly getDevelopmentFlag: RendererEnvironmentRuntimeProvider<unknown>;
    readonly getDocument: RendererEnvironmentRuntimeProvider<unknown>;
    readonly getLocation: RendererEnvironmentRuntimeProvider<unknown>;
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

type RendererEnvironmentRuntimeProvider<T> = (() => T | undefined) | undefined;

function getRequiredProvider<T>(
    provider: RendererEnvironmentRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `rendererEnvironment requires ${providerName} provider`
        );
    }

    return provider;
}

export function getRendererEnvironmentRuntime(
    scope: RendererEnvironmentRuntimeScope = defaultRendererEnvironmentRuntimeScope
): RendererEnvironmentRuntime {
    const getDevelopmentFlag = getRequiredProvider(
        scope.getDevelopmentFlag,
        "developmentFlag"
    );
    const getDocument = getRequiredProvider(scope.getDocument, "document");
    const getLocation = getRequiredProvider(scope.getLocation, "location");

    return {
        getDefaultRendererEnvironmentInput(): RendererEnvironmentInput {
            return {
                developmentFlag: getDevelopmentFlag(),
                document: getDocument(),
                location: getLocation(),
            };
        },
    };
}
