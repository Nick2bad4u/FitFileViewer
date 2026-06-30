import {
    getRendererFileInputStartupRuntime,
    type RendererFileInputStartupRuntime,
} from "./fileInputStartupRuntime.js";

export type RendererFileInputLogger = (
    level: "warn",
    ...args: unknown[]
) => void;

export type RendererFileOpenHandler = (file: File) => Promise<void> | void;

export type RendererFileInputEventTarget = Pick<
    EventTarget,
    "addEventListener" | "removeEventListener"
>;

export interface RendererFileInputStartupOptions {
    getHandleOpenFile: () => Promise<RendererFileOpenHandler | undefined>;
    logRenderer?: RendererFileInputLogger;
}

export function getFirstSelectedFile(
    fileInput: HTMLInputElement
): File | undefined {
    return fileInput.files?.[0];
}

function invokeFileOpenHandler(
    handleOpenFile: RendererFileOpenHandler,
    file: File
): Promise<void> {
    return Promise.resolve(handleOpenFile(file));
}

export async function handleDelegatedFileInputChange(
    file: File,
    options: RendererFileInputStartupOptions
): Promise<void> {
    try {
        const handleOpenFileFn = await options.getHandleOpenFile();
        if (handleOpenFileFn !== undefined) {
            await invokeFileOpenHandler(handleOpenFileFn, file);
        }
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
                if (handleOpenFileFn !== undefined) {
                    await invokeFileOpenHandler(handleOpenFileFn, file);
                }
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
    handleOpenFile: RendererFileOpenHandler | undefined
): void {
    const selectedFile = getFirstSelectedFile(fileInput);
    if (selectedFile !== undefined && handleOpenFile !== undefined) {
        void invokeFileOpenHandler(handleOpenFile, selectedFile).catch(() => {
            /* Ignore errors */
        });
    }
}

export function createDelegatedFileInputChangeHandler(
    options: RendererFileInputStartupOptions,
    runtime: RendererFileInputStartupRuntime = getRendererFileInputStartupRuntime()
): (event: Event) => void {
    return (event) => {
        try {
            const target = runtime.isHTMLInputElement(event.target)
                ? event.target
                : null;
            const firstFile =
                target === null ? undefined : getFirstSelectedFile(target);
            if (target?.id === "fileInput" && firstFile !== undefined) {
                void handleDelegatedFileInputChange(firstFile, options);
            }
        } catch {
            /* Ignore errors */
        }
    };
}

export function registerDelegatedFileInputChangeListener(
    documentTarget: RendererFileInputEventTarget,
    rendererEventTarget: RendererFileInputEventTarget,
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
    rendererEventTarget.addEventListener(
        "beforeunload",
        removeDelegatedFileInputChangeListener,
        { signal }
    );
}

export function registerImportTimeFileInputChangeHandler(
    fileInput: HTMLInputElement,
    rendererEventTarget: RendererFileInputEventTarget,
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
    rendererEventTarget.addEventListener(
        "beforeunload",
        removeImportTimeFileInputChangeHandler,
        { signal }
    );
}
