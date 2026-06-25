import {
    getBrowserClearTimeout,
    getBrowserDocument,
    getBrowserMutationObserver,
    getBrowserSetTimeout,
} from "../../runtime/browserRuntime.js";

export type TabButtonObserver = {
    observe?: (
        target: Readonly<Element>,
        options?: Readonly<MutationObserverInit>
    ) => void;
};

export type MutationObserverConstructorLike = new (
    callback: MutationCallback
) => TabButtonObserver;

export interface EnableTabButtonsRuntimeScope {
    readonly getClearTimeout?:
        | (() => typeof clearTimeout | undefined)
        | undefined;
    readonly getMutationObserver?:
        | (() => MutationObserverConstructorLike | undefined)
        | undefined;
    readonly getSetTimeout?: (() => typeof setTimeout | undefined) | undefined;
    readonly isRendererScope?: (() => boolean) | undefined;
}

export interface EnableTabButtonsRuntime {
    readonly clearTimeout: (handle: ReturnType<typeof setTimeout>) => void;
    readonly createMutationObserver: (
        callback: MutationCallback
    ) => TabButtonObserver | undefined;
    readonly isWindowAvailable: () => boolean;
    readonly setTimeout: (
        handler: () => void,
        timeout: number
    ) => ReturnType<typeof setTimeout>;
}

const defaultEnableTabButtonsRuntimeScope: EnableTabButtonsRuntimeScope = {
    getClearTimeout: getBrowserClearTimeout,
    getMutationObserver: getBrowserMutationObserver,
    getSetTimeout: getBrowserSetTimeout,
    isRendererScope: () => getBrowserDocument() !== undefined,
};

function getMutationObserverConstructor(
    scope: EnableTabButtonsRuntimeScope
): MutationObserverConstructorLike | undefined {
    const candidate = scope.getMutationObserver?.();

    return isMutationObserverConstructorLike(candidate) ? candidate : undefined;
}

function isMutationObserverConstructorLike(
    candidate: unknown
): candidate is MutationObserverConstructorLike {
    return typeof candidate === "function";
}

function getRequiredClearTimeout(
    scope: EnableTabButtonsRuntimeScope
): typeof clearTimeout {
    const clearTimer = scope.getClearTimeout?.();
    if (typeof clearTimer !== "function") {
        throw new TypeError("enableTabButtons requires a clearTimeout runtime");
    }

    return clearTimer;
}

function getRequiredSetTimeout(
    scope: EnableTabButtonsRuntimeScope
): typeof setTimeout {
    const scheduleTimer = scope.getSetTimeout?.();
    if (typeof scheduleTimer !== "function") {
        throw new TypeError("enableTabButtons requires a setTimeout runtime");
    }

    return scheduleTimer;
}

function isRendererScope(scope: EnableTabButtonsRuntimeScope): boolean {
    return scope.isRendererScope?.() === true;
}

export function getEnableTabButtonsRuntime(
    scope: EnableTabButtonsRuntimeScope = defaultEnableTabButtonsRuntimeScope
): EnableTabButtonsRuntime {
    return {
        clearTimeout(handle: ReturnType<typeof setTimeout>): void {
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
        setTimeout(
            handler: () => void,
            timeout: number
        ): ReturnType<typeof setTimeout> {
            const scheduleTimer = getRequiredSetTimeout(scope);
            return scheduleTimer(handler, timeout);
        },
    };
}
