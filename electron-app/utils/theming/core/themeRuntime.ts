import {
    type BrowserAbortControllerConstructor,
    type BrowserClearTimeout,
    type BrowserCustomEventConstructor,
    type BrowserGetComputedStyle,
    type BrowserMatchMedia,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserAbortController,
    getBrowserBoundMatchMedia,
    getBrowserClearTimeout,
    getBrowserComputedStyle,
    getBrowserCustomEvent,
    getBrowserDocument,
    getBrowserEventTarget,
    getBrowserLocalStorage,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type ThemeRuntimeTimer = BrowserTimerHandle;
type ThemeRuntimeStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

export interface ThemeRuntimeScope {
    readonly getAbortController?:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => BrowserClearTimeout | undefined)
        | undefined;
    readonly getComputedStyle?:
        | (() => BrowserGetComputedStyle | undefined)
        | undefined;
    readonly getCustomEvent?:
        | (() => BrowserCustomEventConstructor | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getBrowserEventTarget?:
        | (() => EventTarget | undefined)
        | undefined;
    readonly getLocalStorage?:
        | (() => ThemeRuntimeStorage | undefined)
        | undefined;
    readonly getMatchMedia?: (() => BrowserMatchMedia | undefined) | undefined;
    readonly getSetTimeout?: (() => BrowserSetTimeout | undefined) | undefined;
}

export interface ThemeRuntime {
    readonly addBodyClass: (className: string) => void;
    readonly clearTimeout: (timer: ThemeRuntimeTimer) => void;
    readonly createAbortController: () => AbortController;
    readonly createThemeChangeEvent: <T>(detail: T) => CustomEvent<T>;
    readonly ensureThemeTransitionStyles: (cssText: string) => void;
    readonly getBodyComputedStyleProperty: (name: string) => string;
    readonly getBodyElement: () => HTMLElement | null;
    readonly getDocumentEventTarget: () => EventTarget | null;
    readonly getBrowserEventTarget: () => EventTarget | null;
    readonly getStorageItem: (key: string) => string | null;
    readonly getSystemThemeMediaQuery: () => MediaQueryList | null;
    readonly setTimeout: (
        callback: () => void,
        delayMs: number
    ) => ThemeRuntimeTimer;
    readonly removeBodyClasses: (...classNames: string[]) => void;
    readonly removeStorageItem: (key: string) => void;
    readonly setStorageItem: (key: string, value: string) => void;
    readonly setThemeDataAttributes: (theme: string) => void;
    readonly updateMetaThemeColor: (themeColor: string) => void;
}

const defaultThemeRuntimeScope: ThemeRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getClearTimeout: getBrowserClearTimeout,
    getComputedStyle: getBrowserComputedStyle,
    getCustomEvent: getBrowserCustomEvent,
    getDocument: getBrowserDocument,
    getBrowserEventTarget,
    getLocalStorage: getBrowserLocalStorage,
    getMatchMedia: getBrowserBoundMatchMedia,
    getSetTimeout: getBrowserSetTimeout,
};

function getScopeAbortController(
    scope: ThemeRuntimeScope
): BrowserAbortControllerConstructor | undefined {
    return scope.getAbortController?.();
}

function getScopeClearTimeout(
    scope: ThemeRuntimeScope
): BrowserClearTimeout | undefined {
    return scope.getClearTimeout?.();
}

function getScopeComputedStyle(
    scope: ThemeRuntimeScope
): BrowserGetComputedStyle | undefined {
    return scope.getComputedStyle?.();
}

function getRequiredCustomEvent(
    scope: ThemeRuntimeScope
): BrowserCustomEventConstructor {
    const CustomEventConstructor = scope.getCustomEvent?.();
    if (typeof CustomEventConstructor !== "function") {
        throw new TypeError("theme core requires a CustomEvent runtime");
    }

    return CustomEventConstructor;
}

function getScopeDocument(scope: ThemeRuntimeScope): Document | undefined {
    return scope.getDocument?.();
}

function getRequiredDocument(scope: ThemeRuntimeScope): Document {
    const documentRef = getScopeDocument(scope);
    if (!documentRef) {
        throw new TypeError("theme core requires a document runtime");
    }

    return documentRef;
}

function getScopeBrowserEventTarget(
    scope: ThemeRuntimeScope
): EventTarget | undefined {
    return scope.getBrowserEventTarget?.();
}

