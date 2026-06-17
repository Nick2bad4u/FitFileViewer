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

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getLoadSingleOverlayFileRuntime({});

        expect(() => runtime.createAbortController()).toThrow(
            "loadSingleOverlayFile requires an AbortController runtime"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(1);

        const legacyScope = {
            AbortController,
        } as unknown as LoadSingleOverlayFileRuntimeScope;

        expect(() =>
            getLoadSingleOverlayFileRuntime(legacyScope).createAbortController()
        ).toThrow("loadSingleOverlayFile requires an AbortController runtime");
    });
});
