import { getBrowserAbortController } from "../../runtime/browserRuntime.js";

export interface LoadSingleOverlayFileRuntimeScope {
    readonly getAbortController?:
        | (() => typeof AbortController | undefined)
        | undefined;
    readonly getFileReader?: (() => typeof FileReader | undefined) | undefined;
    readonly getResponse?: (() => typeof Response | undefined) | undefined;
}

export interface LoadSingleOverlayFileRuntime {
    createAbortController: () => AbortController;
    createFileReader: () => FileReader;
    readBlobArrayBufferWithResponse: (
        file: Blob
    ) => Promise<ArrayBuffer> | undefined;
}

function getAbortControllerConstructor(
    scope: LoadSingleOverlayFileRuntimeScope
): typeof AbortController {
    const AbortControllerConstructor = scope.getAbortController?.();
    if (typeof AbortControllerConstructor !== "function") {
        throw new TypeError(
            "loadSingleOverlayFile requires an AbortController runtime"
        );
    }

    return AbortControllerConstructor;
}

function getFileReaderConstructor(
    scope: LoadSingleOverlayFileRuntimeScope
): typeof FileReader {
    const FileReaderConstructor = scope.getFileReader?.();
    if (typeof FileReaderConstructor !== "function") {
        throw new TypeError(
            "loadSingleOverlayFile requires a FileReader runtime"
        );
    }

    return FileReaderConstructor;
}

function getResponseConstructor(
    scope: LoadSingleOverlayFileRuntimeScope
): typeof Response | undefined {
    return scope.getResponse?.();
}

const defaultLoadSingleOverlayFileRuntimeScope: LoadSingleOverlayFileRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
        getFileReader: () => globalThis.FileReader,
        getResponse: () => globalThis.Response,
    };

export function getLoadSingleOverlayFileRuntime(
    scope: LoadSingleOverlayFileRuntimeScope = defaultLoadSingleOverlayFileRuntimeScope
): LoadSingleOverlayFileRuntime {
    return {
        createAbortController(): AbortController {
            return new (getAbortControllerConstructor(scope))();
        },
        createFileReader(): FileReader {
            return new (getFileReaderConstructor(scope))();
        },
        readBlobArrayBufferWithResponse(
            file: Blob
        ): Promise<ArrayBuffer> | undefined {
            const ResponseConstructor = getResponseConstructor(scope);
            if (typeof ResponseConstructor !== "function") {
                return undefined;
            }

            return new ResponseConstructor(file).arrayBuffer();
        },
    };
}
