import { describe, expect, it, vi } from "vitest";

import { getAddFullScreenButtonRuntime } from "../../../../../electron-app/utils/ui/controls/addFullScreenButtonRuntime.js";

describe("getAddFullScreenButtonRuntime", () => {
    it("routes window and document listeners through injected providers", () => {
        expect.assertions(6);

        const documentEventTarget = new EventTarget();
        const globalEventTarget = new EventTarget();
        const unusedDocumentAddEventListener = vi.fn();
        const unusedDocumentRemoveEventListener = vi.fn();
        const unusedGlobalAddEventListener = vi.fn();
        const unusedGlobalRemoveEventListener = vi.fn();
        const runtime = getAddFullScreenButtonRuntime({
            AbortController,
            documentEventTarget: {
                addEventListener: unusedDocumentAddEventListener,
                removeEventListener: unusedDocumentRemoveEventListener,
            },
            getDocumentEventTarget: () => documentEventTarget,
            getGlobalEventTarget: () => globalEventTarget,
            globalEventTarget: {
                addEventListener: unusedGlobalAddEventListener,
                removeEventListener: unusedGlobalRemoveEventListener,
            },
        });
        const handledEventTypes: string[] = [];
        const listener = (event: Event): void => {
            handledEventTypes.push(event.type);
        };
        const cleanupController = new AbortController();
        const options = { signal: cleanupController.signal };

        runtime.addWindowEventListener("keydown", listener, options);
        runtime.addDocumentEventListener("fullscreenchange", listener, options);

        globalEventTarget.dispatchEvent(new Event("keydown"));
        documentEventTarget.dispatchEvent(new Event("fullscreenchange"));

        expect(handledEventTypes).toStrictEqual([
            "keydown",
            "fullscreenchange",
        ]);
        expect(unusedGlobalAddEventListener).not.toHaveBeenCalled();
        expect(unusedDocumentAddEventListener).not.toHaveBeenCalled();

        runtime.removeWindowEventListener("keydown", listener);
        runtime.removeDocumentEventListener("fullscreenchange", listener);
        globalEventTarget.dispatchEvent(new Event("keydown"));
        documentEventTarget.dispatchEvent(new Event("fullscreenchange"));
        cleanupController.abort();

        expect(handledEventTypes).toStrictEqual([
            "keydown",
            "fullscreenchange",
        ]);
        expect(unusedGlobalRemoveEventListener).not.toHaveBeenCalled();
        expect(unusedDocumentRemoveEventListener).not.toHaveBeenCalled();
    });

    it("ignores missing event targets", () => {
        expect.assertions(1);

        const runtime = getAddFullScreenButtonRuntime({ AbortController });
        const listener = vi.fn();

        expect(() => {
            runtime.addWindowEventListener("keydown", listener);
            runtime.addDocumentEventListener("fullscreenchange", listener);
            runtime.removeWindowEventListener("keydown", listener);
            runtime.removeDocumentEventListener("fullscreenchange", listener);
        }).not.toThrow();
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getAddFullScreenButtonRuntime({
            getAbortController: () =>
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getAddFullScreenButtonRuntime({});

        expect(() => runtime.createAbortController()).toThrow(
            "addFullScreenButton requires an AbortController runtime"
        );
    });
});
