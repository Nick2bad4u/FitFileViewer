import { getIconFactoryRuntime } from "../icons/iconFactoryRuntime.js";
import { getBrowserDocument } from "../../runtime/browserRuntime.js";

export interface LoadingOverlayRuntimeScope {
    readonly getDocument: LoadingOverlayRuntimeProvider<Document>;
}

export interface LoadingOverlayRuntime {
    appendToBody: (element: Readonly<HTMLElement>) => void;
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    createSvgElement: <K extends keyof SVGElementTagNameMap>(
        tagName: K
    ) => SVGElementTagNameMap[K];
    querySelector: <E extends Element = Element>(selector: string) => E | null;
}

type LoadingOverlayRuntimeProvider<T> = (() => T | undefined) | undefined;

const defaultLoadingOverlayRuntimeScope: LoadingOverlayRuntimeScope = {
    getDocument: getBrowserDocument,
};

function getDocument(getRuntimeDocument: () => Document | undefined): Document {
    const runtimeDocument = getRuntimeDocument();
    if (!runtimeDocument) {
        throw new TypeError("LoadingOverlay requires a document runtime");
    }

    return runtimeDocument;
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
    getRuntimeDocument: () => Document | undefined,
    tagName: K
): SVGElementTagNameMap[K] {
    const runtimeDocument = getDocument(getRuntimeDocument);
    return getIconFactoryRuntime({
        getDocument: () => runtimeDocument,
    }).createSvgElement(tagName);
}

export function getLoadingOverlayRuntime(
    scope: LoadingOverlayRuntimeScope = defaultLoadingOverlayRuntimeScope
): LoadingOverlayRuntime {
    const getRuntimeDocument = getRequiredProvider(
        scope.getDocument,
        "document"
    );

    return {
        appendToBody(element: Readonly<HTMLElement>): void {
            getDocument(getRuntimeDocument).body.append(element);
        },
        createElement<K extends keyof HTMLElementTagNameMap>(
            tagName: K
        ): HTMLElementTagNameMap[K] {
            return getDocument(getRuntimeDocument).createElement(tagName);
        },
        createSvgElement<K extends keyof SVGElementTagNameMap>(
            tagName: K
        ): SVGElementTagNameMap[K] {
            return createSvgElement(getRuntimeDocument, tagName);
        },
        querySelector<E extends Element = Element>(selector: string): E | null {
            return getDocument(getRuntimeDocument).querySelector<E>(selector);
        },
    };
}

function getRequiredProvider<T>(
    provider: LoadingOverlayRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `LoadingOverlay requires a ${providerName} provider`
        );
    }

    return provider;
}
