import { describe, expect, it, vi } from "vitest";

import { getFileBrowserTabRuntime } from "../../../../../electron-app/utils/ui/browser/fileBrowserTabRuntime.js";

describe("getFileBrowserTabRuntime", () => {
    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getFileBrowserTabRuntime({
            getAbortController: () =>
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getFileBrowserTabRuntime({});

        expect(() => runtime.createAbortController()).toThrow(
            "fileBrowserTab requires an AbortController runtime"
        );
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(2);

        const AbortControllerConstructor = vi.fn();
        const runtime = getFileBrowserTabRuntime({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
        } as unknown as Parameters<typeof getFileBrowserTabRuntime>[0]);

        expect(() => runtime.createAbortController()).toThrow(
            "fileBrowserTab requires an AbortController runtime"
        );
        expect(AbortControllerConstructor).not.toHaveBeenCalled();
    });
});
