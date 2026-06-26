import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getLoadSingleOverlayFileRuntime,
    type LoadSingleOverlayFileRuntimeScope,
} from "../../../../../electron-app/utils/files/import/loadSingleOverlayFileRuntime.js";
import type {
    BrowserAbortControllerConstructor,
    BrowserFileReaderConstructor,
    BrowserResponseConstructor,
} from "../../../../../electron-app/utils/runtime/browserRuntime.js";

describe("getLoadSingleOverlayFileRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getLoadSingleOverlayFileRuntime({
            getAbortController: () =>
                AbortControllerConstructor as unknown as BrowserAbortControllerConstructor,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const runtime = getLoadSingleOverlayFileRuntime();

        expect(runtime.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("creates file readers through the injected runtime", () => {
        expect.assertions(2);

        const reader = new FileReader();
        const FileReaderConstructor = vi.fn(function FakeFileReader() {
            return reader;
        });
        const runtime = getLoadSingleOverlayFileRuntime({
            getFileReader: () =>
                FileReaderConstructor as unknown as BrowserFileReaderConstructor,
        });

        expect(runtime.createFileReader()).toBe(reader);
        expect(FileReaderConstructor).toHaveBeenCalledOnce();
    });

    it("uses browser runtime providers for production FileReader and Response defaults", async () => {
        expect.assertions(5);

        const reader = new FileReader();
        const FileReaderConstructor = vi.fn(function FakeFileReader() {
            return reader;
        });
        const arrayBuffer = new ArrayBuffer(8);
        const ResponseConstructor = vi.fn(function FakeResponse(file: Blob) {
            return {
                arrayBuffer: async () => arrayBuffer,
                file,
            };
        });
        const blob = new Blob(["overlay"]);

        vi.stubGlobal("FileReader", FileReaderConstructor);
        vi.stubGlobal("Response", ResponseConstructor);

        const runtime = getLoadSingleOverlayFileRuntime();

        expect(runtime.createFileReader()).toBe(reader);
        expect(FileReaderConstructor).toHaveBeenCalledOnce();
        await expect(
            runtime.readBlobArrayBufferWithResponse(blob)
        ).resolves.toBe(arrayBuffer);
        expect(ResponseConstructor).toHaveBeenCalledWith(blob);
        expect(ResponseConstructor).toHaveBeenCalledOnce();
    });

    it("reads blob data through the injected Response runtime", async () => {
        expect.assertions(2);

        const arrayBuffer = new ArrayBuffer(8);
        const ResponseConstructor = vi.fn(function FakeResponse() {
            return {
                arrayBuffer: async () => arrayBuffer,
            };
        });
        const runtime = getLoadSingleOverlayFileRuntime({
            getResponse: () =>
                ResponseConstructor as unknown as BrowserResponseConstructor,
        });

        await expect(
            runtime.readBlobArrayBufferWithResponse(new Blob())
        ).resolves.toBe(arrayBuffer);
        expect(ResponseConstructor).toHaveBeenCalledOnce();
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getLoadSingleOverlayFileRuntime({});

        expect(() => runtime.createAbortController()).toThrow(
            "loadSingleOverlayFile requires an AbortController runtime"
        );
    });

    it("fails clearly when the FileReader runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getLoadSingleOverlayFileRuntime({});

        expect(() => runtime.createFileReader()).toThrow(
            "loadSingleOverlayFile requires a FileReader runtime"
        );
    });

    it("skips Response reads when the Response runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getLoadSingleOverlayFileRuntime({});

        expect(runtime.readBlobArrayBufferWithResponse(new Blob())).toBe(
            undefined
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(3);

        const legacyScope = {
            AbortController,
            FileReader,
            Response,
        } as unknown as LoadSingleOverlayFileRuntimeScope;
        const runtime = getLoadSingleOverlayFileRuntime(legacyScope);

        expect(() => runtime.createAbortController()).toThrow(
            "loadSingleOverlayFile requires an AbortController runtime"
        );
        expect(() => runtime.createFileReader()).toThrow(
            "loadSingleOverlayFile requires a FileReader runtime"
        );
        expect(runtime.readBlobArrayBufferWithResponse(new Blob())).toBe(
            undefined
        );
    });
});
