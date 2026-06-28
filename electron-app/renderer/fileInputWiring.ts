import {
    createDelegatedFileInputChangeHandler,
    registerDelegatedFileInputChangeListener,
    registerImportTimeFileInputChangeHandler,
    type RendererFileOpenHandler,
    type RendererFileInputStartupOptions,
} from "./fileInputStartup.js";

type RendererFileInputWiringLogger = (
    level: "warn",
    ...args: unknown[]
) => void;

type RendererFileInputWiringOptions = {
    readonly getFileInput: () => HTMLInputElement | null;
    readonly handleOpenFile: RendererFileOpenHandler;
    readonly logRenderer: RendererFileInputWiringLogger;
};

type RendererFileInputWiring = {
    readonly getFileInput: () => HTMLInputElement | null;
    readonly registerDelegatedFileInputChangeListener: (
        documentTarget: Pick<
            EventTarget,
            "addEventListener" | "removeEventListener"
        >,
        rendererEventTarget: Pick<
            EventTarget,
            "addEventListener" | "removeEventListener"
        >
    ) => void;
    readonly registerImportTimeFileInputChangeHandler: (
        rendererEventTarget: Pick<
            EventTarget,
            "addEventListener" | "removeEventListener"
        >
    ) => void;
};

export function createRendererFileInputWiring(
    options: RendererFileInputWiringOptions
): RendererFileInputWiring {
    const startupOptions: RendererFileInputStartupOptions = {
        getHandleOpenFile: async () => options.handleOpenFile,
        logRenderer: options.logRenderer,
    };
    const onDelegatedFileInputChange =
        createDelegatedFileInputChangeHandler(startupOptions);

    return {
        getFileInput: options.getFileInput,
        registerDelegatedFileInputChangeListener: (
            documentTarget,
            rendererEventTarget
        ) => {
            try {
                registerDelegatedFileInputChangeListener(
                    documentTarget,
                    rendererEventTarget,
                    onDelegatedFileInputChange
                );
            } catch {
                /* Ignore errors */
            }
        },
        registerImportTimeFileInputChangeHandler: (rendererEventTarget) => {
            try {
                const fileInput = options.getFileInput();
                if (
                    fileInput !== null &&
                    typeof fileInput.addEventListener === "function"
                ) {
                    registerImportTimeFileInputChangeHandler(
                        fileInput,
                        rendererEventTarget,
                        startupOptions
                    );
                }
            } catch {
                /* Ignore errors */
            }
        },
    };
}