function getRequiredLocalStorage(
    scope: ThemeRuntimeScope
): ThemeRuntimeStorage {
    const storage = scope.getLocalStorage?.();
    if (!storage) {
        throw new TypeError("theme core requires a localStorage runtime");
    }

    return storage;
}

function getScopeMatchMedia(
    scope: ThemeRuntimeScope
): BrowserMatchMedia | undefined {
    return scope.getMatchMedia?.();
}

function getScopeSetTimeout(
    scope: ThemeRuntimeScope
): BrowserSetTimeout | undefined {
    return scope.getSetTimeout?.();
}

function getScopeBodyElement(scope: ThemeRuntimeScope): HTMLElement | null {
    const body = getScopeDocument(scope)?.body;
    if (!body || typeof body.nodeType !== "number" || body.nodeType !== 1) {
        return null;
    }

    return body;
}

export function getThemeRuntime(
    scope: ThemeRuntimeScope = defaultThemeRuntimeScope
): ThemeRuntime {
    return {
        addBodyClass(className): void {
            getRequiredDocument(scope).body.classList.add(className);
        },
        clearTimeout(timer): void {
            const clearTimeoutRef = getScopeClearTimeout(scope);
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "theme core requires a clearTimeout runtime"
                );
            }

            clearTimeoutRef.call(scope, timer);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = getScopeAbortController(scope);
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "theme core requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        createThemeChangeEvent<T>(detail: T): CustomEvent<T> {
            return new (getRequiredCustomEvent(scope))("themechange", {
                bubbles: true,
                composed: true,
                detail,
            });
        },
        ensureThemeTransitionStyles(cssText): void {
            const documentRef = getRequiredDocument(scope);
            if (documentRef.querySelector("#theme-transition-styles")) {
                return;
            }

            const style = documentRef.createElement("style");
            style.id = "theme-transition-styles";
            style.textContent = cssText;
            documentRef.head.append(style);
        },
        getBodyComputedStyleProperty(name): string {
            const body = getScopeBodyElement(scope);
            const getComputedStyleRef = getScopeComputedStyle(scope);
            if (!body || typeof getComputedStyleRef !== "function") {
                return "";
            }

            return (
                getComputedStyleRef(body).getPropertyValue(`--${name}`) ?? ""
            ).trim();
        },
        getBodyElement(): HTMLElement | null {
            return getScopeBodyElement(scope);
        },
        getDocumentEventTarget(): EventTarget | null {
            return getScopeDocument(scope) ?? null;
        },
        getBrowserEventTarget(): EventTarget | null {
            return getScopeBrowserEventTarget(scope) ?? null;
        },
        getStorageItem(key): string | null {
            return getRequiredLocalStorage(scope).getItem(key);
        },
        getSystemThemeMediaQuery(): MediaQueryList | null {
            const matchMedia = getScopeMatchMedia(scope);
            if (typeof matchMedia === "function") {
                return matchMedia.call(scope, "(prefers-color-scheme: dark)");
            }

            return null;
        },
        setTimeout(callback, delayMs): ThemeRuntimeTimer {
            const setTimeoutRef = getScopeSetTimeout(scope);
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError("theme core requires a setTimeout runtime");
            }

            return setTimeoutRef.call(scope, callback, delayMs);
        },
        removeBodyClasses(...classNames): void {
            getRequiredDocument(scope).body.classList.remove(...classNames);
        },
        removeStorageItem(key): void {
            getRequiredLocalStorage(scope).removeItem(key);
        },
        setStorageItem(key, value): void {
            getRequiredLocalStorage(scope).setItem(key, value);
        },
        setThemeDataAttributes(theme): void {
            const documentRef = getRequiredDocument(scope);
            documentRef.body.dataset["theme"] = theme;
            documentRef.documentElement.dataset["theme"] = theme;
        },
        updateMetaThemeColor(themeColor): void {
            const documentRef = getRequiredDocument(scope);
            let metaThemeColor = documentRef.querySelector<HTMLMetaElement>(
                'meta[name="theme-color"]'
            );
            if (!metaThemeColor) {
                metaThemeColor = documentRef.createElement("meta");
                metaThemeColor.name = "theme-color";
                documentRef.head.append(metaThemeColor);
            }
            metaThemeColor.content = themeColor;
        },
    };
}
