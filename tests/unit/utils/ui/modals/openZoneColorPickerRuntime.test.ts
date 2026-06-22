import { describe, expect, it, vi } from "vitest";

import type { OpenZoneColorPickerRuntimeScope } from "../../../../../electron-app/utils/ui/modals/openZoneColorPickerRuntime.js";
import { getOpenZoneColorPickerRuntime } from "../../../../../electron-app/utils/ui/modals/openZoneColorPickerRuntime.js";

describe("openZoneColorPickerRuntime", () => {
    it("creates and dispatches custom events through the provided scope", () => {
        expect.assertions(4);

        const dispatchEvent = vi.fn<(event: Event) => boolean>(() => true);
        const runtime = getOpenZoneColorPickerRuntime({
            getCustomEvent: () => CustomEvent,
            getDispatchEvent: () => dispatchEvent,
        });

        const event = runtime.createCustomEvent("ffv:request-render-charts", {
            detail: { reason: "zone-colors-applied" },
        });

        expect(event).toBeInstanceOf(CustomEvent);
        expect(event.detail).toStrictEqual({ reason: "zone-colors-applied" });
        expect(runtime.dispatchEvent(event)).toBe(true);
        expect(dispatchEvent).toHaveBeenCalledWith(event);
    });

    it("creates and dispatches custom events through the default production scope", () => {
        expect.assertions(3);

        const dispatchEvent = vi.spyOn(window, "dispatchEvent");
        const runtime = getOpenZoneColorPickerRuntime();

        const event = runtime.createCustomEvent("ffv:request-render-charts");

        expect(event).toBeInstanceOf(CustomEvent);
        expect(runtime.dispatchEvent(event)).toBe(true);
        expect(dispatchEvent).toHaveBeenCalledWith(event);

        dispatchEvent.mockRestore();
    });

    it("fails clearly when event primitives are unavailable", () => {
        expect.assertions(2);

        expect(() =>
            getOpenZoneColorPickerRuntime({
                getDispatchEvent: () => () => true,
            }).createCustomEvent("ffv:request-render-charts")
        ).toThrow("openZoneColorPicker requires a CustomEvent runtime");
        expect(() =>
            getOpenZoneColorPickerRuntime({
                getCustomEvent: () => CustomEvent,
            }).dispatchEvent(new Event("ffv:request-render-charts"))
        ).toThrow("openZoneColorPicker requires a dispatchEvent runtime");
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(2);

        const legacyScope = {
            CustomEvent,
            dispatchEvent: vi.fn<(event: Event) => boolean>(() => true),
            document,
        } as unknown as OpenZoneColorPickerRuntimeScope;
        const runtime = getOpenZoneColorPickerRuntime(legacyScope);

        expect(() =>
            runtime.createCustomEvent("ffv:request-render-charts")
        ).toThrow("openZoneColorPicker requires a CustomEvent runtime");
        expect(() =>
            runtime.dispatchEvent(new Event("ffv:request-render-charts"))
        ).toThrow("openZoneColorPicker requires a dispatchEvent runtime");
    });
});
