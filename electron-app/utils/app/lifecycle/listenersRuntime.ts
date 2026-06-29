import {
    type BrowserAbortControllerConstructor,
    type BrowserClearTimeout,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserAbortController,
    getBrowserClearTimeout,
    getBrowserDocument,
    getBrowserPrint,
    getBrowserSetTimeout,
    getBrowserURL,
} from "../../runtime/browserRuntime.js";
import {
    getProcessEnvironmentValue as getRuntimeProcessEnvironmentValue,
    isDevelopmentEnvironment as isRuntimeDevelopmentEnvironment,
} from "../../runtime/processEnvironment.js";
import { querySelectorByIdFlexible } from "../../ui/dom/elementIdUtils.js";

export type LifecycleListenersTimer = BrowserTimerHandle;

type LifecycleListenersDocument = Document;
type LifecycleListenersPrint = () => void;
type LifecycleListenersURL = Pick<
    typeof URL,
    "createObjectURL" | "revokeObjectURL"
>;
type LifecycleListenersRuntimeProvider<T> = (() => T | undefined) | undefined;

export interface LifecycleListenersRuntimeScope {
    readonly getAbortController: LifecycleListenersRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getClearTimeout: LifecycleListenersRuntimeProvider<BrowserClearTimeout>;
    readonly getDocument: LifecycleListenersRuntimeProvider<LifecycleListenersDocument>;
    readonly getIsDevelopmentEnvironment: LifecycleListenersRuntimeProvider<boolean>;
    readonly getPrint: LifecycleListenersRuntimeProvider<LifecycleListenersPrint>;
    readonly getProcessEnvironmentValue:
        | ((name: string) => string | undefined)
        | undefined;
    readonly getSetTimeout: LifecycleListenersRuntimeProvider<BrowserSetTimeout>;
    readonly getURL: LifecycleListenersRuntimeProvider<LifecycleListenersURL>;
}

export interface LifecycleListenersRuntime {
    readonly appendToBody: (element: HTMLElement) => void;
    readonly clearTimeout: (handle: LifecycleListenersTimer) => void;
    readonly createAbortController: () => AbortController;
    readonly createDownloadAnchor: () => HTMLAnchorElement;
    readonly createObjectURL: (blob: Blob) => string;
    readonly getProcessEnvironmentValue: (
        name: string
    ) => string | undefined;
    readonly getSummaryContainer: () => HTMLElement | null;
    readonly isDevelopmentEnvironment: () => boolean;
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

const defaultLifecycleListenersRuntimeScope: LifecycleListenersRuntimeScope = {
    getAbortController: getBrowserAbortController,
    getClearTimeout: getBrowserClearTimeout,
    getDocument: getBrowserDocument,
    getIsDevelopmentEnvironment: isRuntimeDevelopmentEnvironment,
    getPrint: getBrowserPrint,
    getProcessEnvironmentValue: getRuntimeProcessEnvironmentValue,
    getSetTimeout: getBrowserSetTimeout,
    getURL: getBrowserURL,
};

function getRequiredProvider<T>(
    provider: LifecycleListenersRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `lifecycle listeners require ${providerName} provider`
        );
    }

    return provider;
}

function getRequiredEnvironmentProvider(
    provider: LifecycleListenersRuntimeScope["getProcessEnvironmentValue"]
): (name: string) => string | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            "lifecycle listeners require processEnvironmentValue provider"
        );
    }

    return provider;
}

function getRequiredDocument(
    scope: LifecycleListenersRuntimeScope
): LifecycleListenersDocument {
    const documentRef = getRequiredProvider(scope.getDocument, "document")();
    if (!documentRef) {
        throw new TypeError("lifecycle listeners require a document runtime");
    }

    return documentRef;
}

function getRequiredURL(
    scope: LifecycleListenersRuntimeScope
): LifecycleListenersURL {
    const URLRef = getRequiredProvider(scope.getURL, "URL")();
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
            const clearTimeoutRef = getRequiredProvider(
                scope.getClearTimeout,
                "clearTimeout"
            )();
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "lifecycle listeners require a clearTimeout runtime"
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
        getProcessEnvironmentValue(name): string | undefined {
            return getRequiredEnvironmentProvider(
                scope.getProcessEnvironmentValue
            )(name);
        },
        getSummaryContainer(): HTMLElement | null {
            return querySelectorByIdFlexible(
                getRequiredDocument(scope),
                "#content_summary"
            );
        },
        isDevelopmentEnvironment(): boolean {
            return (
                getRequiredProvider(
                    scope.getIsDevelopmentEnvironment,
                    "isDevelopmentEnvironment"
                )() === true
            );
        },
        isTestEnvironment(): boolean {
            return (
                getRequiredEnvironmentProvider(
                    scope.getProcessEnvironmentValue
                )("NODE_ENV") === "test"
            );
        },
        print(): void {
            const printRef = getRequiredProvider(scope.getPrint, "print")();
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
            const setTimeoutRef = getRequiredProvider(
                scope.getSetTimeout,
                "setTimeout"
            )();
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "lifecycle listeners require a setTimeout runtime"
                );
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}
