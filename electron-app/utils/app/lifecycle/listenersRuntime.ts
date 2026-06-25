import { getBrowserAbortController } from "../../runtime/browserRuntime.js";

export type LifecycleListenersTimer = ReturnType<typeof globalThis.setTimeout>;

type LifecycleListenersDocument = Pick<Document, "body" | "createElement">;
type LifecycleListenersPrint = () => void;
type LifecycleListenersURL = Pick<
    typeof URL,
    "createObjectURL" | "revokeObjectURL"
>;

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
    readonly getDocument?:
        | (() => LifecycleListenersDocument | undefined)
        | undefined;
    readonly getPrint?: (() => LifecycleListenersPrint | undefined) | undefined;
    readonly getProcess?:
        | (() => LifecycleListenersProcess | undefined)
        | undefined;
    readonly getSetTimeout?:
        | (() => typeof globalThis.setTimeout | undefined)
        | undefined;
    readonly getURL?: (() => LifecycleListenersURL | undefined) | undefined;
}

export interface LifecycleListenersRuntime {
    readonly appendToBody: (element: HTMLElement) => void;
    readonly clearTimeout: (handle: LifecycleListenersTimer) => void;
    readonly createAbortController: () => AbortController;
    readonly createDownloadAnchor: () => HTMLAnchorElement;
    readonly createObjectURL: (blob: Blob) => string;
    readonly isTestEnvironment: () => boolean;
    readonly print: () => void;
    readonly revokeObjectURL: (url: string) => void;
    readonly replaceBodyClasses: (
        classesToRemove: readonly string[],
        classToAdd?: string
    ) => void;
    readonly setTimeout: (
        callback: () => void,
        delayMs: number
    ) => LifecycleListenersTimer;
}

function getGlobalProcess(): LifecycleListenersProcess | undefined {
    const processRef: unknown = globalThis.process;
    return typeof processRef === "object" && processRef !== null
        ? processRef
        : undefined;
}

function getGlobalPrint(): LifecycleListenersPrint | undefined {
    const printRef = globalThis.print;
    return typeof printRef === "function"
        ? () => {
              printRef.call(globalThis);
          }
        : undefined;
}

const defaultLifecycleListenersRuntimeScope: LifecycleListenersRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getClearTimeout: () => globalThis.clearTimeout,
    getDocument: () => globalThis.document,
    getPrint: getGlobalPrint,
    getProcess: getGlobalProcess,
    getSetTimeout: () => globalThis.setTimeout,
    getURL: () => globalThis.URL,
};

function getRequiredDocument(
    scope: LifecycleListenersRuntimeScope
): LifecycleListenersDocument {
    const documentRef = scope.getDocument?.();
    if (!documentRef) {
        throw new TypeError("lifecycle listeners require a document runtime");
    }

    return documentRef;
}

function getRequiredURL(
    scope: LifecycleListenersRuntimeScope
): LifecycleListenersURL {
    const URLRef = scope.getURL?.();
    if (
        typeof URLRef?.createObjectURL !== "function" ||
        typeof URLRef.revokeObjectURL !== "function"
    ) {
        throw new TypeError("lifecycle listeners require a URL runtime");
    }

    return URLRef;
}

export function getLifecycleListenersRuntime(
    scope: LifecycleListenersRuntimeScope = defaultLifecycleListenersRuntimeScope
): LifecycleListenersRuntime {
    return {
        appendToBody(element): void {
            getRequiredDocument(scope).body.append(element);
        },
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
        createDownloadAnchor(): HTMLAnchorElement {
            return getRequiredDocument(scope).createElement("a");
        },
        createObjectURL(blob): string {
            return getRequiredURL(scope).createObjectURL(blob);
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
        revokeObjectURL(url): void {
            getRequiredURL(scope).revokeObjectURL(url);
        },
        replaceBodyClasses(classesToRemove, classToAdd): void {
            const { classList } = getRequiredDocument(scope).body;
            classList.remove(...classesToRemove);
            if (classToAdd) {
                classList.add(classToAdd);
            }
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
