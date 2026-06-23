import { describe, expect, it, vi } from "vitest";

import {
    getShownFilesListRuntime,
    type ShownFilesListRuntimeScope,
} from "../../../../electron-app/utils/rendering/components/shownFilesListRuntime.js";

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
            getAbortController: () => TestAbortController,
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

    it("registers body themechange listeners through the injected document runtime", () => {
        expect.assertions(1);

        const documentRef =
            document.implementation.createHTMLDocument("shown files");
        let themeApplied = false;
        const listener = (): void => {
            themeApplied = true;
        };
        const controller = new AbortController();
        const runtime = getShownFilesListRuntime({
            getDocument: () => documentRef,
        });

        runtime.addBodyThemeChangeListener(listener, {
            signal: controller.signal,
        });
        documentRef.body.dispatchEvent(new Event("themechange"));
        controller.abort();

        expect(themeApplied).toBe(true);
    });

    it("fails clearly when the document body runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getShownFilesListRuntime({});
        const controller = new AbortController();

        expect(() => {
            runtime.addBodyThemeChangeListener(() => undefined, {
                signal: controller.signal,
            });
        }).toThrow("shownFilesList requires a document body runtime");
        controller.abort();
    });

    it("creates, appends, and queries elements through the injected document runtime", () => {
        expect.assertions(4);

        const documentRef =
            document.implementation.createHTMLDocument("shown files");
        const runtime = getShownFilesListRuntime({
            getDocument: () => documentRef,
        });

        const tooltip = runtime.createElement("div");
        tooltip.className = "overlay-filename-tooltip";
        runtime.appendToBody(tooltip);

        expect(tooltip).toBeInstanceOf(HTMLDivElement);
        expect(documentRef.body.contains(tooltip)).toBe(true);
        expect(
            Array.from(runtime.querySelectorAll(".overlay-filename-tooltip"))
        ).toStrictEqual([tooltip]);
        expect(Array.from(runtime.querySelectorAll(".missing"))).toStrictEqual(
            []
        );
    });

    it("does not borrow ambient documents for explicit DOM scopes", () => {
        expect.assertions(3);

        const runtime = getShownFilesListRuntime({});

        expect(() => runtime.createElement("div")).toThrow(
            "shownFilesList requires a document runtime"
        );
        expect(() =>
            runtime.appendToBody(document.createElement("div"))
        ).toThrow("shownFilesList requires a document runtime");
        expect(() =>
            runtime.querySelectorAll(".overlay-filename-tooltip")
        ).toThrow("shownFilesList requires a document runtime");
    });

    it("registers mousemove listeners through the injected runtime scope", () => {
        expect.assertions(3);

        let registeredListener: ((event: MouseEvent) => void) | null = null;
        let registeredOptions:
            | Readonly<AddEventListenerOptions>
            | boolean
            | undefined;
        let registeredType: string | null = null;
        const listener = vi.fn<(event: MouseEvent) => void>();
        const controller = new AbortController();
        const eventTarget = {
            addEventListener(
                type: "mousemove",
                eventListener: (event: Readonly<MouseEvent>) => void,
                options?: Readonly<AddEventListenerOptions> | boolean
            ): void {
                registeredType = type;
                registeredListener = eventListener;
                registeredOptions = options;
            },
        };
        const runtime = getShownFilesListRuntime({
            getEventTarget: () => eventTarget,
        });

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

    it("fails clearly when the mousemove listener runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getShownFilesListRuntime({});
        const controller = new AbortController();

        expect(() => {
            runtime.addMouseMoveListener(() => undefined, {
                signal: controller.signal,
            });
        }).toThrow("shownFilesList requires an event target runtime");
        controller.abort();
    });

    it("reads viewport dimensions through the injected runtime scope", () => {
        expect.assertions(1);

        const runtime = getShownFilesListRuntime({
            getViewport: () => ({
                height: 600,
                width: 800,
            }),
        });

        expect(runtime.getViewport()).toStrictEqual({
            height: 600,
            width: 800,
        });
    });

    it("does not borrow ambient viewport dimensions for explicit scopes", () => {
        expect.assertions(1);

        const runtime = getShownFilesListRuntime({});

        expect(() => runtime.getViewport()).toThrow(
            "shownFilesList requires a viewport runtime"
        );
    });

    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const timeoutMs = Number("350");
        const timer = 23 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const runtime = getShownFilesListRuntime({
            getClearTimeout: () => clearTimeout,
            getSetTimeout: () => setTimeout,
        });

        expect(runtime.setTimeout(callback, timeoutMs)).toBe(timer);
        runtime.clearTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, timeoutMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const runtime = getShownFilesListRuntime({});

        expect(() => runtime.setTimeout(() => {}, 0)).toThrow(
            "shownFilesList requires a setTimeout runtime"
        );
        expect(() => runtime.clearTimeout(0)).toThrow(
            "shownFilesList requires a clearTimeout runtime"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(9);

        const TestAbortController = vi.fn(function TestAbortController() {
            return new AbortController();
        });
        const addEventListener = vi.fn();
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const setTimeout = vi.fn<typeof globalThis.setTimeout>();
        const legacyScope = {
            AbortController:
                TestAbortController as unknown as typeof AbortController,
            addEventListener,
            clearTimeout,
            document,
            innerHeight: 600,
            innerWidth: 800,
            setTimeout,
        } as unknown as ShownFilesListRuntimeScope;
        const runtime = getShownFilesListRuntime(legacyScope);
        const controller = new AbortController();

        expect(() => runtime.createAbortController()).toThrow(
            "shownFilesList requires an AbortController runtime"
        );
        expect(() =>
            runtime.addBodyThemeChangeListener(() => undefined, {
                signal: controller.signal,
            })
        ).toThrow("shownFilesList requires a document body runtime");
        expect(() => runtime.createElement("div")).toThrow(
            "shownFilesList requires a document runtime"
        );
        expect(() =>
            runtime.appendToBody(document.createElement("div"))
        ).toThrow("shownFilesList requires a document runtime");
        expect(() =>
            runtime.querySelectorAll(".overlay-filename-tooltip")
        ).toThrow("shownFilesList requires a document runtime");
        expect(() =>
            runtime.addMouseMoveListener(() => undefined, {
                signal: controller.signal,
            })
        ).toThrow("shownFilesList requires an event target runtime");
        expect(() => runtime.getViewport()).toThrow(
            "shownFilesList requires a viewport runtime"
        );
        expect(() => runtime.setTimeout(() => undefined, 0)).toThrow(
            "shownFilesList requires a setTimeout runtime"
        );
        expect(() => runtime.clearTimeout(0)).toThrow(
            "shownFilesList requires a clearTimeout runtime"
        );
    });
});
