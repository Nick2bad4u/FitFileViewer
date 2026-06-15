import type {
    RendererCoreModules,
    UnknownRendererFunction,
} from "./coreModuleResolution.js";
import {
    createDelegatedFileInputChangeHandler,
    registerDelegatedFileInputChangeListener,
    registerImportTimeFileInputChangeHandler,
    type RendererFileInputStartupOptions,
} from "./fileInputStartup.js";

type RendererFileInputWiringLogger = (
    level: "warn",
    ...args: unknown[]
) => void;

type RendererFileInputWiringOptions = {
    readonly callUnknownFunction: (
        candidate: unknown,
        args?: unknown[]
    ) => unknown;
    readonly ensureCoreModules: () => Promise<RendererCoreModules>;
    readonly getFileInput: () => HTMLInputElement | null;
    readonly logRenderer: RendererFileInputWiringLogger;
    readonly resolveExactRendererCoreTestOverride: (
        testId: string
    ) => null | unknown;
    readonly resolveRendererCoreTestOverride: (
        pathSuffix: string
    ) => null | unknown;
    readonly toModuleRecord: (value: unknown) => Record<string, unknown>;
};

type RendererFileInputWiring = {
    readonly getFileInput: () => HTMLInputElement | null;
    readonly registerDelegatedFileInputChangeListener: (
        documentTarget: Pick<
            EventTarget,
            "addEventListener" | "removeEventListener"
        >,
        windowTarget: Pick<
            EventTarget,
            "addEventListener" | "removeEventListener"
        >
    ) => void;
    readonly registerImportTimeFileInputChangeHandler: (
        windowTarget: Pick<
            EventTarget,
            "addEventListener" | "removeEventListener"
        >
    ) => void;
};

export function createRendererFileInputWiring(
    options: RendererFileInputWiringOptions
): RendererFileInputWiring {
    const startupOptions: RendererFileInputStartupOptions = {
        callUnknownFunction: options.callUnknownFunction,
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
            windowTarget
        ) => {
            try {
                registerDelegatedFileInputChangeListener(
                    documentTarget,
                    windowTarget,
                    onDelegatedFileInputChange
                );
            } catch {
                /* Ignore errors */
            }
        },
        registerImportTimeFileInputChangeHandler: (windowTarget) => {
            try {
                const fileInput = options.getFileInput();
                if (
                    fileInput !== null &&
                    typeof fileInput.addEventListener === "function"
                ) {
                    registerImportTimeFileInputChangeHandler(
                        fileInput,
                        windowTarget,
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
): unknown {
    const moduleRecord = options.toModuleRecord(
        options.resolveExactRendererCoreTestOverride(
            "../../utils/files/import/handleOpenFile.js"
        ) ??
            options.resolveRendererCoreTestOverride(
                "/utils/files/import/handleOpenFile.js"
            )
    );

    return (
        moduleRecord["handleOpenFile"] ??
        options.toModuleRecord(moduleRecord["default"])["handleOpenFile"]
    );
}

async function getFileInputHandleOpenFile(
    options: RendererFileInputWiringOptions
): Promise<undefined | UnknownRendererFunction> {
    const { handleOpenFile } = await options.ensureCoreModules();
    return handleOpenFile;
}
