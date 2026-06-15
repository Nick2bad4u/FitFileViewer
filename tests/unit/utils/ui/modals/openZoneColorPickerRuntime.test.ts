import { describe, expect, it, vi } from "vitest";

import { getOpenZoneColorPickerRuntime } from "../../../../../electron-app/utils/ui/modals/openZoneColorPickerRuntime.js";

describe("openZoneColorPickerRuntime", () => {
    it("creates and dispatches custom events through the provided scope", () => {
        expect.assertions(4);

        const dispatchEvent = vi.fn<(event: Event) => boolean>(() => true);
        const runtime = getOpenZoneColorPickerRuntime({
            CustomEvent,
            dispatchEvent,
        });

        const event = runtime.createCustomEvent("ffv:request-render-charts", {
            detail: { reason: "zone-colors-applied" },
        });

        expect(event).toBeInstanceOf(CustomEvent);
        expect(event.detail).toStrictEqual({ reason: "zone-colors-applied" });
        expect(runtime.dispatchEvent(event)).toBe(true);
        expect(dispatchEvent).toHaveBeenCalledWith(event);
    });

    it("resolves browser constructors from the document default view", () => {
        expect.assertions(2);

        const dispatchEvent = vi.fn<(event: Event) => boolean>(() => true);
        const runtime = getOpenZoneColorPickerRuntime({
            document,
            dispatchEvent,
        });

        const event = runtime.createCustomEvent("ffv:request-render-charts");

        expect(event).toBeInstanceOf(CustomEvent);
        expect(runtime.dispatchEvent(event)).toBe(true);
    });

    it("fails clearly when event primitives are unavailable", () => {
        expect.assertions(2);

        expect(() =>
            getOpenZoneColorPickerRuntime({
                dispatchEvent: () => true,
            }).createCustomEvent("ffv:request-render-charts")
        ).toThrow("openZoneColorPicker requires a CustomEvent runtime");
        expect(() =>
            getOpenZoneColorPickerRuntime({ CustomEvent }).dispatchEvent(
                new Event("ffv:request-render-charts")
            )
        ).toThrow("openZoneColorPicker requires a dispatchEvent runtime");
    });
});
