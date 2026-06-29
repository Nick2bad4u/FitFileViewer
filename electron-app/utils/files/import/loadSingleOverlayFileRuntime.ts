import {
    type BrowserAbortControllerConstructor,
    type BrowserFileReaderConstructor,
    type BrowserResponseConstructor,
    getBrowserAbortController,
    getBrowserFileReader,
    getBrowserResponse,
} from "../../runtime/browserRuntime.js";

export interface LoadSingleOverlayFileRuntimeScope {
    readonly getAbortController: LoadSingleOverlayFileRuntimeProvider<BrowserAbortControllerConstructor>;
    readonly getFileReader: LoadSingleOverlayFileRuntimeProvider<BrowserFileReaderConstructor>;
    readonly getResponse: LoadSingleOverlayFileRuntimeProvider<BrowserResponseConstructor>;
}

export interface LoadSingleOverlayFileRuntime {
    createAbortController: () => AbortController;
    createFileReader: () => FileReader;
    readBlobArrayBufferWithResponse: (
        file: Blob
    ) => Promise<ArrayBuffer> | undefined;
}

type LoadSingleOverlayFileRuntimeProvider<T> =
    | (() => T | undefined)
    | undefined;

function getRequiredProvider<T>(
    provider: LoadSingleOverlayFileRuntimeProvider<T>,
    providerName: string
): () => T | undefined {
    if (typeof provider !== "function") {
        const article = /^[AEIOUHaeiou]/u.test(providerName) ? "an" : "a";

        throw new TypeError(
            `loadSingleOverlayFile requires ${article} ${providerName} provider`
        );
    }

    return provider;
}

function getAbortControllerConstructor(
    scope: LoadSingleOverlayFileRuntimeScope
): BrowserAbortControllerConstructor {
    const AbortControllerConstructor = getRequiredProvider(
        scope.getAbortController,
        "AbortController"
    )();
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
    const FileReaderConstructor = getRequiredProvider(
        scope.getFileReader,
        "FileReader"
    )();
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
    return getRequiredProvider(scope.getResponse, "Response")();
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
