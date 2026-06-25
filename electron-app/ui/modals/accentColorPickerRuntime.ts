export interface AccentColorPickerRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getDocumentEventTarget?: (() => Document | undefined) | undefined;
    readonly getHTMLButtonElement?:
        | (() => typeof HTMLButtonElement | undefined)
        | undefined;
    readonly getHTMLElement?:
        | (() => typeof HTMLElement | undefined)
        | undefined;
    readonly getHTMLInputElement?:
        | (() => typeof HTMLInputElement | undefined)
        | undefined;
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

function getAbortControllerConstructor(
    scope: AccentColorPickerRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor = scope.getAbortController?.();
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
    return scope.getDocumentEventTarget?.() ?? scope.getDocument?.();
}

function getRequiredDocument(scope: AccentColorPickerRuntimeScope): Document {
    const documentRef = scope.getDocument?.();
    if (!documentRef) {
        throw new TypeError("accentColorPicker requires a document runtime");
    }

    return documentRef;
}

function getElementConstructor<TElement extends Element>(
    getConstructor:
        | (() => (new (...args: unknown[]) => TElement) | undefined)
        | undefined,
    errorMessage: string
): new (...args: unknown[]) => TElement {
    const ElementConstructor = getConstructor?.();
    if (typeof ElementConstructor !== "function") {
        throw new TypeError(errorMessage);
    }

    return ElementConstructor;
}

const defaultAccentColorPickerRuntimeScope: AccentColorPickerRuntimeScope =
    Object.freeze({
        getAbortController: () => globalThis.AbortController,
        getDocument: () => globalThis.document,
        getHTMLButtonElement: () => globalThis.HTMLButtonElement,
        getHTMLElement: () => globalThis.HTMLElement,
        getHTMLInputElement: () => globalThis.HTMLInputElement,
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
                    "accentColorPicker requires an HTMLButtonElement runtime"
                )
            );
        },
        isHTMLElement(value): value is HTMLElement {
            return (
                value instanceof
                getElementConstructor(
                    scope.getHTMLElement,
                    "accentColorPicker requires an HTMLElement runtime"
                )
            );
        },
        isHTMLInputElement(value): value is HTMLInputElement {
            return (
                value instanceof
                getElementConstructor(
                    scope.getHTMLInputElement,
                    "accentColorPicker requires an HTMLInputElement runtime"
                )
            );
        },
    };
}
