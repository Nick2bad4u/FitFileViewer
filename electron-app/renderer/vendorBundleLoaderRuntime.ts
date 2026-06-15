export type RendererVendorBundleLoaderTimerHandle = ReturnType<
    typeof globalThis.setTimeout
>;

export interface RendererVendorBundleLoaderRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly addEventListener?: typeof globalThis.addEventListener | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly document?: Document | undefined;
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getAddEventListener?:
        | (() => typeof globalThis.addEventListener | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getDocument?: (() => Document | undefined) | undefined;
    readonly getHTMLScriptElement?:
        | (() => typeof HTMLScriptElement | undefined)
        | undefined;
    readonly getRemoveEventListener?:
        | (() => typeof globalThis.removeEventListener | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
    readonly HTMLScriptElement?: typeof HTMLScriptElement | undefined;
    readonly now?: (() => number) | undefined;
    readonly removeEventListener?:
        | typeof globalThis.removeEventListener
        | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
}

export interface RendererVendorBundleLoaderRuntime {
    addEventListener(
        type: string,
        listener: EventListener,
        options?: AddEventListenerOptions
    ): void;
    clearTimeout(handle: RendererVendorBundleLoaderTimerHandle): void;
    createAbortController(): AbortController;
    createVendorScript(entryName: string, src: string): HTMLScriptElement;
    getExistingVendorScript(entryName: string): HTMLScriptElement | null;
    appendVendorScript(script: HTMLScriptElement): void;
    addScriptEventListener(
        script: HTMLScriptElement,
        type: "error" | "load",
        listener: EventListener,
        options?: AddEventListenerOptions
    ): void;
    now(): number;
    removeEventListener(type: string, listener: EventListener): void;
    setTimeout(
        callback: () => void,
        delay: number
    ): RendererVendorBundleLoaderTimerHandle;
}

const defaultRendererVendorBundleLoaderRuntimeScope: RendererVendorBundleLoaderRuntimeScope =
    {
        getAbortController: () => globalThis.AbortController,
        getAddEventListener: () => globalThis.addEventListener.bind(globalThis),
        getClearTimeout: () => globalThis.clearTimeout.bind(globalThis),
        getDocument: () => globalThis.document,
        getHTMLScriptElement: () => globalThis.HTMLScriptElement,
        now: Date.now,
        getRemoveEventListener: () =>
            globalThis.removeEventListener.bind(globalThis),
        getSetTimeout: () => globalThis.setTimeout.bind(globalThis),
    };

function addEventListenerForScope(
    scope: RendererVendorBundleLoaderRuntimeScope,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions
): void {
    const addEventListener = scope.getAddEventListener?.();
    if (typeof addEventListener === "function") {
        // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- Vendor loader callers pair readiness listeners with caller-owned AbortSignal and removeEventListener cleanup.
        addEventListener(type, listener, options);
        return;
    }

    // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- Vendor loader callers pair readiness listeners with caller-owned AbortSignal and removeEventListener cleanup.
    scope.addEventListener?.(type, listener, options);
}

function getDocument(scope: RendererVendorBundleLoaderRuntimeScope): Document {
    const documentTarget = scope.getDocument?.() ?? scope.document;
    if (!documentTarget) {
        throw new TypeError("renderer vendor loader requires a document");
    }

    return documentTarget;
}

function getScriptConstructor(
    scope: RendererVendorBundleLoaderRuntimeScope
): typeof HTMLScriptElement | undefined {
    return (
        scope.getHTMLScriptElement?.() ??
        scope.HTMLScriptElement ??
        getScopeDocument(scope)?.defaultView?.HTMLScriptElement
    );
}

function getScopeAbortController(
    scope: RendererVendorBundleLoaderRuntimeScope
): typeof AbortController | undefined {
    return scope.getAbortController?.() ?? scope.AbortController;
}

function getScopeDocument(
    scope: RendererVendorBundleLoaderRuntimeScope
): Document | undefined {
    return scope.getDocument?.() ?? scope.document;
}

function isScriptElement(
    value: unknown,
    scope: RendererVendorBundleLoaderRuntimeScope
): value is HTMLScriptElement {
    const ScriptConstructor = getScriptConstructor(scope);
    return (
        typeof ScriptConstructor === "function" &&
        value instanceof ScriptConstructor
    );
}

function getRequiredClearTimeout(
    scope: RendererVendorBundleLoaderRuntimeScope
): typeof globalThis.clearTimeout {
    const clearTimeoutRef = scope.getClearTimeout?.() ?? scope.clearTimeout;
    if (typeof clearTimeoutRef !== "function") {
        throw new TypeError(
            "renderer vendor loader requires a clearTimeout runtime"
        );
    }

    return clearTimeoutRef;
}

function getRequiredNow(
    scope: RendererVendorBundleLoaderRuntimeScope
): () => number {
    const nowRef = scope.now;
    if (typeof nowRef !== "function") {
        throw new TypeError("renderer vendor loader requires a clock runtime");
    }

    return nowRef;
}

function getRequiredSetTimeout(
    scope: RendererVendorBundleLoaderRuntimeScope
): typeof globalThis.setTimeout {
    const setTimeoutRef = scope.getSetTimeout?.() ?? scope.setTimeout;
    if (typeof setTimeoutRef !== "function") {
        throw new TypeError(
            "renderer vendor loader requires a setTimeout runtime"
        );
    }

    return setTimeoutRef;
}

export function getRendererVendorBundleLoaderRuntime(
    scope: RendererVendorBundleLoaderRuntimeScope = defaultRendererVendorBundleLoaderRuntimeScope
): RendererVendorBundleLoaderRuntime {
    return {
        addEventListener(
            type: string,
            listener: EventListener,
            options?: AddEventListenerOptions
        ): void {
            addEventListenerForScope(scope, type, listener, options);
        },
        clearTimeout(handle: RendererVendorBundleLoaderTimerHandle): void {
            const clearTimeoutRef = getRequiredClearTimeout(scope);
            clearTimeoutRef(handle);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = getScopeAbortController(scope);
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "renderer vendor loader requires an AbortController"
                );
            }

            return new AbortControllerConstructor();
        },
        createVendorScript(entryName, src): HTMLScriptElement {
            const documentTarget = getDocument(scope);
            const script = documentTarget.createElement("script");
            script.dataset["ffvRendererVendorEntry"] = entryName;
            script.defer = true;
            script.src = src;
            script.type = "module";
            return script;
        },
        getExistingVendorScript(entryName): HTMLScriptElement | null {
            const documentTarget = getDocument(scope);
            const selector = `script[data-ffv-renderer-vendor-entry="${entryName}"]`;
            const existing = documentTarget.querySelector(selector);
            return isScriptElement(existing, scope) ? existing : null;
        },
        appendVendorScript(script): void {
            const documentTarget = getDocument(scope);
            if (!documentTarget.head) {
                throw new TypeError(
                    "renderer vendor loader requires a document head"
                );
            }

            documentTarget.head.append(script);
        },
        addScriptEventListener(
            script,
            type,
            listener,
            options?: AddEventListenerOptions
        ): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- Vendor script load/error listeners are paired with an AbortSignal owned by the caller.
            script.addEventListener(type, listener, options);
        },
        now(): number {
            const nowRef = getRequiredNow(scope);
            return nowRef();
        },
        removeEventListener(type: string, listener: EventListener): void {
            const removeEventListener = scope.getRemoveEventListener?.();
            if (typeof removeEventListener === "function") {
                removeEventListener(type, listener);
                return;
            }

            scope.removeEventListener?.(type, listener);
        },
        setTimeout(
            callback: () => void,
            delay: number
        ): RendererVendorBundleLoaderTimerHandle {
            const setTimeoutRef = getRequiredSetTimeout(scope);
            return setTimeoutRef(callback, delay);
        },
    };
}
