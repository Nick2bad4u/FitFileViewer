import { describe, expect, it, vi } from "vitest";

import { getCreateInlineZoneColorSelectorRuntime } from "../../../../../electron-app/utils/ui/controls/createInlineZoneColorSelectorRuntime.js";

describe("getCreateInlineZoneColorSelectorRuntime", () => {
    it("creates elements and exposes document body through the injected document", () => {
        expect.assertions(3);

        const runtime = getCreateInlineZoneColorSelectorRuntime({ document });
        const container = runtime.createElement("div");
        const select = runtime.createElement("select");

        expect(container).toBeInstanceOf(HTMLDivElement);
        expect(select).toBeInstanceOf(HTMLSelectElement);
        expect(runtime.getBody()).toBe(document.body);
    });

    it("creates custom events and dispatches through the injected target", () => {
        expect.assertions(3);

        const dispatchEvent = vi.fn<(event: Event) => boolean>(() => true);
        const runtime = getCreateInlineZoneColorSelectorRuntime({
            CustomEvent,
            dispatchEvent,
            document,
        });
        const event = runtime.createCustomEvent("fieldToggleChanged", {
            detail: { field: "hr_zone" },
        });

        expect(runtime.dispatchEvent(event)).toBe(true);
        expect(dispatchEvent).toHaveBeenCalledWith(event);
        expect(event.detail).toStrictEqual({ field: "hr_zone" });
    });

    it("creates custom events and dispatches through the injected document window", () => {
        expect.assertions(2);

        const dispatchEvent = vi.spyOn(window, "dispatchEvent");
        const runtime = getCreateInlineZoneColorSelectorRuntime({ document });
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
            AbortController,
            HTMLElement,
            HTMLInputElement,
            HTMLSelectElement,
            document,
        });
        const controller = runtime.createAbortController();
        const input = document.createElement("input");
        const select = document.createElement("select");

        expect(controller.signal.aborted).toBe(false);
        expect(runtime.isHTMLElement(input)).toBe(true);
        expect(runtime.isHTMLInputElement(input)).toBe(true);
        expect(runtime.isHTMLSelectElement(select)).toBe(true);
    });

    it("schedules timers through the injected timer function", () => {
        expect.assertions(2);

        const timer = Symbol("timer") as unknown as ReturnType<
            typeof setTimeout
        >;
        const timeoutMs = Number("25");
        const handler = vi.fn<() => void>();
        const setTimeoutMock = vi.fn<typeof setTimeout>(() => timer);
        const runtime = getCreateInlineZoneColorSelectorRuntime({
            document,
            setTimeout: setTimeoutMock,
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
                AbortController:
                    "AbortController" as unknown as typeof AbortController,
                document,
            });
        const runtimeWithInvalidCustomEvent =
            getCreateInlineZoneColorSelectorRuntime({
                CustomEvent: "CustomEvent" as unknown as typeof CustomEvent,
                document,
            });
        const runtimeWithInvalidElement =
            getCreateInlineZoneColorSelectorRuntime({
                HTMLElement: "HTMLElement" as unknown as typeof HTMLElement,
                document,
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
});
