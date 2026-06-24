import { afterEach, describe, expect, it, vi } from "vitest";

import { getRenderChartJSRuntime } from "../../../../../electron-app/utils/charts/core/renderChartJSRuntime.js";

describe("renderChartJSRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("reads custom events through the scoped constructor runtime", () => {
        expect.assertions(1);

        const utils = getRenderChartJSRuntime({
            getCustomEventConstructor: () => CustomEvent,
        });

        expect(utils.getCustomEventConstructor()).toBe(CustomEvent);
    });

    it("creates elements through the scoped document runtime", () => {
        expect.assertions(1);

        const documentRef =
            document.implementation.createHTMLDocument("chart runtime");
        const utils = getRenderChartJSRuntime({
            getDocument: () => documentRef,
        });

        expect(utils.createElement("canvas")).toBeInstanceOf(
            documentRef.defaultView?.HTMLCanvasElement ?? HTMLCanvasElement
        );
    });

    it("does not borrow ambient documents for explicit scopes", () => {
        expect.assertions(1);

        const utils = getRenderChartJSRuntime({});

        expect(() => utils.createElement("canvas")).toThrow(
            "renderChartJSRuntime requires document"
        );
    });

    it("does not borrow ambient custom events for explicit scopes", () => {
        expect.assertions(1);

        const utils = getRenderChartJSRuntime({});

        expect(utils.getCustomEventConstructor()).toBeUndefined();
    });

    it("reads high-resolution timing through the scoped performance runtime", () => {
        expect.assertions(2);

        const now = vi.fn(() => 42.5),
            utils = getRenderChartJSRuntime({
                getPerformance: () => ({ now }),
            });

        expect(utils.nowPerformance()).toBe(42.5);
        expect(now).toHaveBeenCalledWith();
    });

    it("falls back to the date clock when performance timing is unavailable", () => {
        expect.assertions(1);

        const utils = getRenderChartJSRuntime({
            getDateNow: () => () => 1234,
        });

        expect(utils.nowPerformance()).toBe(1234);
    });

    it("reads date timestamps through the scoped date clock", () => {
        expect.assertions(1);

        const utils = getRenderChartJSRuntime({
            getDateNow: () => () => 5678,
        });

        expect(utils.now()).toBe(5678);
    });

    it("resolves default browser primitives when runtime operations run", () => {
        expect.assertions(6);

        const now = vi.fn(() => 42.5);
        const utils = getRenderChartJSRuntime();

        vi.stubGlobal("CustomEvent", CustomEvent);
        vi.stubGlobal("document", document);
        vi.stubGlobal("performance", { now });

        expect(utils.getCustomEventConstructor()).toBe(CustomEvent);
        expect(utils.createElement("canvas")).toBeInstanceOf(
            HTMLCanvasElement
        );
        expect(utils.isWindowAvailable()).toBe(true);
        expect(utils.nowPerformance()).toBe(42.5);
        expect(now).toHaveBeenCalledOnce();
        expect(now).toHaveBeenCalledWith();
    });

    it("does not borrow ambient date clocks for explicit scopes", () => {
        expect.assertions(2);

        const utils = getRenderChartJSRuntime({});

        expect(() => utils.now()).toThrow(
            "renderChartJSRuntime requires dateNow"
        );
        expect(() => utils.nowPerformance()).toThrow(
            "renderChartJSRuntime requires dateNow"
        );
    });

    it("reports renderer availability through the scoped runtime", () => {
        expect.assertions(2);

        expect(
            getRenderChartJSRuntime({
                getIsRendererScope: () => true,
            }).isWindowAvailable()
        ).toBe(true);
        expect(getRenderChartJSRuntime({}).isWindowAvailable()).toBe(false);
    });

    it("ignores legacy direct renderer-scope properties", () => {
        expect.assertions(1);

        const utils = getRenderChartJSRuntime({
            isRendererScope: true,
        } as unknown as Parameters<typeof getRenderChartJSRuntime>[0]);

        expect(utils.isWindowAvailable()).toBe(false);
    });

    it("ignores legacy direct date clock, custom event, and performance properties", () => {
        expect.assertions(5);

        const now = vi.fn(() => 99);
        const dateNow = vi.fn(() => 123);
        const utils = getRenderChartJSRuntime({
            CustomEventConstructor: CustomEvent,
            dateNow,
            document,
            performance: { now },
        } as unknown as Parameters<typeof getRenderChartJSRuntime>[0]);

        expect(() => utils.createElement("canvas")).toThrow(
            "renderChartJSRuntime requires document"
        );
        expect(utils.getCustomEventConstructor()).toBeUndefined();
        expect(() => utils.nowPerformance()).toThrow(
            "renderChartJSRuntime requires dateNow"
        );
        expect(dateNow).not.toHaveBeenCalled();
        expect(now).not.toHaveBeenCalled();
    });
});
