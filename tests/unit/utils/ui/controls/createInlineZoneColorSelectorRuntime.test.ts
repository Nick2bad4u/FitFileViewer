import { afterEach, describe, expect, it, vi } from "vitest";

import type {
    CreateInlineZoneColorSelectorRuntimeScope,
    CreateInlineZoneColorSelectorTimerHandle,
} from "../../../../../electron-app/utils/ui/controls/createInlineZoneColorSelectorRuntime.js";
import { getCreateInlineZoneColorSelectorRuntime } from "../../../../../electron-app/utils/ui/controls/createInlineZoneColorSelectorRuntime.js";
import type {
    BrowserAbortControllerConstructor,
    BrowserCustomEventConstructor,
    BrowserDispatchEvent,
    BrowserHTMLElementConstructor,
    BrowserSetTimeout,
} from "../../../../../electron-app/utils/runtime/browserRuntime.js";

describe("getCreateInlineZoneColorSelectorRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("creates elements and exposes document body through the injected document", () => {
        expect.assertions(3);

        const runtime = getCreateInlineZoneColorSelectorRuntime({
            getDocument: () => document,
        });
        const container = runtime.createElement("div");
        const select = runtime.createElement("select");

        expect(container).toBeInstanceOf(HTMLDivElement);
        expect(select).toBeInstanceOf(HTMLSelectElement);
        expect(runtime.getBody()).toBe(document.body);
    });

    it("creates custom events and dispatches through the injected target", () => {
        expect.assertions(3);

        const dispatchEvent = vi.fn<BrowserDispatchEvent>(() => true);
        const runtime = getCreateInlineZoneColorSelectorRuntime({
            getCustomEvent: () => CustomEvent,
            getDispatchEvent: () => dispatchEvent,
        });
        const event = runtime.createCustomEvent("fieldToggleChanged", {
            detail: { field: "hr_zone" },
        });

        expect(runtime.dispatchEvent(event)).toBe(true);
        expect(dispatchEvent).toHaveBeenCalledWith(event);
        expect(event.detail).toStrictEqual({ field: "hr_zone" });
    });

    it("creates custom events and dispatches through the default production scope", () => {
        expect.assertions(2);

        const dispatchEvent = vi.spyOn(window, "dispatchEvent");
        const runtime = getCreateInlineZoneColorSelectorRuntime();
        const event = runtime.createCustomEvent("fieldToggleChanged", {
            detail: { field: "power_zone" },
        });

        expect(runtime.dispatchEvent(event)).toBe(true);
        expect(dispatchEvent).toHaveBeenCalledWith(event);

        dispatchEvent.mockRestore();
    });

    it("creates abort controllers and checks element types through injected runtimes", () => {
        expect.assertions(4);

        const runtime = getCreateInlineZoneColorSelectorRuntime({
            getAbortController: () => AbortController,
            getDocument: () => document,
            getHTMLElement: () => HTMLElement,
            getHTMLInputElement: () => HTMLInputElement,
            getHTMLSelectElement: () => HTMLSelectElement,
        });
        const controller = runtime.createAbortController();
        const input = document.createElement("input");
        const select = document.createElement("select");

        expect(controller.signal.aborted).toBe(false);
        expect(runtime.isHTMLElement(input)).toBe(true);
        expect(runtime.isHTMLInputElement(input)).toBe(true);
        expect(runtime.isHTMLSelectElement(select)).toBe(true);
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const runtime = getCreateInlineZoneColorSelectorRuntime();

        expect(runtime.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("uses browser runtime providers for production DOM, event, and timer defaults", () => {
        expect.assertions(11);

        const timer = Symbol(
            "inline-zone-default-timer"
        ) as CreateInlineZoneColorSelectorTimerHandle;
        const timeoutMs = Number("35");
        const handler = vi.fn<() => void>();
        const dispatchEvent = vi.fn<BrowserDispatchEvent>(() => true);
        const setTimeoutMock = vi.fn<BrowserSetTimeout>(() => timer);
        vi.stubGlobal("dispatchEvent", dispatchEvent);
        vi.stubGlobal("setTimeout", setTimeoutMock);
        const runtime = getCreateInlineZoneColorSelectorRuntime();
        const event = runtime.createCustomEvent("fieldToggleChanged", {
            detail: { field: "power_zone" },
        });
        const input = runtime.createElement("input");
        const select = runtime.createElement("select");

        expect(runtime.getBody()).toBe(document.body);
        expect(runtime.isHTMLElement(input)).toBe(true);
        expect(runtime.isHTMLInputElement(input)).toBe(true);
        expect(runtime.isHTMLSelectElement(select)).toBe(true);
        expect(event.detail).toStrictEqual({ field: "power_zone" });
        expect(runtime.dispatchEvent(event)).toBe(true);
        expect(dispatchEvent).toHaveBeenCalledWith(event);
        expect(runtime.setTimeout(handler, timeoutMs)).toBe(timer);
        expect(setTimeoutMock).toHaveBeenCalledWith(handler, timeoutMs);
        expect(handler).not.toHaveBeenCalled();
        expect(runtime.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("schedules timers through the injected timer function", () => {
        expect.assertions(2);

        const timer = Symbol(
            "timer"
        ) as unknown as CreateInlineZoneColorSelectorTimerHandle;
        const timeoutMs = Number("25");
        const handler = vi.fn<() => void>();
        const setTimeoutMock = vi.fn<BrowserSetTimeout>(() => timer);
        const runtime = getCreateInlineZoneColorSelectorRuntime({
            getSetTimeout: () => setTimeoutMock,
        });

        expect(runtime.setTimeout(handler, timeoutMs)).toBe(timer);
        expect(setTimeoutMock).toHaveBeenCalledWith(handler, timeoutMs);
    });

    it("throws when timer scheduling is unavailable", () => {
        expect.assertions(1);

        const runtime = getCreateInlineZoneColorSelectorRuntime({});

        expect(() => runtime.setTimeout(vi.fn(), 1)).toThrow(
            "createInlineZoneColorSelector requires a setTimeout runtime"
        );
    });

    it("fails clearly when required runtimes are unavailable", () => {
        expect.assertions(7);

        const runtime = getCreateInlineZoneColorSelectorRuntime({});
        const runtimeWithInvalidAbortController =
            getCreateInlineZoneColorSelectorRuntime({
                getAbortController: () =>
                    "AbortController" as unknown as BrowserAbortControllerConstructor,
            });
        const runtimeWithInvalidCustomEvent =
            getCreateInlineZoneColorSelectorRuntime({
                getCustomEvent: () =>
                    "CustomEvent" as unknown as BrowserCustomEventConstructor,
            });
        const runtimeWithInvalidElement =
            getCreateInlineZoneColorSelectorRuntime({
                getHTMLElement: () =>
                    "HTMLElement" as unknown as BrowserHTMLElementConstructor,
            });

        expect(() => runtime.createElement("div")).toThrow(
            "createInlineZoneColorSelector requires a document runtime"
        );
        expect(() =>
            runtimeWithInvalidAbortController.createAbortController()
        ).toThrow(
            "createInlineZoneColorSelector requires an AbortController runtime"
        );
        expect(() =>
            runtimeWithInvalidCustomEvent.createCustomEvent("event")
        ).toThrow(
            "createInlineZoneColorSelector requires a CustomEvent runtime"
        );
        expect(() =>
            runtimeWithInvalidElement.isHTMLElement(
                document.createElement("div")
            )
        ).toThrow(
            "createInlineZoneColorSelector requires an HTMLElement runtime"
        );
        expect(() => runtime.createAbortController()).toThrow(
            "createInlineZoneColorSelector requires an AbortController runtime"
        );
        expect(() => runtime.createCustomEvent("event")).toThrow(
            "createInlineZoneColorSelector requires a CustomEvent runtime"
        );
        expect(() =>
            runtime.dispatchEvent(new Event("fieldToggleChanged"))
        ).toThrow(
            "createInlineZoneColorSelector requires a dispatchEvent runtime"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(8);

        const timer = Symbol(
            "inline-zone-timer"
        ) as unknown as CreateInlineZoneColorSelectorTimerHandle;
        const legacyScope = {
            AbortController,
            CustomEvent,
            dispatchEvent: vi.fn<(event: Event) => boolean>(() => true),
            document,
            HTMLElement,
            HTMLInputElement,
            HTMLSelectElement,
            setTimeout: vi.fn<BrowserSetTimeout>(() => timer),
        } as unknown as CreateInlineZoneColorSelectorRuntimeScope;
        const runtime = getCreateInlineZoneColorSelectorRuntime(legacyScope);

        expect(() => runtime.createElement("div")).toThrow(
            "createInlineZoneColorSelector requires a document runtime"
        );
        expect(() => runtime.createAbortController()).toThrow(
            "createInlineZoneColorSelector requires an AbortController runtime"
        );
        expect(() => runtime.createCustomEvent("event")).toThrow(
            "createInlineZoneColorSelector requires a CustomEvent runtime"
        );
        expect(() =>
            runtime.dispatchEvent(new Event("fieldToggleChanged"))
        ).toThrow(
            "createInlineZoneColorSelector requires a dispatchEvent runtime"
        );
        expect(() =>
            runtime.isHTMLElement(document.createElement("div"))
        ).toThrow(
            "createInlineZoneColorSelector requires an HTMLElement runtime"
        );
        expect(() =>
            runtime.isHTMLInputElement(document.createElement("input"))
        ).toThrow(
            "createInlineZoneColorSelector requires an HTMLInputElement runtime"
        );
        expect(() =>
            runtime.isHTMLSelectElement(document.createElement("select"))
        ).toThrow(
            "createInlineZoneColorSelector requires an HTMLSelectElement runtime"
        );
        expect(() => runtime.setTimeout(vi.fn(), 1)).toThrow(
            "createInlineZoneColorSelector requires a setTimeout runtime"
        );
    });
});
