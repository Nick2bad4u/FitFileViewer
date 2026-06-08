import { afterEach, describe, expect, it, vi } from "vitest";

import { createRendererFileInputWiring } from "../../../electron-app/renderer/fileInputWiring.js";
import type {
    RendererCoreModules,
    UnknownRendererFunction,
} from "../../../electron-app/renderer/coreModuleResolution.js";

function createCoreModules(
    handleOpenFile: UnknownRendererFunction
): RendererCoreModules {
    return {
        AppActions: undefined,
        applyTheme: undefined,
        getAppDomainState: undefined,
        handleOpenFile,
        listenForThemeChange: undefined,
        masterStateManager: {},
        setupListeners: undefined,
        setupTheme: undefined,
        showAboutModal: undefined,
        showNotification: undefined,
        showUpdateNotification: undefined,
        subscribeAppDomain: undefined,
        uiStateManager: {},
    };
}

function createFileInput(id: string): {
    readonly file: File;
    readonly input: HTMLInputElement;
} {
    const input = document.createElement("input");
    input.id = id;
    input.type = "file";
    const file = new File(["fit"], "activity.fit", {
        type: "application/octet-stream",
    });

    Object.defineProperty(input, "files", {
        configurable: true,
        get: () => [file],
    });

    document.body.append(input);

    return { file, input };
}

function createWiring(overrides: {
    readonly ensureCoreModules?: () => Promise<RendererCoreModules>;
    readonly getFileInput?: () => HTMLInputElement | null;
    readonly resolveExactManualMock?: (testId: string) => null | unknown;
    readonly resolveManualMock?: (pathSuffix: string) => null | unknown;
}) {
    return createRendererFileInputWiring({
        callUnknownFunction: vi.fn(
            (candidate: unknown, args: unknown[] = []) =>
                typeof candidate === "function"
                    ? (candidate as (...values: unknown[]) => unknown)(...args)
                    : undefined
        ),
        ensureCoreModules:
            overrides.ensureCoreModules ??
            (async () => createCoreModules(vi.fn())),
        getFileInput: overrides.getFileInput ?? (() => null),
        logRenderer: vi.fn(),
        resolveExactManualMock:
            overrides.resolveExactManualMock ?? (() => null),
        resolveManualMock: overrides.resolveManualMock ?? (() => null),
        toModuleRecord: (value) =>
            typeof value === "object" && value !== null
                ? (value as Record<string, unknown>)
                : {},
    });
}

async function flushFileInputHandlers(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
}

describe("renderer file input wiring", () => {
    afterEach(() => {
        window.dispatchEvent(new Event("beforeunload"));
        document.body.replaceChildren();
        vi.restoreAllMocks();
    });

    it("registers the import-time file input handler from the current DOM", async () => {
        expect.assertions(2);

        const { file, input } = createFileInput("file_input");
        const handleOpenFile = vi.fn<UnknownRendererFunction>();
        const utils = createWiring({
            ensureCoreModules: async () => createCoreModules(handleOpenFile),
            getFileInput: () => input,
        });

        utils.registerImportTimeFileInputChangeHandler(window);
        input.dispatchEvent(new Event("change"));
        await flushFileInputHandlers();

        expect(handleOpenFile).toHaveBeenCalledExactlyOnceWith(file);

        window.dispatchEvent(new Event("beforeunload"));
        handleOpenFile.mockClear();
        input.dispatchEvent(new Event("change"));
        await flushFileInputHandlers();

        expect(handleOpenFile).not.toHaveBeenCalled();
    });

    it("uses the exact manual handleOpenFile mock before suffix matches", () => {
        expect.assertions(3);

        const { file, input } = createFileInput("fileInput");
        const exactManualHandleOpenFile = vi.fn<UnknownRendererFunction>();
        const suffixManualHandleOpenFile = vi.fn<UnknownRendererFunction>();
        const asyncHandleOpenFile = vi.fn<UnknownRendererFunction>();
        const utils = createWiring({
            ensureCoreModules: async () =>
                createCoreModules(asyncHandleOpenFile),
            getFileInput: () => input,
            resolveExactManualMock: (testId) =>
                testId === "../../utils/files/import/handleOpenFile.js"
                    ? { handleOpenFile: exactManualHandleOpenFile }
                    : null,
            resolveManualMock: (pathSuffix) =>
                pathSuffix === "/utils/files/import/handleOpenFile.js"
                    ? { handleOpenFile: suffixManualHandleOpenFile }
                    : null,
        });

        utils.registerDelegatedFileInputChangeListener(document, window);
        input.dispatchEvent(new Event("change", { bubbles: true }));

        expect(exactManualHandleOpenFile).toHaveBeenCalledExactlyOnceWith(file);
        expect(suffixManualHandleOpenFile).not.toHaveBeenCalled();
        expect(asyncHandleOpenFile).not.toHaveBeenCalled();
    });

    it("falls back to async handleOpenFile when no manual mock resolves", async () => {
        expect.assertions(1);

        const { file, input } = createFileInput("fileInput");
        const handleOpenFile = vi.fn<UnknownRendererFunction>();
        const utils = createWiring({
            ensureCoreModules: async () => createCoreModules(handleOpenFile),
            getFileInput: () => input,
        });

        utils.registerDelegatedFileInputChangeListener(document, window);
        input.dispatchEvent(new Event("change", { bubbles: true }));
        await flushFileInputHandlers();

        expect(handleOpenFile).toHaveBeenCalledExactlyOnceWith(file);
    });
});
