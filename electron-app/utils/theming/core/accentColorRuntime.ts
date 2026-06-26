import {
    type BrowserHTMLElementConstructor,
    getBrowserDocument,
    getBrowserHTMLElement,
    getBrowserLocalStorage,
} from "../../runtime/browserRuntime.js";

type AccentColorDocument = Pick<Document, "body" | "documentElement">;

export interface AccentColorRuntimeScope {
    readonly getDocument?: (() => AccentColorDocument | undefined) | undefined;
    readonly getHTMLElement?:
        | (() => BrowserHTMLElementConstructor | undefined)
        | undefined;
    readonly getStorage?: (() => Storage | undefined) | undefined;
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

function getDocument(
    scope: AccentColorRuntimeScope
): AccentColorDocument | undefined {
    return scope.getDocument?.();
}

function getHTMLElement(
    scope: AccentColorRuntimeScope
): BrowserHTMLElementConstructor | undefined {
    return scope.getHTMLElement?.();
}

function getStorage(scope: AccentColorRuntimeScope): Storage | undefined {
    return scope.getStorage?.();
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
