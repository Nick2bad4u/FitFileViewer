import {
    type BrowserClearTimeout,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserClearTimeout,
    getBrowserDocument,
    getBrowserMutationObserver,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type TabButtonObserver = {
    disconnect?: () => void;
    observe?: (
        target: Readonly<Element>,
        options?: Readonly<MutationObserverInit>
    ) => void;
};

export type MutationObserverConstructorLike = new (
    callback: MutationCallback
) => TabButtonObserver;
type EnableTabButtonsRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface EnableTabButtonsRuntimeScope {
    readonly getClearTimeout: EnableTabButtonsRuntimeProvider<BrowserClearTimeout>;
    readonly getMutationObserver: EnableTabButtonsRuntimeProvider<MutationObserverConstructorLike>;
    readonly getSetTimeout: EnableTabButtonsRuntimeProvider<BrowserSetTimeout>;
    readonly isRendererScope: EnableTabButtonsRuntimeProvider<boolean>;
}

export interface EnableTabButtonsRuntime {
    readonly clearTimeout: (handle: BrowserTimerHandle) => void;
    readonly createMutationObserver: (
        callback: MutationCallback
    ) => TabButtonObserver | undefined;
    readonly isWindowAvailable: () => boolean;
    readonly setTimeout: (
        handler: () => void,
        timeout: number
    ) => BrowserTimerHandle;
}

const defaultEnableTabButtonsRuntimeScope: EnableTabButtonsRuntimeScope = {
    getClearTimeout: getBrowserClearTimeout,
    getMutationObserver: getBrowserMutationObserver,
    getSetTimeout: getBrowserSetTimeout,
    isRendererScope: () => getBrowserDocument() !== undefined,
};

function getRequiredProvider<T>(
    provider: EnableTabButtonsRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `enableTabButtons requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

function getMutationObserverConstructor(
    scope: EnableTabButtonsRuntimeScope
): MutationObserverConstructorLike | undefined {
    const candidate = getRequiredProvider(
        scope.getMutationObserver,
        "MutationObserver"
    )();

    return isMutationObserverConstructorLike(candidate) ? candidate : undefined;
}

function isMutationObserverConstructorLike(
    candidate: unknown
): candidate is MutationObserverConstructorLike {
    return typeof candidate === "function";
}

function getRequiredClearTimeout(
    scope: EnableTabButtonsRuntimeScope
): BrowserClearTimeout {
    const clearTimer = getRequiredProvider(
        scope.getClearTimeout,
        "clearTimeout"
    )();
    if (typeof clearTimer !== "function") {
        throw new TypeError("enableTabButtons requires a clearTimeout runtime");
    }

    return clearTimer;
}

function getRequiredSetTimeout(
    scope: EnableTabButtonsRuntimeScope
): BrowserSetTimeout {
    const scheduleTimer = getRequiredProvider(
        scope.getSetTimeout,
        "setTimeout"
    )();
    if (typeof scheduleTimer !== "function") {
        throw new TypeError("enableTabButtons requires a setTimeout runtime");
    }

    return scheduleTimer;
}

function isRendererScope(scope: EnableTabButtonsRuntimeScope): boolean {
    return (
        getRequiredProvider(scope.isRendererScope, "isRendererScope")() === true
    );
}

export function getEnableTabButtonsRuntime(
    scope: EnableTabButtonsRuntimeScope = defaultEnableTabButtonsRuntimeScope
): EnableTabButtonsRuntime {
    return {
        clearTimeout(handle: BrowserTimerHandle): void {
            const clearTimer = getRequiredClearTimeout(scope);
            clearTimer(handle);
        },
        createMutationObserver(
            callback: MutationCallback
        ): TabButtonObserver | undefined {
            const ObserverConstructor = getMutationObserverConstructor(scope);

            return ObserverConstructor
                ? new ObserverConstructor(callback)
                : undefined;
        },
        isWindowAvailable(): boolean {
            return isRendererScope(scope);
        },
        setTimeout(handler: () => void, timeout: number): BrowserTimerHandle {
            const scheduleTimer = getRequiredSetTimeout(scope);
            return scheduleTimer(handler, timeout);
        },
    };
}
