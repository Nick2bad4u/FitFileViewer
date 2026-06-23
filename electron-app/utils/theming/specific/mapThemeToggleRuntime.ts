export type MapThemeToggleTimerHandle =
    | ReturnType<typeof globalThis.setTimeout>
    | number;

type MapThemeToggleSetTimeout = (
    callback: () => void,
    timeout: number
) => MapThemeToggleTimerHandle;

export interface MapThemeToggleRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getCustomEvent?:
        | (() => typeof CustomEvent | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getSetTimeout?:
        | (() => MapThemeToggleSetTimeout | undefined)
        | undefined;
}

export interface MapThemeToggleRuntime {
    addDocumentListener(
        eventName: string,
        listener: EventListener,
        options: AddEventListenerOptions & { readonly signal: AbortSignal }
    ): void;
    clearTimeout(handle: MapThemeToggleTimerHandle): void;
    createAbortController(): AbortController;
    createElement<K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ): HTMLElementTagNameMap[K];
    createMapThemeChangedEvent(
        eventName: string,
        inverted: boolean
    ): CustomEvent<{ inverted: boolean }>;
    createSvgElement<K extends keyof SVGElementTagNameMap>(
        tagName: K
    ): SVGElementTagNameMap[K];
    dispatchDocumentEvent(event: Event): boolean;
    findExistingToggle(): HTMLElement | null;
    isBodyThemeDark(): boolean;
    setTimeout(
        callback: () => void,
        timeout: number
    ): MapThemeToggleTimerHandle;
}

function getCustomEventConstructor(
    scope: MapThemeToggleRuntimeScope
): typeof CustomEvent {
    const CustomEventConstructor = scope.getCustomEvent?.();
    if (typeof CustomEventConstructor !== "function") {
        throw new TypeError("mapThemeToggle requires a CustomEvent runtime");
    }

    return CustomEventConstructor;
}

function getDocument(scope: MapThemeToggleRuntimeScope): Document {
    const runtimeDocument = scope.getDocument?.();
    if (!runtimeDocument) {
        throw new TypeError("mapThemeToggle requires a document runtime");
    }

    return runtimeDocument;
}

const defaultMapThemeToggleRuntimeScope: MapThemeToggleRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
    getClearTimeout: () => globalThis.clearTimeout,
    getCustomEvent: () => globalThis.CustomEvent,
    getDocument: () => globalThis.document,
    getSetTimeout: () => globalThis.setTimeout,
};

export function getMapThemeToggleRuntime(
    scope: MapThemeToggleRuntimeScope = defaultMapThemeToggleRuntimeScope
): MapThemeToggleRuntime {
    return {
        addDocumentListener(
            eventName: string,
            listener: EventListener,
            options: AddEventListenerOptions & { readonly signal: AbortSignal }
        ): void {
            getDocument(scope).addEventListener(eventName, listener, {
                ...options,
                signal: options.signal,
            });
        },
        clearTimeout(handle): void {
            const clearTimeoutRef = scope.getClearTimeout?.();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "mapThemeToggle requires a clearTimeout runtime"
                );
            }

            clearTimeoutRef(handle);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.getAbortController?.();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "mapThemeToggle requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        createElement(tagName) {
            return getDocument(scope).createElement(tagName);
        },
        createMapThemeChangedEvent(
            eventName: string,
            inverted: boolean
        ): CustomEvent<{ inverted: boolean }> {
            return new (getCustomEventConstructor(scope))(eventName, {
                bubbles: true,
                detail: { inverted },
            });
        },
        createSvgElement(tagName) {
            return getDocument(scope).createElementNS(
                "http://www.w3.org/2000/svg",
                tagName
            );
        },
        dispatchDocumentEvent(event: Event): boolean {
            return getDocument(scope).dispatchEvent(event);
        },
        findExistingToggle(): HTMLElement | null {
            return getDocument(scope).querySelector<HTMLElement>(
                ".map-theme-toggle"
            );
        },
        isBodyThemeDark(): boolean {
            return getDocument(scope).body.classList.contains("theme-dark");
        },
        setTimeout(callback, timeout): MapThemeToggleTimerHandle {
            const setTimeoutRef = scope.getSetTimeout?.();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "mapThemeToggle requires a setTimeout runtime"
                );
            }

            return setTimeoutRef(callback, timeout);
        },
    };
}
