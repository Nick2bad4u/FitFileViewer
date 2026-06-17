// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

import {
    getRenderChartRequestListenerRuntime as getChartRequestListenerRuntime,
    type RenderChartRequestListenerRuntimeScope,
} from "../../../../../electron-app/utils/charts/core/renderChartRequestListenerRuntime.js";

function cleanupFixture(): void {
    document.body.replaceChildren();
    vi.restoreAllMocks();
}

describe("getRenderChartRequestListenerRuntime", () => {
    it("registers chart request listeners through the injected event target", () => {
        expect.assertions(2);

        const abortController = new AbortController();
        const addEventListener =
            vi.fn<
                (
                    type: string,
                    listener: EventListenerOrEventListenerObject,
                    options?: AddEventListenerOptions | boolean
                ) => void
            >();

        try {
            getChartRequestListenerRuntime({
                getAddEventListener: () => addEventListener,
            }).addChartRequestListener(() => undefined, {
                signal: abortController.signal,
            });

            expect(addEventListener).toHaveBeenCalledWith(
                "ffv:request-render-charts",
                expect.any(Function),
                { signal: abortController.signal }
            );
            expect(abortController.signal.aborted).toBe(false);
        } finally {
            abortController.abort();
        }
    });

    it("resolves fallback chart containers from the injected document", () => {
        expect.assertions(2);

        try {
            const contentContainer = document.createElement("section");
            contentContainer.id = "content_chartjs";
            document.body.append(contentContainer);

            expect(
                getChartRequestListenerRuntime({
                    getDocument: () => document,
                    getHTMLElement: () => HTMLElement,
                }).getFallbackChartContainer()
            ).toBe(contentContainer);

            const chartJsContainer = document.createElement("section");
            chartJsContainer.id = "chartjs_chart_container";
            document.body.prepend(chartJsContainer);

            expect(
                getChartRequestListenerRuntime({
                    getDocument: () => document,
                    getHTMLElement: () => HTMLElement,
                }).getFallbackChartContainer()
            ).toBe(chartJsContainer);
        } finally {
            cleanupFixture();
        }
    });

    it("falls back to document body and checks custom events through injected constructors", () => {
        expect.assertions(3);

        try {
            const runtime = getChartRequestListenerRuntime({
                getCustomEvent: () => CustomEvent,
                getDocument: () => document,
                getHTMLElement: () => HTMLElement,
            });

            expect(runtime.getFallbackChartContainer()).toBe(document.body);
            expect(
                runtime.isCustomEvent(
                    new CustomEvent("ffv:request-render-charts")
                )
            ).toBe(true);
            expect(
                runtime.isCustomEvent(new Event("ffv:request-render-charts"))
            ).toBe(false);
        } finally {
            cleanupFixture();
        }
    });

    it("does not borrow ambient constructors for explicit scopes", () => {
        expect.assertions(2);

        const minimalDocument = {
            body: document.body,
            querySelector: vi.fn<() => Element | null>(() => document.body),
        } as unknown as Document;

        const runtime = getChartRequestListenerRuntime({
            getDocument: () => minimalDocument,
        });

        expect(
            runtime.isCustomEvent(new CustomEvent("ffv:request-render-charts"))
        ).toBe(false);
        expect(runtime.querySelector("body")).toBeNull();
    });

    it("fails clearly when fallback container lookup has no document", () => {
        expect.assertions(2);

        const abortController = new AbortController();

        expect(() =>
            getChartRequestListenerRuntime({}).getFallbackChartContainer()
        ).toThrow("renderChartRequestListener requires a document");
        expect(() =>
            getChartRequestListenerRuntime({}).addChartRequestListener(
                () => undefined,
                { signal: abortController.signal }
            )
        ).toThrow("renderChartRequestListener requires addEventListener");
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(4);

        const addEventListener = vi.fn();
        const abortController = new AbortController();

        try {
            const runtime = getChartRequestListenerRuntime({
                addEventListener,
                CustomEvent,
                document,
                HTMLElement,
            } as unknown as RenderChartRequestListenerRuntimeScope);

            expect(() =>
                runtime.addChartRequestListener(() => undefined, {
                    signal: abortController.signal,
                })
            ).toThrow("renderChartRequestListener requires addEventListener");
            expect(() => runtime.getFallbackChartContainer()).toThrow(
                "renderChartRequestListener requires a document"
            );
            expect(
                runtime.isCustomEvent(
                    new CustomEvent("ffv:request-render-charts")
                )
            ).toBe(false);
            expect(() => runtime.querySelector("body")).toThrow(
                "renderChartRequestListener requires a document"
            );
        } finally {
            abortController.abort();
            cleanupFixture();
        }
    });
});
