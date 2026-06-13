import { describe, expect, it, vi } from "vitest";

import { getShownFilesListRuntime } from "../../../../electron-app/utils/rendering/components/shownFilesListRuntime.js";

describe("getShownFilesListRuntime", () => {
    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        let controllerCount = 0;
        const signal = Symbol("shown-files-list-signal");
        class TestAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public constructor() {
                controllerCount += 1;
            }

            public abort(): void {
                /* Test double */
            }
        }
        const runtime = getShownFilesListRuntime({
            AbortController: TestAbortController,
        });

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getShownFilesListRuntime({});

        expect(() => {
            runtime.createAbortController();
        }).toThrow("shownFilesList requires an AbortController runtime");
    });

    it("registers mousemove listeners through the injected runtime scope", () => {
        expect.assertions(3);

        let registeredListener: ((event: MouseEvent) => void) | null = null;
        let registeredOptions: AddEventListenerOptions | boolean | undefined;
        let registeredType: string | null = null;
        const listener = vi.fn<(event: MouseEvent) => void>();
        const controller = new AbortController();
        const addEventListener: NonNullable<
            Parameters<typeof getShownFilesListRuntime>[0]
        >["addEventListener"] = (type, eventListener, options): void => {
            registeredType = type;
            registeredListener = eventListener;
            registeredOptions = options;
        };
        const runtime = getShownFilesListRuntime({ addEventListener });

        runtime.addMouseMoveListener(listener, { signal: controller.signal });
        const event = new MouseEvent("mousemove", {
            clientX: 12,
            clientY: 24,
        });
        registeredListener?.(event);
        controller.abort();

        expect(registeredType).toBe("mousemove");
        expect(registeredOptions).toStrictEqual({
            signal: controller.signal,
        });
        expect(listener).toHaveBeenCalledWith(event);
    });

    it("reads viewport dimensions through the injected runtime scope", () => {
        expect.assertions(1);

        const runtime = getShownFilesListRuntime({
            innerHeight: 600,
            innerWidth: 800,
        });

        expect(runtime.getViewport()).toStrictEqual({
            height: 600,
            width: 800,
        });
    });

    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const timeoutMs = Number("350");
        const timer = 23 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const runtime = getShownFilesListRuntime({
            clearTimeout,
            setTimeout,
        });

        expect(runtime.setTimeout(callback, timeoutMs)).toBe(timer);
        runtime.clearTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, timeoutMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });
});
