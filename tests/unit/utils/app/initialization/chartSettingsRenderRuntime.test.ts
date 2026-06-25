/* eslint-disable testing-library/render-result-naming-convention -- This suite tests a chart render runtime factory, not Testing Library render output. */
import { describe, expect, it, vi } from "vitest";

import {
    getChartSettingsRenderRuntime,
    type ChartSettingsRenderRuntimeScope,
} from "../../../../../electron-app/utils/app/initialization/chartSettingsRenderRuntime.js";

describe("chartSettingsRenderRuntime", () => {
    it("uses the global event target by default", () => {
        expect.assertions(1);

        expect(getChartSettingsRenderRuntime().eventTarget).toBe(globalThis);
    });

    it("resolves production document and render-request events through browser runtime providers", () => {
        expect.assertions(4);

        const chartSettingsApi = getChartSettingsRenderRuntime(),
            requestMessage =
                chartSettingsApi.createRenderRequestEvent("settings-reset");

        expect(chartSettingsApi.documentRef).toBe(document);
        expect(requestMessage).toBeInstanceOf(CustomEvent);
        expect(requestMessage.type).toBe("ffv:request-render-charts");
        expect(requestMessage.detail).toStrictEqual({
            reason: "settings-reset",
        });
    });

    it("resolves documents through the scoped runtime", () => {
        expect.assertions(2);

        const documentRef =
            document.implementation.createHTMLDocument("chart settings");
        const getDocument = vi.fn(() => documentRef);
        const chartSettingsApi = getChartSettingsRenderRuntime({
            getDocument,
        });

        expect(chartSettingsApi.documentRef).toBe(documentRef);
        expect(getDocument).toHaveBeenCalledOnce();
    });

    it("centralizes the event target used by chart settings render fallbacks", () => {
        expect.assertions(2);

        const eventTarget = {
            dispatchEvent: vi.fn<(event: Event) => boolean>(() => true),
        };

        const { eventTarget: resolvedEventTarget } =
            getChartSettingsRenderRuntime({
                getEventTarget: () => eventTarget,
            });
        const event = new Event("ffv:request-render-charts");

        expect(resolvedEventTarget).toBe(eventTarget);
        expect(resolvedEventTarget.dispatchEvent(event)).toBe(true);
    });

    it("creates chart render-request events through the scoped runtime", () => {
        expect.assertions(3);

        const chartSettingsApi = getChartSettingsRenderRuntime({
            getCustomEvent: () => CustomEvent,
            getEventTarget: () => ({
                dispatchEvent: vi.fn<(event: Event) => boolean>(() => true),
            }),
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
                getEventTarget: () => ({
                    dispatchEvent: vi.fn<(event: Event) => boolean>(() => true),
                }),
            }).createRenderRequestEvent("settings-reset")
        ).toThrow("chartSettingsRender requires a CustomEvent runtime");
    });

    it("fails clearly when event target access is unavailable", () => {
        expect.assertions(1);

        expect(() => getChartSettingsRenderRuntime({}).eventTarget).toThrow(
            "chartSettingsRender requires an event target runtime"
        );
    });

    it("fails clearly when document access is unavailable", () => {
        expect.assertions(1);

        expect(() => getChartSettingsRenderRuntime({}).documentRef).toThrow(
            "chartSettingsRender requires a document runtime"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(3);

        const legacyScope = {
            CustomEvent,
            document: document.implementation.createHTMLDocument(
                "legacy chart settings"
            ),
            dispatchEvent: vi.fn<(event: Event) => boolean>(() => true),
        } as unknown as ChartSettingsRenderRuntimeScope;
        const chartSettingsApi = getChartSettingsRenderRuntime(legacyScope);

        expect(() =>
            chartSettingsApi.createRenderRequestEvent("settings-reset")
        ).toThrow("chartSettingsRender requires a CustomEvent runtime");
        expect(() => chartSettingsApi.documentRef).toThrow(
            "chartSettingsRender requires a document runtime"
        );
        expect(() => chartSettingsApi.eventTarget).toThrow(
            "chartSettingsRender requires an event target runtime"
        );
    });
});
/* eslint-enable testing-library/render-result-naming-convention */
