import {
    type BrowserAbortControllerConstructor,
    type BrowserFileReaderConstructor,
    type BrowserResponseConstructor,
    getBrowserAbortController,
    getBrowserFileReader,
    getBrowserResponse,
} from "../../runtime/browserRuntime.js";

export interface LoadSingleOverlayFileRuntimeScope {
    readonly getAbortController?:
        | (() => BrowserAbortControllerConstructor | undefined)
        | undefined;
    readonly getFileReader?:
        | (() => BrowserFileReaderConstructor | undefined)
        | undefined;
    readonly getResponse?:
        | (() => BrowserResponseConstructor | undefined)
        | undefined;
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
): BrowserAbortControllerConstructor {
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
): BrowserFileReaderConstructor {
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
): BrowserResponseConstructor | undefined {
    return scope.getResponse?.();
}

const defaultLoadSingleOverlayFileRuntimeScope: LoadSingleOverlayFileRuntimeScope =
    {
        getAbortController: getBrowserAbortController,
        getFileReader: getBrowserFileReader,
        getResponse: getBrowserResponse,
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
