export type CreateExportGPXButtonTimer = ReturnType<
    typeof globalThis.setTimeout
>;

export interface CreateExportGPXButtonRuntimeScope {
    readonly AbortController?: typeof AbortController | undefined;
    readonly document?: Document | undefined;
    readonly setTimeout?: typeof globalThis.setTimeout | undefined;
    readonly URL?:
        | Pick<typeof URL, "createObjectURL" | "revokeObjectURL">
        | undefined;
}

export interface CreateExportGPXButtonRuntime {
    appendToBody: (element: HTMLElement) => void;
    createAbortController: () => AbortController;
    createButton: () => HTMLButtonElement;
    createElement: <K extends keyof HTMLElementTagNameMap>(
        tagName: K
    ) => HTMLElementTagNameMap[K];
    createObjectURL: (blob: Blob) => string;
    createSvgElement: <K extends keyof SVGElementTagNameMap>(
        tagName: K
    ) => SVGElementTagNameMap[K];
    revokeObjectURL: (url: string) => void;
    setTimeout: (
        callback: () => void,
        timeout: number
    ) => CreateExportGPXButtonTimer;
}

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

function getDocument(scope: CreateExportGPXButtonRuntimeScope): Document {
    const runtimeDocument = scope.document;
    if (!runtimeDocument) {
        throw new TypeError("createExportGPXButton requires a document runtime");
    }

    return runtimeDocument;
}

function getURLRuntime(
    scope: CreateExportGPXButtonRuntimeScope
): Pick<typeof URL, "createObjectURL" | "revokeObjectURL"> {
    const urlRuntime = scope.URL;
    if (
        !urlRuntime ||
        typeof urlRuntime.createObjectURL !== "function" ||
        typeof urlRuntime.revokeObjectURL !== "function"
    ) {
        throw new TypeError("createExportGPXButton requires a URL runtime");
    }

    return urlRuntime;
}

export function getCreateExportGPXButtonRuntime(
    scope: CreateExportGPXButtonRuntimeScope = globalThis
): CreateExportGPXButtonRuntime {
    return {
        appendToBody(element): void {
            getDocument(scope).body.append(element);
        },
        createAbortController(): AbortController {
            const AbortControllerConstructor = scope.AbortController;
            if (typeof AbortControllerConstructor !== "function") {
                throw new TypeError(
                    "createExportGPXButton requires an AbortController runtime"
                );
            }

            return new AbortControllerConstructor();
        },
        createButton(): HTMLButtonElement {
            return getDocument(scope).createElement("button");
        },
        createElement<K extends keyof HTMLElementTagNameMap>(
            tagName: K
        ): HTMLElementTagNameMap[K] {
            return getDocument(scope).createElement(tagName);
        },
        createObjectURL(blob): string {
            return getURLRuntime(scope).createObjectURL(blob);
        },
        createSvgElement<K extends keyof SVGElementTagNameMap>(
            tagName: K
        ): SVGElementTagNameMap[K] {
            return getDocument(scope).createElementNS(SVG_NAMESPACE, tagName);
        },
        revokeObjectURL(url): void {
            getURLRuntime(scope).revokeObjectURL(url);
        },
        setTimeout(callback, timeout): CreateExportGPXButtonTimer {
            const setTimeoutRef = scope.setTimeout ?? globalThis.setTimeout;
            return setTimeoutRef(callback, timeout);
        },
    };
}
