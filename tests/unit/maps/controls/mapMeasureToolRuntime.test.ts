import { describe, expect, it, vi } from "vitest";

import { getMapMeasureToolRuntime } from "../../../../electron-app/utils/maps/controls/mapMeasureToolRuntime.js";

describe("getMapMeasureToolRuntime", () => {
    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        let controllerCount = 0;
        const signal = Symbol("map-measure-tool-signal");
        class TestAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public constructor() {
                controllerCount += 1;
            }

            public abort(): void {
                /* Test double */
            }
        }
        const runtime = getMapMeasureToolRuntime({
            AbortController: TestAbortController,
        });

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getMapMeasureToolRuntime({});

        expect(() => {
            runtime.createAbortController();
        }).toThrow("mapMeasureTool requires an AbortController runtime");
    });

    it("registers and removes document keydown listeners through the injected document", () => {
        expect.assertions(2);

        const eventTarget = new EventTarget();
        const documentRef = {
            addEventListener: eventTarget.addEventListener.bind(eventTarget),
            removeEventListener:
                eventTarget.removeEventListener.bind(eventTarget),
        } as Pick<Document, "addEventListener" | "removeEventListener">;
        const controller = new AbortController();
        let keydownCount = 0;
        let lastKey = "";
        const listener = (event: KeyboardEvent): void => {
            keydownCount += 1;
            lastKey = event.key;
        };
        const runtime = getMapMeasureToolRuntime({ document: documentRef });

        runtime.addDocumentKeydownListener(listener, {
            signal: controller.signal,
        });
        eventTarget.dispatchEvent(new KeyboardEvent("keydown", { key: "m" }));
        runtime.removeDocumentKeydownListener(listener);
        eventTarget.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape" })
        );

        expect(keydownCount).toBe(1);
        expect(lastKey).toBe("m");
    });

    it("fails clearly when the document runtime is unavailable", () => {
        expect.assertions(2);

        const runtime = getMapMeasureToolRuntime({});
        const controller = new AbortController();
        const listener = (): void => undefined;

        expect(() => {
            runtime.addDocumentKeydownListener(listener, {
                signal: controller.signal,
            });
        }).toThrow("mapMeasureTool requires a document runtime");
        expect(() => {
            runtime.removeDocumentKeydownListener(listener);
        }).toThrow("mapMeasureTool requires a document runtime");
        controller.abort();
    });

    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const delayMs = Number("2000");
        const timer = 41 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const runtime = getMapMeasureToolRuntime({
            clearTimeout,
            setTimeout,
        });

        expect(runtime.setTimeout(callback, delayMs)).toBe(timer);
        runtime.clearTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, delayMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const runtime = getMapMeasureToolRuntime({});

        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "mapMeasureTool requires a setTimeout runtime"
        );
        expect(() =>
            runtime.clearTimeout(1 as ReturnType<typeof globalThis.setTimeout>)
        ).toThrow("mapMeasureTool requires a clearTimeout runtime");
    });
});
