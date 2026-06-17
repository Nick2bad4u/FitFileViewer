import { describe, expect, it, vi } from "vitest";

import {
    getMapFullscreenControlRuntime,
    type MapFullscreenControlRuntimeScope,
} from "../../../../electron-app/utils/maps/controls/mapFullscreenControlRuntime.js";

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
            getAbortController: () => TestAbortController,
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
            getDocument: () => documentRef,
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

    it("fails clearly when the document runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getMapFullscreenControlRuntime({});
        const controller = new AbortController();

        expect(() => {
            runtime.addDocumentFullscreenChangeListener(() => undefined, {
                signal: controller.signal,
            });
        }).toThrow("mapFullscreenControl requires a document runtime");
        controller.abort();
    });

    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const delayMs = Number("300");
        const timer = 67 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const runtime = getMapFullscreenControlRuntime({
            getClearTimeout: () => clearTimeout,
            getSetTimeout: () => setTimeout,
        });

        expect(runtime.setTimeout(callback, delayMs)).toBe(timer);
        runtime.clearTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const runtime = getMapFullscreenControlRuntime({});

        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "mapFullscreenControl requires a setTimeout runtime"
        );
        expect(() =>
            runtime.clearTimeout(1 as ReturnType<typeof globalThis.setTimeout>)
        ).toThrow("mapFullscreenControl requires a clearTimeout runtime");
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(4);

        const runtime = getMapFullscreenControlRuntime({
            AbortController: class LegacyAbortController {},
            clearTimeout() {
                throw new Error("legacy clearTimeout should not run");
            },
            document: {
                addEventListener() {
                    throw new Error("legacy document should not run");
                },
            },
            setTimeout() {
                throw new Error("legacy setTimeout should not run");
            },
        } as unknown as MapFullscreenControlRuntimeScope);
        const controller = new AbortController();

        expect(() => runtime.createAbortController()).toThrow(
            "mapFullscreenControl requires an AbortController runtime"
        );
        expect(() => {
            runtime.addDocumentFullscreenChangeListener(() => undefined, {
                signal: controller.signal,
            });
        }).toThrow("mapFullscreenControl requires a document runtime");
        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "mapFullscreenControl requires a setTimeout runtime"
        );
        expect(() =>
            runtime.clearTimeout(1 as ReturnType<typeof globalThis.setTimeout>)
        ).toThrow("mapFullscreenControl requires a clearTimeout runtime");
        controller.abort();
    });
});
