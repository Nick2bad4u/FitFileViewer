export type RendererVendorBundleLoaderTimerHandle =
    ReturnType<typeof globalThis.setTimeout>;

export interface RendererVendorBundleLoaderRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly addEventListener?: typeof globalThis.addEventListener | undefined;
    readonly clearTimeout?: typeof globalThis.clearTimeout | undefined;
    readonly document?: Document | undefined;
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

function getDocument(
    scope: RendererVendorBundleLoaderRuntimeScope
): Document {
    const documentTarget = scope.document;
    if (!documentTarget) {
        throw new TypeError("renderer vendor loader requires a document");
    }

    return documentTarget;
}

function getScriptConstructor(
    scope: RendererVendorBundleLoaderRuntimeScope
): typeof HTMLScriptElement | undefined {
    return (
        scope.HTMLScriptElement ??
        scope.document?.defaultView?.HTMLScriptElement
    );
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

export function getRendererVendorBundleLoaderRuntime(
    scope: RendererVendorBundleLoaderRuntimeScope = globalThis
): RendererVendorBundleLoaderRuntime {
    return {
        addEventListener(
            type: string,
            listener: EventListener,
            options?: AddEventListenerOptions
        ): void {
            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- Vendor loader callers pair readiness listeners with caller-owned AbortSignal and removeEventListener cleanup.
            scope.addEventListener?.(type, listener, options);
        },
        clearTimeout(handle: RendererVendorBundleLoaderTimerHandle): void {
            const clearTimeoutRef = scope.clearTimeout ?? globalThis.clearTimeout;
            clearTimeoutRef(handle);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
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
            return scope.now?.() ?? Date.now();
        },
        removeEventListener(type: string, listener: EventListener): void {
            scope.removeEventListener?.(type, listener);
        },
        setTimeout(
            callback: () => void,
            delay: number
        ): RendererVendorBundleLoaderTimerHandle {
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, delay);
        },
    };
}
