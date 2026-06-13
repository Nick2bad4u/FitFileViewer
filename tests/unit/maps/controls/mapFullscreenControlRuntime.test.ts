import { describe, expect, it, vi } from "vitest";

import { getMapFullscreenControlRuntime } from "../../../../electron-app/utils/maps/controls/mapFullscreenControlRuntime.js";

describe("getMapFullscreenControlRuntime", () => {
    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        let controllerCount = 0;
        const signal = Symbol("map-fullscreen-control-signal");
        class TestAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public constructor() {
                controllerCount += 1;
            }

            public abort(): void {
                /* Test double */
            }
        }
        const runtime = getMapFullscreenControlRuntime({
            AbortController: TestAbortController,
        });

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getMapFullscreenControlRuntime({});

        expect(() => {
            runtime.createAbortController();
        }).toThrow("mapFullscreenControl requires an AbortController runtime");
    });

    it("registers document fullscreenchange listeners through the injected document", () => {
        expect.assertions(2);

        const eventTarget = new EventTarget();
        const documentRef = {
            addEventListener: eventTarget.addEventListener.bind(eventTarget),
        } as Pick<Document, "addEventListener">;
        const controller = new AbortController();
        let eventCount = 0;
        const listener = (): void => {
            eventCount += 1;
        };
        const runtime = getMapFullscreenControlRuntime({
            document: documentRef,
        });

        runtime.addDocumentFullscreenChangeListener(listener, {
            signal: controller.signal,
        });
        eventTarget.dispatchEvent(new Event("fullscreenchange"));
        controller.abort();
        eventTarget.dispatchEvent(new Event("fullscreenchange"));

        expect(eventCount).toBe(1);
        expect(controller.signal.aborted).toBe(true);
    });

    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const delayMs = Number("300");
        const timer = 67 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const runtime = getMapFullscreenControlRuntime({
            clearTimeout,
            setTimeout,
        });

        expect(runtime.setTimeout(callback, delayMs)).toBe(timer);
        runtime.clearTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });
});
