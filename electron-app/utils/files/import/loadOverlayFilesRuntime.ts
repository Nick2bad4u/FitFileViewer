import {
    getBrowserDocument,
    getBrowserNavigator,
} from "../../runtime/browserRuntime.js";

export interface LoadOverlayFilesRuntimeScope {
    readonly getDocument: LoadOverlayFilesRuntimeProvider<Document>;
    readonly getNavigator: LoadOverlayFilesRuntimeProvider<
        Pick<Navigator, "hardwareConcurrency">
    >;
}

type LoadOverlayFilesRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface LoadOverlayFilesRuntime {
    getActiveTabButton: () => HTMLElement | null;
    getHardwareConcurrency: () => number | undefined;
}

const defaultLoadOverlayFilesRuntimeScope: LoadOverlayFilesRuntimeScope = {
    getDocument: getBrowserDocument,
    getNavigator: getBrowserNavigator,
};

function getRequiredProvider<T>(
    provider: LoadOverlayFilesRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `loadOverlayFiles requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

export function getLoadOverlayFilesRuntime(
    scope: LoadOverlayFilesRuntimeScope = defaultLoadOverlayFilesRuntimeScope
): LoadOverlayFilesRuntime {
    return {
        getActiveTabButton(): HTMLElement | null {
            const documentRef = getRequiredProvider(
                scope.getDocument,
                "document"
            )();
            if (!documentRef) {
                return null;
            }
            return documentRef.querySelector<HTMLElement>(".tab-button.active");
        },
        getHardwareConcurrency(): number | undefined {
            try {
                return getRequiredProvider(scope.getNavigator, "navigator")()
                    ?.hardwareConcurrency;
            } catch {
                return undefined;
            }
        },
    };
}
