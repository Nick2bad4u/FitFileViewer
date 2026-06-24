import type { RendererCoreModules } from "./coreModuleResolution.js";
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
        globalEventTarget: Pick<
            EventTarget,
            "addEventListener" | "removeEventListener"
        >
    ) => void;
    readonly registerImportTimeFileInputChangeHandler: (
        globalEventTarget: Pick<
            EventTarget,
            "addEventListener" | "removeEventListener"
        >
    ) => void;
};

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
            globalEventTarget
        ) => {
            try {
                registerDelegatedFileInputChangeListener(
                    documentTarget,
                    globalEventTarget,
                    onDelegatedFileInputChange
                );
            } catch {
                /* Ignore errors */
            }
        },
        registerImportTimeFileInputChangeHandler: (globalEventTarget) => {
            try {
                const fileInput = options.getFileInput();
                if (
                    fileInput !== null &&
                    typeof fileInput.addEventListener === "function"
                ) {
                    registerImportTimeFileInputChangeHandler(
                        fileInput,
                        globalEventTarget,
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
    const moduleRecord = options.toModuleRecord(
        options.resolveExactRendererCoreTestOverride(
            "../../utils/files/import/handleOpenFile.js"
        ) ??
            options.resolveRendererCoreTestOverride(
                "/utils/files/import/handleOpenFile.js"
            )
    );

    return (
        toRendererFileOpenHandler(moduleRecord["handleOpenFile"]) ??
        toRendererFileOpenHandler(
            options.toModuleRecord(moduleRecord["default"])["handleOpenFile"]
        )
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
        ? (value as RendererFileOpenHandler)
        : undefined;
}
