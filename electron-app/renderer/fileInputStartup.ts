import {
    getRendererFileInputStartupRuntime,
    type RendererFileInputStartupRuntime,
} from "./fileInputStartupRuntime.js";

export type RendererFileInputLogger = (
    level: "warn",
    ...args: unknown[]
) => void;

export type RendererUnknownFunctionCaller = (
    candidate: unknown,
    args: unknown[]
) => unknown;

export type RendererFileInputEventTarget = Pick<
    EventTarget,
    "addEventListener" | "removeEventListener"
>;

export interface RendererFileInputStartupOptions {
    callUnknownFunction: RendererUnknownFunctionCaller;
    getHandleOpenFile: () => Promise<unknown>;
    getOverrideHandleOpenFile?: () => unknown;
    htmlInputElementConstructor?: typeof HTMLInputElement;
    logRenderer?: RendererFileInputLogger;
}

export function getFirstSelectedFile(
    fileInput: HTMLInputElement
): File | undefined {
    return fileInput.files?.[0];
}

export async function handleDelegatedFileInputChange(
    file: unknown,
    options: RendererFileInputStartupOptions
): Promise<void> {
    try {
        const handleOpenFileFn = await options.getHandleOpenFile();
        options.callUnknownFunction(handleOpenFileFn, [file]);
    } catch {
        /* Ignore errors */
    }
}

export async function handleImportTimeFileInputChange(
    fileInput: HTMLInputElement,
    options: RendererFileInputStartupOptions
): Promise<void> {
    try {
        const file = getFirstSelectedFile(fileInput);
        if (file !== undefined) {
            try {
                const handleOpenFileFn = await options.getHandleOpenFile();
                options.callUnknownFunction(handleOpenFileFn, [file]);
            } catch (error) {
                options.logRenderer?.(
                    "warn",
                    "[Renderer] Failed to handle file open:",
                    error
                );
            }
        }
    } catch (error) {
        options.logRenderer?.(
            "warn",
            "[Renderer] File input change handling failed:",
            error
        );
    }
}

export function handleImmediateFileInputChange(
    fileInput: HTMLInputElement,
    handleOpenFile: unknown,
    callUnknownFunction: RendererUnknownFunctionCaller
): void {
    const selectedFile = getFirstSelectedFile(fileInput);
    if (selectedFile !== undefined) {
        callUnknownFunction(handleOpenFile, [selectedFile]);
    }
}

export function createDelegatedFileInputChangeHandler(
    options: RendererFileInputStartupOptions
): (event: Event) => void {
    return (event) => {
        try {
            const globalInputConstructor =
                typeof HTMLInputElement === "function"
                    ? HTMLInputElement
                    : undefined;
            const inputConstructor =
                options.htmlInputElementConstructor ?? globalInputConstructor;
            const target =
                inputConstructor !== undefined &&
                event.target instanceof inputConstructor
                    ? event.target
                    : null;
            const firstFile =
                target === null ? undefined : getFirstSelectedFile(target);
            if (target?.id === "fileInput" && firstFile !== undefined) {
                try {
                    const handleOpenFileFn =
                        options.getOverrideHandleOpenFile?.();
                    if (typeof handleOpenFileFn === "function") {
                        options.callUnknownFunction(handleOpenFileFn, [
                            firstFile,
                        ]);
                        return;
                    }
                } catch {
                    /* Ignore errors */
                }

                void handleDelegatedFileInputChange(firstFile, options);
            }
        } catch {
            /* Ignore errors */
        }
    };
}

export function registerDelegatedFileInputChangeListener(
    documentTarget: RendererFileInputEventTarget,
    globalEventTarget: RendererFileInputEventTarget,
    onDelegatedFileInputChange: (event: Event) => void,
    runtime: RendererFileInputStartupRuntime = getRendererFileInputStartupRuntime()
): void {
    const abortController = runtime.createAbortController();
    const { signal } = abortController;
    const removeDelegatedFileInputChangeListener = (): void => {
        abortController.abort();
    };

    documentTarget.addEventListener("change", onDelegatedFileInputChange, {
        capture: true,
        signal,
    });
    globalEventTarget.addEventListener(
        "beforeunload",
        removeDelegatedFileInputChangeListener,
        { signal }
    );
}

export function registerImportTimeFileInputChangeHandler(
    fileInput: HTMLInputElement,
    globalEventTarget: RendererFileInputEventTarget,
    options: RendererFileInputStartupOptions,
    runtime: RendererFileInputStartupRuntime = getRendererFileInputStartupRuntime()
): void {
    const abortController = runtime.createAbortController();
    const { signal } = abortController;
    const onImportTimeFileInputChange = (): void => {
        void handleImportTimeFileInputChange(fileInput, options);
    };

    const removeImportTimeFileInputChangeHandler = (): void => {
        abortController.abort();
    };

    fileInput.addEventListener("change", onImportTimeFileInputChange, {
        signal,
    });
    globalEventTarget.addEventListener(
        "beforeunload",
        removeImportTimeFileInputChangeHandler,
        { signal }
    );
}
