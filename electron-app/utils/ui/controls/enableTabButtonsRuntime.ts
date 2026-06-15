export type TabButtonObserver = {
    observe?: (target: Element, options?: MutationObserverInit) => void;
};

export type MutationObserverConstructorLike = new (
    callback: MutationCallback
) => TabButtonObserver;

export interface EnableTabButtonsRuntimeWindow {
    readonly MutationObserver?: MutationObserverConstructorLike | undefined;
}

export interface EnableTabButtonsRuntimeScope {
    readonly MutationObserver?: MutationObserverConstructorLike | undefined;
    readonly clearTimeout?: typeof clearTimeout | undefined;
    readonly setTimeout?: typeof setTimeout | undefined;
    readonly window?: EnableTabButtonsRuntimeWindow | undefined;
}

export interface EnableTabButtonsRuntime {
    clearTimeout: (handle: ReturnType<typeof setTimeout>) => void;
    createCompatibilityMutationObserver: (
        callback: MutationCallback
    ) => TabButtonObserver | undefined;
    createMutationObserver: (
        callback: MutationCallback
    ) => TabButtonObserver | undefined;
    isWindowAvailable: () => boolean;
    setTimeout: (
        handler: () => void,
        timeout: number
    ) => ReturnType<typeof setTimeout>;
}

function getGlobalMutationObserverConstructor(
    scope: EnableTabButtonsRuntimeScope
): MutationObserverConstructorLike | undefined {
    const candidate = scope.MutationObserver;

    return isMutationObserverConstructorLike(candidate) ? candidate : undefined;
}

function getWindowMutationObserverConstructor(
    scope: EnableTabButtonsRuntimeScope
): MutationObserverConstructorLike | undefined {
    const candidate = scope.window?.MutationObserver;

    return isMutationObserverConstructorLike(candidate) ? candidate : undefined;
}

function resolveMutationObserverConstructor(
    scope: EnableTabButtonsRuntimeScope
): MutationObserverConstructorLike | undefined {
    const globalConstructor = getGlobalMutationObserverConstructor(scope);
    const windowConstructor = getWindowMutationObserverConstructor(scope);

    if (globalConstructor && windowConstructor) {
        return globalConstructor === windowConstructor
            ? windowConstructor
            : globalConstructor;
    }

    return windowConstructor ?? globalConstructor;
}

function isMutationObserverConstructorLike(
    candidate: unknown
): candidate is MutationObserverConstructorLike {
    return typeof candidate === "function";
}

function getRequiredClearTimeout(
    scope: EnableTabButtonsRuntimeScope
): typeof clearTimeout {
    const clearTimer = scope.clearTimeout;
    if (typeof clearTimer !== "function") {
        throw new TypeError("enableTabButtons requires a clearTimeout runtime");
    }

    return clearTimer;
}

function getRequiredSetTimeout(
    scope: EnableTabButtonsRuntimeScope
): typeof setTimeout {
    const scheduleTimer = scope.setTimeout;
    if (typeof scheduleTimer !== "function") {
        throw new TypeError("enableTabButtons requires a setTimeout runtime");
    }

    return scheduleTimer;
}

const defaultEnableTabButtonsRuntimeScope: EnableTabButtonsRuntimeScope =
    globalThis;

export function getEnableTabButtonsRuntime(
    scope: EnableTabButtonsRuntimeScope = defaultEnableTabButtonsRuntimeScope
): EnableTabButtonsRuntime {
    return {
        clearTimeout(handle: ReturnType<typeof setTimeout>): void {
            const clearTimer = getRequiredClearTimeout(scope);
            clearTimer(handle);
        },
        createCompatibilityMutationObserver(
            callback: MutationCallback
        ): TabButtonObserver | undefined {
            const globalConstructor =
                getGlobalMutationObserverConstructor(scope);
            const windowConstructor =
                getWindowMutationObserverConstructor(scope);

            if (
                !globalConstructor ||
                !windowConstructor ||
                globalConstructor === windowConstructor
            ) {
                return undefined;
            }

            try {
                return new windowConstructor(callback);
            } catch {
                return undefined;
            }
        },
        createMutationObserver(
            callback: MutationCallback
        ): TabButtonObserver | undefined {
            const ObserverConstructor =
                resolveMutationObserverConstructor(scope);

            return ObserverConstructor
                ? new ObserverConstructor(callback)
                : undefined;
        },
        isWindowAvailable(): boolean {
            return scope.window !== undefined;
        },
        setTimeout(
            handler: () => void,
            timeout: number
        ): ReturnType<typeof setTimeout> {
            const scheduleTimer = getRequiredSetTimeout(scope);
            return scheduleTimer(handler, timeout);
        },
    };
}
