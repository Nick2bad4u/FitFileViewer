import { describe, expect, it, vi } from "vitest";

import { getMapThemeToggleRuntime } from "../../../../../electron-app/utils/theming/specific/mapThemeToggleRuntime.js";

describe("getMapThemeToggleRuntime", () => {
    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        let controllerCount = 0;
        const signal = Symbol("map-theme-toggle-signal");
        class TestAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public constructor() {
                controllerCount += 1;
            }

            public abort(): void {
                /* Test double */
            }
        }
        const runtime = getMapThemeToggleRuntime({
            AbortController: TestAbortController,
        });

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getMapThemeToggleRuntime({});

        expect(() => {
            runtime.createAbortController();
        }).toThrow("mapThemeToggle requires an AbortController runtime");
    });

    it("registers document listeners through the injected document runtime", () => {
        expect.assertions(1);

        const documentRef =
            document.implementation.createHTMLDocument("map theme toggle");
        let changed = false;
        const listener = (): void => {
            changed = true;
        };
        const controller = new AbortController();
        const runtime = getMapThemeToggleRuntime({
            document: documentRef,
        });

        runtime.addDocumentListener("mapThemeChanged", listener, {
            signal: controller.signal,
        });
        documentRef.dispatchEvent(new Event("mapThemeChanged"));
        controller.abort();

        expect(changed).toBe(true);
    });

    it("creates and dispatches map theme change events through scoped runtimes", () => {
        expect.assertions(4);

        const documentRef =
            document.implementation.createHTMLDocument("map theme toggle");
        const runtime = getMapThemeToggleRuntime({
            CustomEvent,
            document: documentRef,
        });
        const listener = vi.fn<(event: Event) => void>();
        const controller = new AbortController();

        documentRef.addEventListener("mapThemeChanged", listener, {
            signal: controller.signal,
        });

        const event = runtime.createMapThemeChangedEvent(
            "mapThemeChanged",
            false
        );

        expect(event).toBeInstanceOf(CustomEvent);
        expect(event).toMatchObject({
            bubbles: true,
            detail: { inverted: false },
            type: "mapThemeChanged",
        });
        expect(runtime.dispatchDocumentEvent(event)).toBe(true);
        expect(listener).toHaveBeenCalledWith(event);
        controller.abort();
    });

    it("fails clearly when event runtimes are unavailable", () => {
        expect.assertions(2);

        expect(() =>
            getMapThemeToggleRuntime({ document }).createMapThemeChangedEvent(
                "mapThemeChanged",
                true
            )
        ).toThrow("mapThemeToggle requires a CustomEvent runtime");
        expect(() =>
            getMapThemeToggleRuntime({ CustomEvent }).dispatchDocumentEvent(
                new Event("mapThemeChanged")
            )
        ).toThrow("mapThemeToggle requires a document runtime");
    });

    it("fails clearly when the document runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getMapThemeToggleRuntime({});
        const controller = new AbortController();

        expect(() => {
            runtime.addDocumentListener("mapThemeChanged", () => undefined, {
                signal: controller.signal,
            });
        }).toThrow("mapThemeToggle requires a document runtime");
        controller.abort();
    });

    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const timeoutMs = Number("50");
        const timer = 19 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const runtime = getMapThemeToggleRuntime({
            clearTimeout,
            setTimeout,
        });

        expect(runtime.setTimeout(callback, timeoutMs)).toBe(timer);
        runtime.clearTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, timeoutMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const runtime = getMapThemeToggleRuntime({});

        expect(() => runtime.setTimeout(() => {}, 1)).toThrow(
            "mapThemeToggle requires a setTimeout runtime"
        );
        expect(() =>
            runtime.clearTimeout(1 as ReturnType<typeof globalThis.setTimeout>)
        ).toThrow("mapThemeToggle requires a clearTimeout runtime");
    });
});
