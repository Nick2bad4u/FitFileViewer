import {
    type BrowserAbortControllerConstructor,
    type BrowserHTMLButtonElementConstructor,
    type BrowserHTMLElementConstructor,
    type BrowserHTMLInputElementConstructor,
    getBrowserAbortController,
    getBrowserDocument,
    getBrowserHTMLElement,
    getBrowserHTMLButtonElement,
    getBrowserHTMLInputElement,
} from "../../utils/runtime/browserRuntime.js";

type AccentColorPickerRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface AccentColorPickerRuntimeScope {
    readonly getAbortController: AccentColorPickerRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getDocument: AccentColorPickerRuntimeProvider<Document>;
    readonly getDocumentEventTarget: AccentColorPickerRuntimeProvider<Document>;
    readonly getHTMLButtonElement: AccentColorPickerRuntimeProvider<BrowserHTMLButtonElementConstructor>;
    readonly getHTMLElement: AccentColorPickerRuntimeProvider<BrowserHTMLElementConstructor>;
    readonly getHTMLInputElement: AccentColorPickerRuntimeProvider<BrowserHTMLInputElementConstructor>;
}

export interface AccentColorPickerRuntime {
    addDocumentKeydownListener: (
        listener: (event: Readonly<KeyboardEvent>) => void,
        options: Readonly<AddEventListenerOptions>
    ) => void;
    appendModal: (modal: HTMLElement) => void;
    appendStyle: (style: HTMLStyleElement) => void;
    createAbortController: () => AbortController;
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    createStyleElement: () => HTMLStyleElement;
    createTextNode: (data: string) => Text;
    getActiveElement: () => HTMLElement | undefined;
    getElement: <TElement extends Element = Element>(
        selector: string
    ) => TElement | null;
    getElements: <TElement extends Element = Element>(
        selector: string
    ) => TElement[];
    getModalElement: () => HTMLElement | null;
    hasStyleElement: () => boolean;
    isHTMLButtonElement: (value: unknown) => value is HTMLButtonElement;
    isHTMLElement: (value: unknown) => value is HTMLElement;
    isHTMLInputElement: (value: unknown) => value is HTMLInputElement;
}

function getRequiredProvider<T>(
    provider: AccentColorPickerRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `accentColorPicker requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

function getAbortControllerConstructor(
    scope: AccentColorPickerRuntimeScope
): BrowserAbortControllerConstructor {
    const AbortControllerConstructor = getRequiredProvider(
        scope.getAbortController,
        "AbortController"
    )();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "accentColorPicker requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getDocumentEventTarget(
    scope: AccentColorPickerRuntimeScope
): Document | undefined {
    return (
        getRequiredProvider(
            scope.getDocumentEventTarget,
            "document event-target"
        )() ?? getRequiredProvider(scope.getDocument, "document")()
    );
}

function getRequiredDocument(scope: AccentColorPickerRuntimeScope): Document {
    const documentRef = getRequiredProvider(scope.getDocument, "document")();
    if (!documentRef) {
        throw new TypeError("accentColorPicker requires a document runtime");
    }

    return documentRef;
}

function getElementConstructor<TElement extends Element>(
    getConstructor: AccentColorPickerRuntimeProvider<
        new (...args: unknown[]) => TElement
    >,
    providerName: string,
    errorMessage: string
): new (...args: unknown[]) => TElement {
    const ElementConstructor = getRequiredProvider(
        getConstructor,
        providerName
    )();
    if (typeof ElementConstructor !== "function") {
        throw new TypeError(errorMessage);
    }

    return ElementConstructor;
}

const defaultAccentColorPickerRuntimeScope: AccentColorPickerRuntimeScope =
    Object.freeze({
        getAbortController: getBrowserAbortController,
        getDocument: getBrowserDocument,
        getDocumentEventTarget: getBrowserDocument,
        getHTMLButtonElement: getBrowserHTMLButtonElement,
        getHTMLElement: getBrowserHTMLElement,
        getHTMLInputElement: getBrowserHTMLInputElement,
    });

export function getAccentColorPickerRuntime(
    scope: AccentColorPickerRuntimeScope = defaultAccentColorPickerRuntimeScope
): AccentColorPickerRuntime {
    return {
        addDocumentKeydownListener(listener, options): void {
            const documentEventTarget = getDocumentEventTarget(scope);
            if (!documentEventTarget) {
                throw new TypeError(
                    "accentColorPicker requires a document event-target runtime"
                );
            }

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-provided AbortSignal.
            documentEventTarget.addEventListener("keydown", listener, options);
        },
        appendModal(modal): void {
            getRequiredDocument(scope).body.append(modal);
        },
        appendStyle(style): void {
            getRequiredDocument(scope).head.append(style);
        },
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
        createElement<K extends keyof HTMLElementTagNameMap>(
            tagName: K
        ): HTMLElementTagNameMap[K] {
            return getRequiredDocument(scope).createElement(tagName);
        },
        createStyleElement(): HTMLStyleElement {
            return getRequiredDocument(scope).createElement("style");
        },
        createTextNode(data): Text {
            return getRequiredDocument(scope).createTextNode(data);
        },
        getActiveElement(): HTMLElement | undefined {
            const activeElement = getRequiredDocument(scope).activeElement;
            return this.isHTMLElement(activeElement)
                ? activeElement
                : undefined;
        },
        getElement<TElement extends Element = Element>(
            selector: string
        ): TElement | null {
            return getRequiredDocument(scope).querySelector<TElement>(selector);
        },
        getElements<TElement extends Element = Element>(
            selector: string
        ): TElement[] {
            return [
                ...getRequiredDocument(scope).querySelectorAll<TElement>(
                    selector
                ),
            ];
        },
        getModalElement(): HTMLElement | null {
            return getRequiredDocument(scope).querySelector<HTMLElement>(
                "#accent-color-modal"
            );
        },
        hasStyleElement(): boolean {
            return Boolean(
                getRequiredDocument(scope).querySelector(
                    "#accent-picker-styles"
                )
            );
        },
        isHTMLButtonElement(value): value is HTMLButtonElement {
            return (
                value instanceof
                getElementConstructor(
                    scope.getHTMLButtonElement,
                    "HTMLButtonElement",
                    "accentColorPicker requires an HTMLButtonElement runtime"
                )
            );
        },
        isHTMLElement(value): value is HTMLElement {
            return (
                value instanceof
                getElementConstructor(
                    scope.getHTMLElement,
                    "HTMLElement",
                    "accentColorPicker requires an HTMLElement runtime"
                )
            );
        },
        isHTMLInputElement(value): value is HTMLInputElement {
            return (
                value instanceof
                getElementConstructor(
                    scope.getHTMLInputElement,
                    "HTMLInputElement",
                    "accentColorPicker requires an HTMLInputElement runtime"
                )
            );
        },
    };
}
