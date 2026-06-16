import { afterEach, describe, expect, it, vi } from "vitest";

import {
    createDelegatedFileInputChangeHandler,
    handleImmediateFileInputChange,
    registerDelegatedFileInputChangeListener,
    registerImportTimeFileInputChangeHandler,
    type RendererUnknownFunctionCaller,
} from "../../../electron-app/renderer/fileInputStartup.js";
import { getRendererFileInputStartupRuntime } from "../../../electron-app/renderer/fileInputStartupRuntime.js";

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

describe("renderer file input startup wiring", () => {
    afterEach(() => {
        window.dispatchEvent(new Event("beforeunload"));
        document.body.replaceChildren();
        vi.restoreAllMocks();
    });

    it("forwards immediate selected files to handleOpenFile", () => {
        expect.assertions(1);

        const { file, input } = createFileInput();
        const handleOpenFile = vi.fn<() => void>();
        const callUnknownFunction = vi.fn<RendererUnknownFunctionCaller>();

        handleImmediateFileInputChange(
            input,
            handleOpenFile,
            callUnknownFunction
        );

        expect(callUnknownFunction).toHaveBeenCalledExactlyOnceWith(
            handleOpenFile,
            [file]
        );
    });

    it("wires import-time file input changes and removes them on unload", async () => {
        expect.assertions(3);

        const { file, input } = createFileInput();
        const handleOpenFile = vi.fn<() => void>();
        const callUnknownFunction = vi.fn<RendererUnknownFunctionCaller>();

        const globalEventTarget = window;

        registerImportTimeFileInputChangeHandler(input, globalEventTarget, {
            callUnknownFunction,
            getHandleOpenFile: async () => handleOpenFile,
        });

        input.dispatchEvent(new Event("change"));
        await Promise.resolve();

        expect(callUnknownFunction).toHaveBeenCalledExactlyOnceWith(
            handleOpenFile,
            [file]
        );

        window.dispatchEvent(new Event("beforeunload"));
        callUnknownFunction.mockClear();
        input.dispatchEvent(new Event("change"));
        await Promise.resolve();

        expect(callUnknownFunction).not.toHaveBeenCalled();
        expect(input.id).toBe("fileInput");
    });

    it("resolves listener abort controllers through the injected runtime", async () => {
        expect.assertions(4);

        const { file, input } = createFileInput();
        const abortController = new AbortController();
        const abort = vi.fn(() => {
            abortController.abort();
        });
        const handleOpenFile = vi.fn<() => void>();
        const callUnknownFunction = vi.fn<RendererUnknownFunctionCaller>();
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
                callUnknownFunction,
                getHandleOpenFile: async () => handleOpenFile,
            },
            fileInputStartupAdapter
        );
        input.dispatchEvent(new Event("change"));
        await Promise.resolve();

        expect(callUnknownFunction).toHaveBeenCalledExactlyOnceWith(
            handleOpenFile,
            [file]
        );

        window.dispatchEvent(new Event("beforeunload"));
        callUnknownFunction.mockClear();
        input.dispatchEvent(new Event("change"));
        await Promise.resolve();

        expect(
            fileInputStartupAdapter.createAbortController
        ).toHaveBeenCalledOnce();
        expect(callUnknownFunction).not.toHaveBeenCalled();
        expect(abort).toHaveBeenCalledOnce();
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const utils = getRendererFileInputStartupRuntime({});

        expect(() => {
            utils.createAbortController();
        }).toThrow(
            "renderer file input startup requires an AbortController runtime"
        );
    });

    it("prefers delegated override handleOpenFile resolution for test-created inputs", () => {
        expect.assertions(1);

        const { file, input } = createFileInput();
        const overrideHandleOpenFile = vi.fn<() => void>();
        const asyncHandleOpenFile = vi.fn<() => void>();
        const callUnknownFunction = vi.fn<RendererUnknownFunctionCaller>();
        const delegatedHandler = createDelegatedFileInputChangeHandler({
            callUnknownFunction,
            getHandleOpenFile: async () => asyncHandleOpenFile,
            getOverrideHandleOpenFile: () => overrideHandleOpenFile,
            htmlInputElementConstructor: window.HTMLInputElement,
        });

        registerDelegatedFileInputChangeListener(
            document,
            window,
            delegatedHandler
        );
        input.dispatchEvent(new Event("change", { bubbles: true }));

        expect(callUnknownFunction).toHaveBeenCalledExactlyOnceWith(
            overrideHandleOpenFile,
            [file]
        );
    });

    it("falls back to async handleOpenFile resolution when no override handler is available", async () => {
        expect.assertions(1);

        const { file, input } = createFileInput();
        const asyncHandleOpenFile = vi.fn<() => void>();
        const callUnknownFunction = vi.fn<RendererUnknownFunctionCaller>();
        const delegatedHandler = createDelegatedFileInputChangeHandler({
            callUnknownFunction,
            getHandleOpenFile: async () => asyncHandleOpenFile,
            getOverrideHandleOpenFile: () => undefined,
            htmlInputElementConstructor: window.HTMLInputElement,
        });

        registerDelegatedFileInputChangeListener(
            document,
            window,
            delegatedHandler
        );
        input.dispatchEvent(new Event("change", { bubbles: true }));
        await Promise.resolve();

        expect(callUnknownFunction).toHaveBeenCalledExactlyOnceWith(
            asyncHandleOpenFile,
            [file]
        );
    });
});
