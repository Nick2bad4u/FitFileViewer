import {
    type BrowserAbortControllerConstructor,
    type BrowserClearTimeout,
    type BrowserNodeConstructor,
    type BrowserSetTimeout,
    type BrowserTimerHandle,
    getBrowserAbortController,
    getBrowserClearTimeout,
    getBrowserDateNow,
    getBrowserDocument,
    getBrowserNode,
    getBrowserSetTimeout,
    getBrowserViewport,
} from "../../runtime/browserRuntime.js";
import {
    getProcessEnvironmentValue as getRuntimeProcessEnvironmentValue,
    isDevelopmentEnvironment as isRuntimeDevelopmentEnvironment,
} from "../../runtime/processEnvironment.js";

type RecentFilesContextMenuRuntimeProvider<T> =
    | (() => T | undefined)
    | undefined;

export interface RecentFilesContextMenuRuntimeScope {
    readonly getAbortController: RecentFilesContextMenuRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getClearTimeout: RecentFilesContextMenuRuntimeProvider<BrowserClearTimeout>;
    readonly getDateNow: RecentFilesContextMenuRuntimeProvider<() => number>;
    readonly getDocument: RecentFilesContextMenuRuntimeProvider<Document>;
    readonly getDocumentEventTarget: RecentFilesContextMenuRuntimeProvider<Document>;
    readonly getIsDevelopmentEnvironment: RecentFilesContextMenuRuntimeProvider<boolean>;
    readonly getNode: RecentFilesContextMenuRuntimeProvider<BrowserNodeConstructor>;
    readonly getProcessEnvironmentValue:
        | ((name: string) => string | undefined)
        | undefined;
    readonly getSetTimeout: RecentFilesContextMenuRuntimeProvider<BrowserSetTimeout>;
    readonly getViewport: RecentFilesContextMenuRuntimeProvider<RecentFilesContextMenuViewportSource>;
}

export type RecentFilesContextMenuTimer = BrowserTimerHandle;

export interface RecentFilesContextMenuViewport {
    readonly height: number;
    readonly width: number;
}

export interface RecentFilesContextMenuViewportSource {
    readonly height?: number | undefined;
    readonly width?: number | undefined;
}

export interface RecentFilesContextMenuBodyDebugInfo {
    readonly canAppend: boolean;
    readonly childElementCount: number;
    readonly childNodeCount: number;
    readonly constructorName: string;
    readonly present: boolean;
}

type RecentFilesContextMenuMousedownListener = (
    event: Readonly<MouseEvent>
) => void;

export interface RecentFilesContextMenuRuntime {
    addDocumentMousedownListener: (
        listener: RecentFilesContextMenuMousedownListener,
        options: Readonly<AddEventListenerOptions>
    ) => void;
    appendToBody: (element: Element) => void;
    bodyContains: (element: Element) => boolean;
    clearTimeout: (handle: RecentFilesContextMenuTimer) => void;
    createAbortController: () => AbortController;
    createMenuElement: () => HTMLDivElement;
    dateNow: () => number;
    findRecentFilesMenu: () => Element | null;
    getBodyDebugInfo: () => RecentFilesContextMenuBodyDebugInfo;
    getProcessEnvironmentValue: (name: string) => string | undefined;
    getViewport: () => RecentFilesContextMenuViewport;
    hasRecentFilesMenu: () => boolean;
    insertBeforeBodyFirstChild: (element: Element) => void;
    isBodyParent: (element: Element) => boolean;
    isDevelopmentEnvironment: () => boolean;
    isNode: (value: unknown) => value is Node;
    setTimeout: (
        callback: () => void,
        delayMs: number
    ) => RecentFilesContextMenuTimer;
}

function normalizeDimension(value: unknown): number {
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

const defaultRecentFilesContextMenuRuntimeScope: RecentFilesContextMenuRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
        getClearTimeout: getBrowserClearTimeout,
        getDateNow: getBrowserDateNow,
        getDocument: getBrowserDocument,
        getDocumentEventTarget: () => undefined,
        getIsDevelopmentEnvironment: isRuntimeDevelopmentEnvironment,
        getNode: getBrowserNode,
        getProcessEnvironmentValue: getRuntimeProcessEnvironmentValue,
        getSetTimeout: getBrowserSetTimeout,
        getViewport: getBrowserViewport,
    };

function getRequiredProvider<T>(
    provider: RecentFilesContextMenuRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            `recent files context menu requires ${providerName} provider`
        );
    }

    return provider;
}

function getRequiredProcessEnvironmentProvider(
    provider: RecentFilesContextMenuRuntimeScope["getProcessEnvironmentValue"]
): (name: string) => string | undefined {
    if (typeof provider !== "function") {
        throw new TypeError(
            "recent files context menu requires processEnvironmentValue provider"
        );
    }

    return provider;
}

function getAbortController(
    scope: RecentFilesContextMenuRuntimeScope
): BrowserAbortControllerConstructor | undefined {
    return getRequiredProvider(scope.getAbortController, "AbortController")();
}

function getClearTimeout(
    scope: RecentFilesContextMenuRuntimeScope
): BrowserClearTimeout | undefined {
    return getRequiredProvider(scope.getClearTimeout, "clearTimeout")();
}

