import { describe, expect, it, vi } from "vitest";

import { getChartSettingsRenderRuntime } from "../../../../../electron-app/utils/app/initialization/chartSettingsRenderRuntime.js";

describe("chartSettingsRenderRuntime", () => {
    it("uses the global event target by default", () => {
        expect.assertions(1);

        expect(getChartSettingsRenderRuntime()).toStrictEqual({
            eventTarget: globalThis,
        });
    });

    it("centralizes the event target used by chart settings render fallbacks", () => {
        expect.assertions(2);

        const eventTarget = {
            dispatchEvent: vi.fn<(event: Event) => boolean>(() => true),
        };

        const { eventTarget: resolvedEventTarget } =
            getChartSettingsRenderRuntime(eventTarget);
        const event = new Event("ffv:request-render-charts");

        expect(resolvedEventTarget).toBe(eventTarget);
        expect(resolvedEventTarget.dispatchEvent(event)).toBe(true);
    });
});
