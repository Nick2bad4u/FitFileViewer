import {
    getBrowserAbortController,
    getBrowserClearTimeout,
    getBrowserComputedStyle,
    getBrowserCustomEvent,
    getBrowserDocument,
    getBrowserMatchMedia,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type ThemeRuntimeTimer = ReturnType<typeof globalThis.setTimeout>;

export interface ThemeRuntimeScope {
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getComputedStyle?:
        | (() => typeof globalThis.getComputedStyle | undefined)
        | undefined;
    readonly getCustomEvent?:
        | (() => typeof globalThis.CustomEvent | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getGlobalEventTarget?: (() => EventTarget | undefined) | undefined;
    readonly getMatchMedia?:
        | (() => typeof globalThis.matchMedia | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
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
    readonly getGlobalEventTarget: () => EventTarget | null;
    readonly getSystemThemeMediaQuery: () => MediaQueryList | null;
    readonly setTimeout: (
        callback: () => void,
        delayMs: number
    ) => ThemeRuntimeTimer;
    readonly removeBodyClasses: (...classNames: string[]) => void;
    readonly setThemeDataAttributes: (theme: string) => void;
    readonly updateMetaThemeColor: (themeColor: string) => void;
}

function isEventTarget(candidate: unknown): candidate is EventTarget {
    return (
        candidate !== null &&
        typeof candidate === "object" &&
        "addEventListener" in candidate &&
        typeof candidate.addEventListener === "function" &&
        "removeEventListener" in candidate &&
        typeof candidate.removeEventListener === "function"
    );
}

function getDefaultEventTarget(): EventTarget | undefined {
    return isEventTarget(globalThis) ? globalThis : undefined;
}

const defaultThemeRuntimeScope: ThemeRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getClearTimeout: getBrowserClearTimeout,
    getComputedStyle: getBrowserComputedStyle,
    getCustomEvent: getBrowserCustomEvent,
    getDocument: getBrowserDocument,
    getGlobalEventTarget: getDefaultEventTarget,
    getMatchMedia: () => getBrowserMatchMedia()?.bind(globalThis),
    getSetTimeout: getBrowserSetTimeout,
};

function getScopeAbortController(
    scope: ThemeRuntimeScope
): typeof globalThis.AbortController | undefined {
    return scope.getAbortController?.();
}

function getScopeClearTimeout(
    scope: ThemeRuntimeScope
): typeof globalThis.clearTimeout | undefined {
    return scope.getClearTimeout?.();
}

function getScopeComputedStyle(
    scope: ThemeRuntimeScope
): typeof globalThis.getComputedStyle | undefined {
    return scope.getComputedStyle?.();
}

function getRequiredCustomEvent(
    scope: ThemeRuntimeScope
): typeof globalThis.CustomEvent {
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

function getScopeGlobalEventTarget(
    scope: ThemeRuntimeScope
): EventTarget | undefined {
    return scope.getGlobalEventTarget?.();
}

function getScopeMatchMedia(
    scope: ThemeRuntimeScope
): typeof globalThis.matchMedia | undefined {
    return scope.getMatchMedia?.();
}

function getScopeSetTimeout(
    scope: ThemeRuntimeScope
): typeof globalThis.setTimeout | undefined {
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
        getGlobalEventTarget(): EventTarget | null {
            return getScopeGlobalEventTarget(scope) ?? null;
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