function getRequiredDateNow(
    scope: RecentFilesContextMenuRuntimeScope
): () => number {
    const dateNow = getRequiredProvider(scope.getDateNow, "dateNow")();
    if (typeof dateNow !== "function") {
        throw new TypeError(
            "recent files context menu requires a dateNow runtime"
        );
    }

    return dateNow;
}

function getDocumentEventTarget(
    scope: RecentFilesContextMenuRuntimeScope
): Document | undefined {
    return (
        getRequiredProvider(
            scope.getDocumentEventTarget,
            "document event-target"
        )() ?? getRequiredProvider(scope.getDocument, "document")()
    );
}

function getNodeConstructor(
    scope: RecentFilesContextMenuRuntimeScope
): BrowserNodeConstructor {
    const NodeConstructor = getRequiredProvider(scope.getNode, "Node")();
    if (typeof NodeConstructor !== "function") {
        throw new TypeError(
            "recent files context menu requires a Node runtime"
        );
    }

    return NodeConstructor;
}

function getRuntimeDocument(
    scope: RecentFilesContextMenuRuntimeScope
): Document {
    const documentRef = getRequiredProvider(scope.getDocument, "document")();
    if (!documentRef) {
        throw new TypeError(
            "recent files context menu requires a document runtime"
        );
    }

    return documentRef;
}

function getSetTimeout(
    scope: RecentFilesContextMenuRuntimeScope
): BrowserSetTimeout | undefined {
    return getRequiredProvider(scope.getSetTimeout, "setTimeout")();
}

function getViewport(
    scope: RecentFilesContextMenuRuntimeScope
): RecentFilesContextMenuViewportSource | undefined {
    return getRequiredProvider(scope.getViewport, "viewport")();
}

export function getRecentFilesContextMenuRuntime(
    scope: RecentFilesContextMenuRuntimeScope = defaultRecentFilesContextMenuRuntimeScope
): RecentFilesContextMenuRuntime {
    return {
        addDocumentMousedownListener(listener, options): void {
            const documentEventTarget = getDocumentEventTarget(scope);
            if (!documentEventTarget) {
                throw new TypeError(
                    "recent files context menu requires a document event-target runtime"
                );
            }

            // eslint-disable-next-line runtime-cleanup/no-unmanaged-event-listeners -- The listener is tied to the caller-provided AbortSignal.
            documentEventTarget.addEventListener(
                "mousedown",
                listener,
                options
            );
        },
        appendToBody(element): void {
            getRuntimeDocument(scope).body.append(element);
        },
        bodyContains(element): boolean {
            return getRuntimeDocument(scope).body.contains(element);
        },
        clearTimeout(handle): void {
            const clearTimeoutRef = getClearTimeout(scope);
            if (typeof clearTimeoutRef !== "function") {
                throw new TypeError(
                    "recent files context menu requires a clearTimeout runtime"
                );
            }

            clearTimeoutRef(handle);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = getAbortController(scope);
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "recent files context menu requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        createMenuElement(): HTMLDivElement {
            return getRuntimeDocument(scope).createElement("div");
        },
        dateNow(): number {
            return getRequiredDateNow(scope)();
        },
        findRecentFilesMenu(): Element | null {
            return getRuntimeDocument(scope).querySelector(
                "#recent-files-menu"
            );
        },
        getBodyDebugInfo(): RecentFilesContextMenuBodyDebugInfo {
            const { body } = getRuntimeDocument(scope);

            return {
                canAppend: typeof body.append === "function",
                childElementCount: body.children.length,
                childNodeCount: body.childNodes.length,
                constructorName: body.constructor.name,
                present: Boolean(body),
            };
        },
        getProcessEnvironmentValue(name): string | undefined {
            return getRequiredProcessEnvironmentProvider(
                scope.getProcessEnvironmentValue
            )(name);
        },
        getViewport(): RecentFilesContextMenuViewport {
            const viewport = getViewport(scope);

            return {
                height: normalizeDimension(viewport?.height),
                width: normalizeDimension(viewport?.width),
            };
        },
        hasRecentFilesMenu(): boolean {
            return (
                getRuntimeDocument(scope).querySelector(
                    "#recent-files-menu"
                ) !== null
            );
        },
        insertBeforeBodyFirstChild(element): void {
            const { body } = getRuntimeDocument(scope);
            body.insertBefore(element, body.firstChild);
        },
        isBodyParent(element): boolean {
            return element.parentNode === getRuntimeDocument(scope).body;
        },
        isDevelopmentEnvironment(): boolean {
            return (
                getRequiredProvider(
                    scope.getIsDevelopmentEnvironment,
                    "isDevelopmentEnvironment"
                )() === true
            );
        },
        isNode(value): value is Node {
            return value instanceof getNodeConstructor(scope);
        },
        setTimeout(callback, delayMs): RecentFilesContextMenuTimer {
            const setTimeoutRef = getSetTimeout(scope);
            if (typeof setTimeoutRef !== "function") {
                throw new TypeError(
                    "recent files context menu requires a setTimeout runtime"
                );
            }

            return setTimeoutRef(callback, delayMs);
        },
    };
}
