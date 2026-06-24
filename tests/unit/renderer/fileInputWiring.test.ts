import { afterEach, describe, expect, it, vi } from "vitest";

import { createRendererFileInputWiring } from "../../../electron-app/renderer/fileInputWiring.js";
import type {
    RendererHandleOpenFile,
    RendererCoreModules,
} from "../../../electron-app/renderer/coreModuleResolution.js";

function createCoreModules(
    handleOpenFile: RendererHandleOpenFile
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
        subscribeAppDomainPath: undefined,
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
    readonly resolveExactRendererCoreTestOverride?: (
        testId: string
    ) => null | unknown;
    readonly resolveRendererCoreTestOverride?: (
        pathSuffix: string
    ) => null | unknown;
}) {
    return createRendererFileInputWiring({
        ensureCoreModules:
            overrides.ensureCoreModules ??
            (async () => createCoreModules(vi.fn())),
        getFileInput: overrides.getFileInput ?? (() => null),
        logRenderer: vi.fn(),
        resolveExactRendererCoreTestOverride:
            overrides.resolveExactRendererCoreTestOverride ?? (() => null),
        resolveRendererCoreTestOverride:
            overrides.resolveRendererCoreTestOverride ?? (() => null),
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
        const handleOpenFile = vi.fn<RendererHandleOpenFile>();
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

    it("uses the exact handleOpenFile test override before suffix matches", () => {
        expect.assertions(3);

        const { file, input } = createFileInput("fileInput");
        const exactOverrideHandleOpenFile = vi.fn<RendererHandleOpenFile>();
        const suffixOverrideHandleOpenFile = vi.fn<RendererHandleOpenFile>();
        const asyncHandleOpenFile = vi.fn<RendererHandleOpenFile>();
        const utils = createWiring({
            ensureCoreModules: async () =>
                createCoreModules(asyncHandleOpenFile),
            getFileInput: () => input,
            resolveExactRendererCoreTestOverride: (testId) =>
                testId === "../../utils/files/import/handleOpenFile.js"
                    ? { handleOpenFile: exactOverrideHandleOpenFile }
                    : null,
            resolveRendererCoreTestOverride: (pathSuffix) =>
                pathSuffix === "/utils/files/import/handleOpenFile.js"
                    ? { handleOpenFile: suffixOverrideHandleOpenFile }
                    : null,
        });

        utils.registerDelegatedFileInputChangeListener(document, window);
        input.dispatchEvent(new Event("change", { bubbles: true }));

        expect(exactOverrideHandleOpenFile).toHaveBeenCalledExactlyOnceWith(
            file
        );
        expect(suffixOverrideHandleOpenFile).not.toHaveBeenCalled();
        expect(asyncHandleOpenFile).not.toHaveBeenCalled();
    });

    it("falls back to async handleOpenFile when no test override resolves", async () => {
        expect.assertions(1);

        const { file, input } = createFileInput("fileInput");
        const handleOpenFile = vi.fn<RendererHandleOpenFile>();
        const utils = createWiring({
            ensureCoreModules: async () => createCoreModules(handleOpenFile),
            getFileInput: () => input,
        });

        utils.registerDelegatedFileInputChangeListener(document, window);
        input.dispatchEvent(new Event("change", { bubbles: true }));
        await flushFileInputHandlers();

        expect(handleOpenFile).toHaveBeenCalledExactlyOnceWith(file);
    });

    it("ignores import-time registration failures", () => {
        expect.assertions(1);

        const utils = createWiring({
            getFileInput: () => {
                throw new Error("missing DOM");
            },
        });

        expect(() => {
            utils.registerImportTimeFileInputChangeHandler(window);
        }).not.toThrow();
    });

    it("ignores delegated listener registration failures", () => {
        expect.assertions(1);

        const utils = createWiring({});
        const throwingDocumentTarget = {
            addEventListener: () => {
                throw new Error("listener failed");
            },
            removeEventListener: vi.fn(),
        } as unknown as Document;

        expect(() => {
            utils.registerDelegatedFileInputChangeListener(
                throwingDocumentTarget,
                window
            );
        }).not.toThrow();
    });
});
