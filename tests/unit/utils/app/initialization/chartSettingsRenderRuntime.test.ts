/* eslint-disable testing-library/render-result-naming-convention -- This suite tests a chart render runtime factory, not Testing Library render output. */
import { describe, expect, it, vi } from "vitest";

import { getChartSettingsRenderRuntime } from "../../../../../electron-app/utils/app/initialization/chartSettingsRenderRuntime.js";

describe("chartSettingsRenderRuntime", () => {
    it("uses the global event target by default", () => {
        expect.assertions(1);

        expect(getChartSettingsRenderRuntime().eventTarget).toBe(globalThis);
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

    it("creates chart render-request events through the scoped runtime", () => {
        expect.assertions(3);

        const chartSettingsApi = getChartSettingsRenderRuntime({
            CustomEvent,
            dispatchEvent: vi.fn<(event: Event) => boolean>(() => true),
        });

        const requestMessage =
            chartSettingsApi.createRenderRequestEvent("settings-reset");

        expect(requestMessage).toBeInstanceOf(CustomEvent);
        expect(requestMessage.type).toBe("ffv:request-render-charts");
        expect(requestMessage.detail).toStrictEqual({
            reason: "settings-reset",
        });
    });

    it("fails clearly when render-request event construction is unavailable", () => {
        expect.assertions(1);

        expect(() =>
            getChartSettingsRenderRuntime({
                dispatchEvent: vi.fn<(event: Event) => boolean>(() => true),
            }).createRenderRequestEvent("settings-reset")
        ).toThrow("chartSettingsRender requires a CustomEvent runtime");
    });
});
/* eslint-enable testing-library/render-result-naming-convention */
