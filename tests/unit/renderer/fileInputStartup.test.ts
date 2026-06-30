import { afterEach, describe, expect, it, vi } from "vitest";

import {
    createDelegatedFileInputChangeHandler,
    handleImmediateFileInputChange,
    registerDelegatedFileInputChangeListener,
    registerImportTimeFileInputChangeHandler,
} from "../../../electron-app/renderer/fileInputStartup.js";
import {
    getRendererFileInputStartupRuntime,
    type RendererFileInputStartupRuntimeScope,
} from "../../../electron-app/renderer/fileInputStartupRuntime.js";
import type { BrowserHTMLInputElementConstructor } from "../../../electron-app/utils/runtime/browserRuntime.js";

function createFileInput(id = "fileInput"): {
    file: File;
    input: HTMLInputElement;
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

function createRuntimeScope(
    overrides: Partial<RendererFileInputStartupRuntimeScope> = {}
): RendererFileInputStartupRuntimeScope {
    return {
        getAbortController: () => AbortController,
        getHTMLInputElement: () => window.HTMLInputElement,
        ...overrides,
    };
}

describe("renderer file input startup wiring", () => {
    afterEach(() => {
        window.dispatchEvent(new Event("beforeunload"));
        document.body.replaceChildren();
        vi.restoreAllMocks();
    });

    it("uses renderer browser runtime providers for production defaults", () => {
        expect.assertions(1);

        const utils = getRendererFileInputStartupRuntime();

        expect(utils.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("creates abort controllers through the injected runtime provider", () => {
        expect.assertions(3);

        let controllerCount = 0;
        const signal = Symbol("file-input-startup-signal");
        class TestAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public constructor() {
                controllerCount += 1;
            }

            public abort(): void {
                /* Test double */
            }
        }
        const utils = getRendererFileInputStartupRuntime({
            ...createRuntimeScope(),
            getAbortController: () => TestAbortController,
            getHTMLInputElement: () => undefined,
        });

        expect(utils.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
        expect(utils.isHTMLInputElement(document.createElement("input"))).toBe(
            false
        );
    });

    it("detects HTML input elements through the injected runtime provider", () => {
        expect.assertions(2);

        class TestHTMLInputElement {}
        const input = new TestHTMLInputElement();
        const utils = getRendererFileInputStartupRuntime({
            ...createRuntimeScope(),
            getHTMLInputElement: () =>
                TestHTMLInputElement as unknown as BrowserHTMLInputElementConstructor,
        });

        expect(utils.isHTMLInputElement(input)).toBe(true);
        expect(utils.isHTMLInputElement(document.createElement("div"))).toBe(
            false
        );
    });

    it("ignores legacy direct constructor scope properties", () => {
        expect.assertions(1);

        class LegacyAbortController implements AbortController {
            public readonly signal = Symbol(
                "legacy-file-input-startup-signal"
            ) as unknown as AbortSignal;

            public abort(): void {
                /* Test double */
            }
        }
        expect(() =>
            getRendererFileInputStartupRuntime({
                AbortController: LegacyAbortController,
                HTMLInputElement: window.HTMLInputElement,
            } as unknown as RendererFileInputStartupRuntimeScope)
        ).toThrow(
            "renderer file input startup requires an AbortController provider"
        );
    });

    it("forwards immediate selected files to handleOpenFile", () => {
        expect.assertions(1);

        const { file, input } = createFileInput();
        const handleOpenFile = vi.fn<() => void>();

        handleImmediateFileInputChange(input, handleOpenFile);

        expect(handleOpenFile).toHaveBeenCalledExactlyOnceWith(file);
    });

    it("wires import-time file input changes and removes them on unload", async () => {
        expect.assertions(3);

        const { file, input } = createFileInput();
        const handleOpenFile = vi.fn<() => void>();

        const rendererEventTarget = window;

        registerImportTimeFileInputChangeHandler(input, rendererEventTarget, {
            getHandleOpenFile: async () => handleOpenFile,
        });

        input.dispatchEvent(new Event("change"));
        await Promise.resolve();

        expect(handleOpenFile).toHaveBeenCalledExactlyOnceWith(file);

        window.dispatchEvent(new Event("beforeunload"));
        handleOpenFile.mockClear();
        input.dispatchEvent(new Event("change"));
        await Promise.resolve();

        expect(handleOpenFile).not.toHaveBeenCalled();
        expect(input.id).toBe("fileInput");
    });

    it("logs rejected import-time file open handlers", async () => {
        expect.assertions(2);

        const { input } = createFileInput();
        const openError = new Error("open failed");
        const handleOpenFile = vi.fn<(file: File) => Promise<void>>(
            async () => {
                throw openError;
            }
        );
        const logRenderer = vi.fn();

        registerImportTimeFileInputChangeHandler(input, window, {
            getHandleOpenFile: async () => handleOpenFile,
            logRenderer,
        });

        input.dispatchEvent(new Event("change"));
        await Promise.resolve();
        await Promise.resolve();

        expect(handleOpenFile).toHaveBeenCalledOnce();
        expect(logRenderer).toHaveBeenCalledWith(
            "warn",
            "[Renderer] Failed to handle file open:",
            openError
        );
    });

    it("resolves listener abort controllers through the injected runtime", async () => {
        expect.assertions(4);

        const { file, input } = createFileInput();
        const abortController = new AbortController();
        const abort = vi.fn(() => {
            abortController.abort();
        });
        const handleOpenFile = vi.fn<() => void>();
        const fileInputStartupAdapter = {
            createAbortController: vi.fn(() => ({
                abort,
                signal: abortController.signal,
            })),
        };

        registerImportTimeFileInputChangeHandler(
            input,
            window,
            {
                getHandleOpenFile: async () => handleOpenFile,
            },
            fileInputStartupAdapter
        );
        input.dispatchEvent(new Event("change"));
        await Promise.resolve();

        expect(handleOpenFile).toHaveBeenCalledExactlyOnceWith(file);

        window.dispatchEvent(new Event("beforeunload"));
        handleOpenFile.mockClear();
        input.dispatchEvent(new Event("change"));
        await Promise.resolve();

        expect(
            fileInputStartupAdapter.createAbortController
        ).toHaveBeenCalledOnce();
        expect(handleOpenFile).not.toHaveBeenCalled();
        expect(abort).toHaveBeenCalledOnce();
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const utils = getRendererFileInputStartupRuntime({
            ...createRuntimeScope(),
            getAbortController: () => undefined,
        });

        expect(() => {
            utils.createAbortController();
        }).toThrow(
            "renderer file input startup requires an AbortController runtime"
        );
    });

    it("fails clearly when explicit scopes omit runtime providers", () => {
        expect.assertions(2);

        expect(() =>
            getRendererFileInputStartupRuntime({
                getHTMLInputElement: () => window.HTMLInputElement,
            } as unknown as RendererFileInputStartupRuntimeScope)
        ).toThrow(
            "renderer file input startup requires an AbortController provider"
        );
        expect(() =>
            getRendererFileInputStartupRuntime({
                getAbortController: () => AbortController,
            } as unknown as RendererFileInputStartupRuntimeScope)
        ).toThrow(
            "renderer file input startup requires an HTMLInputElement provider"
        );
    });

    it("fails clearly when runtime provider slots are undefined", () => {
        expect.assertions(2);

        expect(() =>
            getRendererFileInputStartupRuntime({
                ...createRuntimeScope(),
                getAbortController: undefined,
            })
        ).toThrow(
            "renderer file input startup requires an AbortController provider"
        );
        expect(() =>
            getRendererFileInputStartupRuntime({
                ...createRuntimeScope(),
                getHTMLInputElement: undefined,
            })
        ).toThrow(
            "renderer file input startup requires an HTMLInputElement provider"
        );
    });

    it("uses async handleOpenFile resolution for delegated file inputs", async () => {
        expect.assertions(1);

        const { file, input } = createFileInput();
        const asyncHandleOpenFile = vi.fn<() => void>();
        const delegatedHandler = createDelegatedFileInputChangeHandler({
            getHandleOpenFile: async () => asyncHandleOpenFile,
        });

        registerDelegatedFileInputChangeListener(
            document,
            window,
            delegatedHandler
        );
        input.dispatchEvent(new Event("change", { bubbles: true }));
        await Promise.resolve();

        expect(asyncHandleOpenFile).toHaveBeenCalledExactlyOnceWith(file);
    });

    it("ignores rejected delegated file open handlers", async () => {
        expect.assertions(1);

        const { input } = createFileInput();
        const delegatedHandler = createDelegatedFileInputChangeHandler({
            getHandleOpenFile: async () => async () => {
                throw new Error("delegated open failed");
            },
        });

        registerDelegatedFileInputChangeListener(
            document,
            window,
            delegatedHandler
        );
        input.dispatchEvent(new Event("change", { bubbles: true }));
        await Promise.resolve();
        await Promise.resolve();

        expect(input.id).toBe("fileInput");
    });
});
