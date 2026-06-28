import { afterEach, describe, expect, it, vi } from "vitest";

import { createRendererFileInputWiring } from "../../../electron-app/renderer/fileInputWiring.js";
import type { RendererFileOpenHandler } from "../../../electron-app/renderer/fileInputStartup.js";

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
    readonly getFileInput?: () => HTMLInputElement | null;
    readonly handleOpenFile?: RendererFileOpenHandler;
    readonly resolveExactRendererCoreTestOverride?: (
        testId: string
    ) => null | unknown;
    readonly resolveRendererCoreTestOverride?: (
        pathSuffix: string
    ) => null | unknown;
}) {
    return createRendererFileInputWiring({
        getFileInput: overrides.getFileInput ?? (() => null),
        handleOpenFile: overrides.handleOpenFile ?? vi.fn(),
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
        const handleOpenFile = vi.fn<RendererFileOpenHandler>();
        const utils = createWiring({
            getFileInput: () => input,
            handleOpenFile,
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
        const exactOverrideHandleOpenFile = vi.fn<RendererFileOpenHandler>();
        const suffixOverrideHandleOpenFile = vi.fn<RendererFileOpenHandler>();
        const directHandleOpenFile = vi.fn<RendererFileOpenHandler>();
        const utils = createWiring({
            getFileInput: () => input,
            handleOpenFile: directHandleOpenFile,
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
        expect(directHandleOpenFile).not.toHaveBeenCalled();
    });

    it("uses default-exported handleOpenFile test overrides", () => {
        expect.assertions(2);

        const { file, input } = createFileInput("fileInput");
        const overrideHandleOpenFile = vi.fn<RendererFileOpenHandler>();
        const directHandleOpenFile = vi.fn<RendererFileOpenHandler>();
        const utils = createWiring({
            getFileInput: () => input,
            handleOpenFile: directHandleOpenFile,
            resolveExactRendererCoreTestOverride: (testId) =>
                testId === "../../utils/files/import/handleOpenFile.js"
                    ? { default: { handleOpenFile: overrideHandleOpenFile } }
                    : null,
        });

        utils.registerDelegatedFileInputChangeListener(document, window);
        input.dispatchEvent(new Event("change", { bubbles: true }));

        expect(overrideHandleOpenFile).toHaveBeenCalledExactlyOnceWith(file);
        expect(directHandleOpenFile).not.toHaveBeenCalled();
    });

    it("falls back to the direct handleOpenFile for malformed test overrides", async () => {
        expect.assertions(1);

        const { file, input } = createFileInput("fileInput");
        const handleOpenFile = vi.fn<RendererFileOpenHandler>();
        const utils = createWiring({
            getFileInput: () => input,
            handleOpenFile,
            resolveExactRendererCoreTestOverride: () => "not-a-module",
        });

        utils.registerDelegatedFileInputChangeListener(document, window);
        input.dispatchEvent(new Event("change", { bubbles: true }));
        await flushFileInputHandlers();

        expect(handleOpenFile).toHaveBeenCalledExactlyOnceWith(file);
    });

    it("falls back to the direct handleOpenFile for malformed handler exports", async () => {
        expect.assertions(1);

        const { file, input } = createFileInput("fileInput");
        const handleOpenFile = vi.fn<RendererFileOpenHandler>();
        const utils = createWiring({
            getFileInput: () => input,
            handleOpenFile,
            resolveExactRendererCoreTestOverride: () => ({
                default: { handleOpenFile: "not-a-handler" },
                handleOpenFile: "not-a-handler",
            }),
        });

        utils.registerDelegatedFileInputChangeListener(document, window);
        input.dispatchEvent(new Event("change", { bubbles: true }));
        await flushFileInputHandlers();

        expect(handleOpenFile).toHaveBeenCalledExactlyOnceWith(file);
    });

    it("falls back to the direct handleOpenFile when no test override resolves", async () => {
        expect.assertions(1);

        const { file, input } = createFileInput("fileInput");
        const handleOpenFile = vi.fn<RendererFileOpenHandler>();
        const utils = createWiring({
            getFileInput: () => input,
            handleOpenFile,
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
