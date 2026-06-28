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
    readonly resolveExactRendererCoreTestOverride: (
        testId: string
    ) => null | unknown;
    readonly resolveRendererCoreTestOverride: (
        pathSuffix: string
    ) => null | unknown;
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

type RendererFileInputHandleOpenFileDefaultExport = Readonly<{
    readonly handleOpenFile?: RendererFileOpenHandler | undefined;
}>;

type RendererFileInputHandleOpenFileOverrideModule = Readonly<{
    readonly default?: RendererFileInputHandleOpenFileDefaultExport | undefined;
    readonly handleOpenFile?: RendererFileOpenHandler | undefined;
}>;

export function createRendererFileInputWiring(
    options: RendererFileInputWiringOptions
): RendererFileInputWiring {
    const startupOptions: RendererFileInputStartupOptions = {
        getHandleOpenFile: async () => options.handleOpenFile,
        getOverrideHandleOpenFile: () => resolveOverrideHandleOpenFile(options),
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

function resolveOverrideHandleOpenFile(
    options: RendererFileInputWiringOptions
): RendererFileOpenHandler | undefined {
    const resolvedModule = toRendererFileInputHandleOpenFileOverrideModule(
        options.resolveExactRendererCoreTestOverride(
            "../../utils/files/import/handleOpenFile.js"
        ) ??
            options.resolveRendererCoreTestOverride(
                "/utils/files/import/handleOpenFile.js"
            )
    );

    return (
        resolvedModule?.handleOpenFile ??
        resolvedModule?.default?.handleOpenFile
    );
}

function toRendererFileOpenHandler(
    value: unknown
): RendererFileOpenHandler | undefined {
    return isRendererFileOpenHandler(value) ? value : undefined;
}

function isRendererFileOpenHandler(
    value: unknown
): value is RendererFileOpenHandler {
    return typeof value === "function";
}

function toRendererFileInputHandleOpenFileOverrideModule(
    value: unknown
): RendererFileInputHandleOpenFileOverrideModule | undefined {
    if (typeof value !== "object" || value === null) {
        return undefined;
    }

    const defaultExport =
        "default" in value
            ? toRendererFileInputHandleOpenFileDefaultExport(value.default)
            : undefined;
    const handleOpenFile =
        "handleOpenFile" in value
            ? toRendererFileOpenHandler(value.handleOpenFile)
            : undefined;

    if (defaultExport === undefined && handleOpenFile === undefined) {
        return undefined;
    }

    return {
        default: defaultExport,
        handleOpenFile,
    };
}

function toRendererFileInputHandleOpenFileDefaultExport(
    value: unknown
): RendererFileInputHandleOpenFileDefaultExport | undefined {
    if (
        typeof value !== "object" ||
        value === null ||
        !("handleOpenFile" in value)
    ) {
        return undefined;
    }

    const handleOpenFile = toRendererFileOpenHandler(value.handleOpenFile);
    return handleOpenFile === undefined ? undefined : { handleOpenFile };
}
