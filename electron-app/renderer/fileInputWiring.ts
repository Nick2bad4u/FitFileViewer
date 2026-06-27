import type { RendererHandleOpenFile } from "./coreModuleResolution.js";
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

export type RendererFileInputCoreModules = Readonly<{
    readonly handleOpenFile: RendererHandleOpenFile | undefined;
}>;

type RendererFileInputWiringOptions = {
    readonly ensureCoreModules: () => Promise<RendererFileInputCoreModules>;
    readonly getFileInput: () => HTMLInputElement | null;
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

type RendererFileInputHandleOpenFileOverrideModule = Readonly<{
    readonly default?: unknown;
    readonly handleOpenFile?: unknown;
}>;

export function createRendererFileInputWiring(
    options: RendererFileInputWiringOptions
): RendererFileInputWiring {
    const startupOptions: RendererFileInputStartupOptions = {
        getHandleOpenFile: async () => getFileInputHandleOpenFile(options),
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
    const defaultModule = toRendererFileInputHandleOpenFileOverrideModule(
        resolvedModule.default
    );

    return (
        toRendererFileOpenHandler(resolvedModule.handleOpenFile) ??
        toRendererFileOpenHandler(defaultModule.handleOpenFile)
    );
}

async function getFileInputHandleOpenFile(
    options: RendererFileInputWiringOptions
): Promise<RendererFileOpenHandler | undefined> {
    const { handleOpenFile } = await options.ensureCoreModules();
    return handleOpenFile;
}

function toRendererFileOpenHandler(
    value: unknown
): RendererFileOpenHandler | undefined {
    return typeof value === "function"
        ? (value as RendererHandleOpenFile)
        : undefined;
}

function toRendererFileInputHandleOpenFileOverrideModule(
    value: unknown
): RendererFileInputHandleOpenFileOverrideModule {
    return typeof value === "object" && value !== null ? value : {};
}
