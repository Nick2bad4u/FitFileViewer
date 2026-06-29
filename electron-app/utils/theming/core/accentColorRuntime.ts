import {
    type BrowserHTMLElementConstructor,
    getBrowserDocument,
    getBrowserHTMLElement,
    getBrowserLocalStorage,
} from "../../runtime/browserRuntime.js";

type AccentColorDocument = Pick<Document, "body" | "documentElement">;
type AccentColorRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface AccentColorRuntimeScope {
    readonly getDocument: AccentColorRuntimeProvider<AccentColorDocument>;
    readonly getHTMLElement: AccentColorRuntimeProvider<BrowserHTMLElementConstructor>;
    readonly getStorage: AccentColorRuntimeProvider<Storage>;
}

export interface AccentColorRuntime {
    getAccentColorTargets: () => HTMLElement[];
    getStorage: () => Storage | undefined;
}

const defaultAccentColorRuntimeScope: AccentColorRuntimeScope = {
    getDocument: getBrowserDocument,
    getHTMLElement: getBrowserHTMLElement,
    getStorage: getBrowserLocalStorage,
};

function getRequiredProvider<T>(
    provider: AccentColorRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `accentColorRuntime requires ${providerName} provider`
        );
    }

    return provider;
}

function getDocument(
    scope: AccentColorRuntimeScope
): AccentColorDocument | undefined {
    return getRequiredProvider(scope.getDocument, "document")();
}

function getHTMLElement(
    scope: AccentColorRuntimeScope
): BrowserHTMLElementConstructor | undefined {
    return getRequiredProvider(scope.getHTMLElement, "HTMLElement")();
}

function getStorage(scope: AccentColorRuntimeScope): Storage | undefined {
    return getRequiredProvider(scope.getStorage, "storage")();
}

export function getAccentColorRuntime(
    scope: AccentColorRuntimeScope = defaultAccentColorRuntimeScope
): AccentColorRuntime {
    return {
        getAccentColorTargets(): HTMLElement[] {
            const runtimeDocument = getDocument(scope),
                HTMLElementConstructor = getHTMLElement(scope),
                targets: HTMLElement[] = [];

            if (
                !runtimeDocument ||
                typeof HTMLElementConstructor !== "function"
            ) {
                return targets;
            }

            if (
                runtimeDocument.documentElement instanceof
                HTMLElementConstructor
            ) {
                targets.push(runtimeDocument.documentElement);
            }

            if (runtimeDocument.body instanceof HTMLElementConstructor) {
                targets.push(runtimeDocument.body);
            }

            return targets;
        },
        getStorage(): Storage | undefined {
            return getStorage(scope);
        },
    };
}
