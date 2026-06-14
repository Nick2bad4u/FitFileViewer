import { describe, expect, it, vi } from "vitest";

import { getAddFullScreenButtonRuntime } from "../../../../../electron-app/utils/ui/controls/addFullScreenButtonRuntime.js";

describe("getAddFullScreenButtonRuntime", () => {
    it("routes window and document listeners through injected targets", () => {
        expect.assertions(2);

        const documentTarget = new EventTarget();
        const windowTarget = new EventTarget();
        const runtime = getAddFullScreenButtonRuntime({
            AbortController,
            documentTarget,
            windowTarget,
        });
        const handledEventTypes: string[] = [];
        const listener = (event: Event): void => {
            handledEventTypes.push(event.type);
        };
        const cleanupController = new AbortController();
        const options = { signal: cleanupController.signal };

        runtime.addWindowEventListener("keydown", listener, options);
        runtime.addDocumentEventListener("fullscreenchange", listener, options);

        windowTarget.dispatchEvent(new Event("keydown"));
        documentTarget.dispatchEvent(new Event("fullscreenchange"));

        expect(handledEventTypes).toStrictEqual([
            "keydown",
            "fullscreenchange",
        ]);

        runtime.removeWindowEventListener("keydown", listener);
        runtime.removeDocumentEventListener("fullscreenchange", listener);
        windowTarget.dispatchEvent(new Event("keydown"));
        documentTarget.dispatchEvent(new Event("fullscreenchange"));
        cleanupController.abort();

        expect(handledEventTypes).toStrictEqual([
            "keydown",
            "fullscreenchange",
        ]);
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
            AbortController:
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
