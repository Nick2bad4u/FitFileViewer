import { querySelectorByIdFlexible } from "../dom/elementIdUtils.js";

type DisableableFormControl =
    | HTMLButtonElement
    | HTMLInputElement
    | HTMLSelectElement
    | HTMLTextAreaElement;

export interface SyncRendererLoadingRuntimeScope {
    readonly document?: Document | undefined;
    readonly HTMLButtonElement?: typeof HTMLButtonElement | undefined;
    readonly HTMLInputElement?: typeof HTMLInputElement | undefined;
    readonly HTMLSelectElement?: typeof HTMLSelectElement | undefined;
    readonly HTMLTextAreaElement?: typeof HTMLTextAreaElement | undefined;
}

export interface SyncRendererLoadingRuntime {
    getLoadingOverlay: () => HTMLElement | null;
    getInteractiveElements: () => Element[];
    isDisableableFormControl: (
        element: Element
    ) => element is DisableableFormControl;
    setBodyLoading: (loading: boolean) => void;
}

const defaultSyncRendererLoadingRuntimeScope: SyncRendererLoadingRuntimeScope =
    globalThis;

function getDocument(scope: SyncRendererLoadingRuntimeScope): Document {
    const runtimeDocument = scope.document;
    if (!runtimeDocument) {
        throw new TypeError("syncRendererLoading requires a document runtime");
    }

    return runtimeDocument;
}

function getConstructor<K extends keyof Pick<
    SyncRendererLoadingRuntimeScope,
    | "HTMLButtonElement"
    | "HTMLInputElement"
    | "HTMLSelectElement"
    | "HTMLTextAreaElement"
>>(
    scope: SyncRendererLoadingRuntimeScope,
    name: K
): NonNullable<SyncRendererLoadingRuntimeScope[K]> | undefined {
    return scope[name] ?? scope.document?.defaultView?.[name];
}

function isInstanceOfConstructor<K extends keyof Pick<
    SyncRendererLoadingRuntimeScope,
    | "HTMLButtonElement"
    | "HTMLInputElement"
    | "HTMLSelectElement"
    | "HTMLTextAreaElement"
>>(
    scope: SyncRendererLoadingRuntimeScope,
    element: Element,
    name: K
): boolean {
    const Constructor = getConstructor(scope, name);
    return typeof Constructor === "function" && element instanceof Constructor;
}

export function getSyncRendererLoadingRuntime(
    scope: SyncRendererLoadingRuntimeScope = defaultSyncRendererLoadingRuntimeScope
): SyncRendererLoadingRuntime {
    return {
        getInteractiveElements(): Element[] {
            return [
                ...getDocument(scope).querySelectorAll(
                    "button, input, select, textarea"
                ),
            ];
        },
        getLoadingOverlay(): HTMLElement | null {
            return querySelectorByIdFlexible(
                getDocument(scope),
                "#loading_overlay"
            );
        },
        isDisableableFormControl(
            element: Element
        ): element is DisableableFormControl {
            return (
                isInstanceOfConstructor(scope, element, "HTMLButtonElement") ||
                isInstanceOfConstructor(scope, element, "HTMLInputElement") ||
                isInstanceOfConstructor(scope, element, "HTMLSelectElement") ||
                isInstanceOfConstructor(scope, element, "HTMLTextAreaElement")
            );
        },
        setBodyLoading(loading: boolean): void {
            const { body } = getDocument(scope);
            body.style.cursor = loading ? "wait" : "";
            body.setAttribute("aria-busy", String(loading));
        },
    };
}
