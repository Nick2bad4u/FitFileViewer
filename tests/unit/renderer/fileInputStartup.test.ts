import { afterEach, describe, expect, it, vi } from "vitest";

import {
    createDelegatedFileInputChangeHandler,
    handleImmediateFileInputChange,
    registerDelegatedFileInputChangeListener,
    registerImportTimeFileInputChangeHandler,
} from "../../../electron-app/renderer/fileInputStartup.js";
import { getRendererFileInputStartupRuntime } from "../../../electron-app/renderer/fileInputStartupRuntime.js";
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
            getAbortController: () => TestAbortController,
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
            getHTMLInputElement: () =>
                TestHTMLInputElement as unknown as BrowserHTMLInputElementConstructor,
        });

        expect(utils.isHTMLInputElement(input)).toBe(true);
        expect(utils.isHTMLInputElement(document.createElement("div"))).toBe(
            false
        );
    });

    it("ignores legacy direct constructor scope properties", () => {
        expect.assertions(2);

        class LegacyAbortController implements AbortController {
            public readonly signal = Symbol(
                "legacy-file-input-startup-signal"
            ) as unknown as AbortSignal;

            public abort(): void {
                /* Test double */
            }
        }
        const utils = getRendererFileInputStartupRuntime({
            AbortController: LegacyAbortController,
            HTMLInputElement: window.HTMLInputElement,
        } as unknown as Parameters<
            typeof getRendererFileInputStartupRuntime
        >[0]);

        expect(() => {
            utils.createAbortController();
        }).toThrow(
            "renderer file input startup requires an AbortController runtime"
        );
        expect(utils.isHTMLInputElement(document.createElement("input"))).toBe(
            false
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

        const utils = getRendererFileInputStartupRuntime({});

        expect(() => {
            utils.createAbortController();
        }).toThrow(
            "renderer file input startup requires an AbortController runtime"
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
});
