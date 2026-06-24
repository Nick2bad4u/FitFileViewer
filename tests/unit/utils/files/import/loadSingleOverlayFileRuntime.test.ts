import { describe, expect, it, vi } from "vitest";

import {
    getLoadSingleOverlayFileRuntime,
    type LoadSingleOverlayFileRuntimeScope,
} from "../../../../../electron-app/utils/files/import/loadSingleOverlayFileRuntime.js";

describe("getLoadSingleOverlayFileRuntime", () => {
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
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("creates file readers through the injected runtime", () => {
        expect.assertions(2);

        const reader = new FileReader();
        const FileReaderConstructor = vi.fn(function FakeFileReader() {
            return reader;
        });
        const runtime = getLoadSingleOverlayFileRuntime({
            getFileReader: () =>
                FileReaderConstructor as unknown as typeof FileReader,
        });

        expect(runtime.createFileReader()).toBe(reader);
        expect(FileReaderConstructor).toHaveBeenCalledOnce();
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
                ResponseConstructor as unknown as typeof Response,
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
