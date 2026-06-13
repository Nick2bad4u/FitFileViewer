import { describe, expect, it, vi } from "vitest";

import { getQuickColorSwitcherRuntime } from "../../../../electron-app/utils/ui/quickColorSwitcherRuntime.js";

describe("getQuickColorSwitcherRuntime", () => {
    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        let controllerCount = 0;
        const signal = Symbol("quick-color-switcher-signal");
        class TestAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public constructor() {
                controllerCount += 1;
            }

            public abort(): void {
                /* Test double */
            }
        }
        const runtime = getQuickColorSwitcherRuntime({
            AbortController: TestAbortController,
        });

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getQuickColorSwitcherRuntime({});

        expect(() => {
            runtime.createAbortController();
        }).toThrow(
            "quickColorSwitcher requires an AbortController runtime"
        );
    });

    it("registers document click listeners through the injected document runtime", () => {
        expect.assertions(1);

        const documentRef =
            document.implementation.createHTMLDocument("quick color switcher");
        let clicked = false;
        const listener = (): void => {
            clicked = true;
        };
        const controller = new AbortController();
        const runtime = getQuickColorSwitcherRuntime({
            document: documentRef,
        });

        runtime.addDocumentClickListener(listener, {
            signal: controller.signal,
        });
        documentRef.dispatchEvent(new Event("click"));
        controller.abort();

        expect(clicked).toBe(true);
    });

    it("fails clearly when the document runtime is unavailable", () => {
        expect.assertions(1);

        const utils = getQuickColorSwitcherRuntime({});
        const controller = new AbortController();

        expect(() => {
            utils.addDocumentClickListener(() => undefined, {
                signal: controller.signal,
            });
        }).toThrow("quickColorSwitcher requires a document runtime");
        controller.abort();
    });

    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const timeoutMs = Number("500");
        const timer = 37 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const runtime = getQuickColorSwitcherRuntime({
            clearTimeout,
            setTimeout,
        });

        expect(runtime.setTimeout(callback, timeoutMs)).toBe(timer);
        runtime.clearTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, timeoutMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });
});
