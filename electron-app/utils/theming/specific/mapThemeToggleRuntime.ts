import {
    type BrowserAbortControllerConstructor,
    type BrowserClearTimeout,
    type BrowserCustomEventConstructor,
    type BrowserTimerHandle,
    getBrowserAbortController,
    getBrowserClearTimeout,
    getBrowserCustomEvent,
    getBrowserDocument,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";
import { isTestEnvironment as isRuntimeTestEnvironment } from "../../runtime/processEnvironment.js";

import { getIconFactoryRuntime } from "../../ui/icons/iconFactoryRuntime.js";

export type MapThemeToggleTimerHandle = BrowserTimerHandle | number;

type MapThemeToggleSetTimeout = (
    callback: () => void,
    timeout: number
) => MapThemeToggleTimerHandle;

type MapThemeToggleRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface MapThemeToggleRuntimeScope {
    readonly getAbortController: MapThemeToggleRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getClearTimeout: MapThemeToggleRuntimeProvider<BrowserClearTimeout>;
    readonly getCustomEvent: MapThemeToggleRuntimeProvider<BrowserCustomEventConstructor>;
    readonly getDocument: MapThemeToggleRuntimeProvider<Document>;
    readonly getIsTestEnvironment: MapThemeToggleRuntimeProvider<boolean>;
    readonly getSetTimeout: MapThemeToggleRuntimeProvider<MapThemeToggleSetTimeout>;
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
    isTestEnvironment(): boolean;
    setTimeout(
        callback: () => void,
        timeout: number
    ): MapThemeToggleTimerHandle;
}

function getCustomEventConstructor(
    scope: MapThemeToggleRuntimeScope
): BrowserCustomEventConstructor {
    const CustomEventConstructor = getRequiredProvider(
        scope.getCustomEvent,
        "CustomEvent"
    )();
    if (typeof CustomEventConstructor !== "function") {
        throw new TypeError("mapThemeToggle requires a CustomEvent runtime");
    }

    return CustomEventConstructor;
}

function getDocument(scope: MapThemeToggleRuntimeScope): Document {
    const runtimeDocument = getRequiredProvider(
        scope.getDocument,
        "document"
    )();
    if (!runtimeDocument) {
        throw new TypeError("mapThemeToggle requires a document runtime");
    }

    return runtimeDocument;
}

const defaultMapThemeToggleRuntimeScope: MapThemeToggleRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getClearTimeout: getBrowserClearTimeout,
    getCustomEvent: getBrowserCustomEvent,
    getDocument: getBrowserDocument,
    getIsTestEnvironment: isRuntimeTestEnvironment,
    getSetTimeout: getBrowserSetTimeout,
};

function getRequiredProvider<T>(
    provider: MapThemeToggleRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (provider === undefined) {
        throw new TypeError(`mapThemeToggle requires ${providerName} provider`);
    }

    return provider;
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
    scope: MapThemeToggleRuntimeScope,
    tagName: K
): SVGElementTagNameMap[K] {
    const runtimeDocument = getDocument(scope);
    return getIconFactoryRuntime({
        getDocument: () => runtimeDocument,
    }).createSvgElement(tagName);
}

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
            const clearTimeoutRef = getRequiredProvider(
                scope.getClearTimeout,
                "clearTimeout"
            )();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "mapThemeToggle requires a clearTimeout runtime"
                );
            }

            clearTimeoutRef(handle);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = getRequiredProvider(
                scope.getAbortController,
                "AbortController"
            )();
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
            return createSvgElement(scope, tagName);
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
        isTestEnvironment(): boolean {
            return getRequiredProvider(
                scope.getIsTestEnvironment,
                "isTestEnvironment"
            )() === true;
        },
        setTimeout(callback, timeout): MapThemeToggleTimerHandle {
            const setTimeoutRef = getRequiredProvider(
                scope.getSetTimeout,
                "setTimeout"
            )();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "mapThemeToggle requires a setTimeout runtime"
                );
            }

            return setTimeoutRef(callback, timeout);
        },
    };
}
