export type LifecycleListenersTimer = ReturnType<typeof globalThis.setTimeout>;

type LifecycleListenersPrint = () => void;

interface LifecycleListenersProcess {
    readonly env?: Readonly<Record<string, string | undefined>>;
}

export interface LifecycleListenersRuntimeScope {
    readonly getAbortController?:
        | (() => typeof globalThis.AbortController | undefined)
        | undefined;
    readonly getClearTimeout?:
        | (() => typeof globalThis.clearTimeout | undefined)
        | undefined;
    readonly getPrint?: (() => LifecycleListenersPrint | undefined) | undefined;
    readonly getProcess?:
        | (() => LifecycleListenersProcess | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
}

export interface LifecycleListenersRuntime {
    readonly clearTimeout: (handle: LifecycleListenersTimer) => void;
    readonly createAbortController: () => AbortController;
    readonly isTestEnvironment: () => boolean;
    readonly print: () => void;
    readonly setTimeout: (
        callback: () => void,
        delayMs: number
    ) => LifecycleListenersTimer;
}

function getGlobalProcess(): LifecycleListenersProcess | undefined {
    const processRef: unknown = Reflect.get(globalThis, "process");
    return typeof processRef === "object" && processRef !== null
        ? processRef
        : undefined;
}

function getGlobalPrint(): LifecycleListenersPrint | undefined {
    const printRef = Reflect.get(globalThis, "print");
    return typeof printRef === "function"
        ? () => {
              printRef.call(globalThis);
          }
        : undefined;
}

const defaultLifecycleListenersRuntimeScope: LifecycleListenersRuntimeScope = {
    getAbortController: () => globalThis.AbortController,
    getClearTimeout: () => globalThis.clearTimeout,
    getPrint: getGlobalPrint,
    getProcess: getGlobalProcess,
    getSetTimeout: () => globalThis.setTimeout,
};

export function getLifecycleListenersRuntime(
    scope: LifecycleListenersRuntimeScope = defaultLifecycleListenersRuntimeScope
): LifecycleListenersRuntime {
    return {
        clearTimeout(handle): void {
            const clearTimeoutRef = scope.getClearTimeout?.();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "lifecycle listeners require a clearTimeout runtime"
                );
            }

            clearTimeoutRef(handle);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.getAbortController?.();
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "lifecycle listeners require an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        isTestEnvironment(): boolean {
            return scope.getProcess?.()?.env?.["NODE_ENV"] === "test";
        },
        print(): void {
            const printRef = scope.getPrint?.();
            if (typeof printRef !== "function") {
                throw new TypeError(
                    "lifecycle listeners require a print runtime"
                );
            }

            printRef();
        },
        setTimeout(callback, delayMs): LifecycleListenersTimer {
            const setTimeoutRef = scope.getSetTimeout?.();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "lifecycle listeners require a setTimeout runtime"
                );
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}
