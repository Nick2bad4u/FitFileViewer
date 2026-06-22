type AccentColorDocument = Pick<Document, "body" | "documentElement">;

export interface AccentColorRuntimeScope {
    readonly getDocument?: (() => AccentColorDocument | undefined) | undefined;
    readonly getHTMLElement?:
        | (() => typeof HTMLElement | undefined)
        | undefined;
    readonly getStorage?: (() => Storage | undefined) | undefined;
}

export interface AccentColorRuntime {
    getAccentColorTargets: () => HTMLElement[];
    getStorage: () => Storage | undefined;
}

const defaultAccentColorRuntimeScope: AccentColorRuntimeScope = {
    getDocument: () => globalThis.document,
    getHTMLElement: () => globalThis.HTMLElement,
    getStorage: () => globalThis.localStorage,
};

function getDocument(
    scope: AccentColorRuntimeScope
): AccentColorDocument | undefined {
    return scope.getDocument?.();
}

function getHTMLElement(
    scope: AccentColorRuntimeScope
): typeof HTMLElement | undefined {
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
