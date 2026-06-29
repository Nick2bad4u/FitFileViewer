import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getRenderChartJSRuntime,
    type RenderChartJSRuntimeScope,
} from "../../../../../electron-app/utils/charts/core/renderChartJSRuntime.js";

const unavailableRenderChartScope = {
    getCustomEventConstructor: () => undefined,
    getDateNow: () => undefined,
    getDocument: () => undefined,
    getIsRendererScope: () => undefined,
    getPerformance: () => undefined,
} satisfies RenderChartJSRuntimeScope;

describe("renderChartJSRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("reads custom events through the scoped constructor runtime", () => {
        expect.assertions(1);

        const utils = getRenderChartJSRuntime({
            ...unavailableRenderChartScope,
            getCustomEventConstructor: () => CustomEvent,
        });

        expect(utils.getCustomEventConstructor()).toBe(CustomEvent);
    });

    it("creates elements through the scoped document runtime", () => {
        expect.assertions(1);

        const documentRef =
            document.implementation.createHTMLDocument("chart runtime");
        const utils = getRenderChartJSRuntime({
            ...unavailableRenderChartScope,
            getDocument: () => documentRef,
        });

        expect(utils.createElement("canvas")).toBeInstanceOf(
            documentRef.defaultView?.HTMLCanvasElement ?? HTMLCanvasElement
        );
    });

    it("does not borrow ambient documents for explicit scopes", () => {
        expect.assertions(1);

        const utils = getRenderChartJSRuntime(unavailableRenderChartScope);

        expect(() => utils.createElement("canvas")).toThrow(
            "renderChartJSRuntime requires document"
        );
    });

    it("does not borrow ambient custom events for explicit scopes", () => {
        expect.assertions(1);

        const utils = getRenderChartJSRuntime(unavailableRenderChartScope);

        expect(utils.getCustomEventConstructor()).toBeUndefined();
    });

    it("reads high-resolution timing through the scoped performance runtime", () => {
        expect.assertions(2);

        const now = vi.fn(() => 42.5),
            utils = getRenderChartJSRuntime({
                ...unavailableRenderChartScope,
                getPerformance: () => ({ now }),
            });

        expect(utils.nowPerformance()).toBe(42.5);
        expect(now).toHaveBeenCalledWith();
    });

    it("falls back to the date clock when performance timing is unavailable", () => {
        expect.assertions(1);

        const utils = getRenderChartJSRuntime({
            ...unavailableRenderChartScope,
            getDateNow: () => () => 1234,
        });

        expect(utils.nowPerformance()).toBe(1234);
    });

    it("reads date timestamps through the scoped date clock", () => {
        expect.assertions(1);

        const utils = getRenderChartJSRuntime({
            ...unavailableRenderChartScope,
            getDateNow: () => () => 5678,
        });

        expect(utils.now()).toBe(5678);
    });

    it("resolves default browser primitives when runtime operations run", () => {
        expect.assertions(8);

        const now = vi.fn(() => 42.5);
        const dateNow = vi.spyOn(Date, "now").mockReturnValue(5678);
        const documentRef =
            document.implementation.createHTMLDocument("chart runtime");
        const utils = getRenderChartJSRuntime();

        vi.stubGlobal("CustomEvent", CustomEvent);
        vi.stubGlobal("document", documentRef);
        vi.stubGlobal("performance", { now });

        expect(utils.getCustomEventConstructor()).toBe(CustomEvent);
        expect(utils.createElement("canvas").ownerDocument).toBe(documentRef);
        expect(utils.isWindowAvailable()).toBe(true);
        expect(utils.nowPerformance()).toBe(42.5);
        expect(utils.now()).toBe(5678);
        expect(now).toHaveBeenCalledOnce();
        expect(now).toHaveBeenCalledWith();
        expect(dateNow).toHaveBeenCalledOnce();
    });

    it("does not borrow ambient date clocks for explicit scopes", () => {
        expect.assertions(2);

        const utils = getRenderChartJSRuntime(unavailableRenderChartScope);

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
                ...unavailableRenderChartScope,
                getIsRendererScope: () => true,
            }).isWindowAvailable()
        ).toBe(true);
        expect(
            getRenderChartJSRuntime(
                unavailableRenderChartScope
            ).isWindowAvailable()
        ).toBe(false);
    });

    it("ignores legacy direct renderer-scope properties", () => {
        expect.assertions(1);

        const utils = getRenderChartJSRuntime({
            ...unavailableRenderChartScope,
            isRendererScope: true,
        } as unknown as Parameters<typeof getRenderChartJSRuntime>[0]);

        expect(utils.isWindowAvailable()).toBe(false);
    });

    it("fails clearly when runtime providers are omitted", () => {
        expect.assertions(5);

        const omittedProviderScope = {} as unknown as RenderChartJSRuntimeScope;
        const utils = getRenderChartJSRuntime(omittedProviderScope);

        expect(() => utils.createElement("canvas")).toThrow(
            "renderChartJSRuntime requires a document provider"
        );
        expect(() => utils.getCustomEventConstructor()).toThrow(
            "renderChartJSRuntime requires a CustomEvent provider"
        );
        expect(() => utils.isWindowAvailable()).toThrow(
            "renderChartJSRuntime requires a renderer-scope provider"
        );
        expect(() => utils.now()).toThrow(
            "renderChartJSRuntime requires a dateNow provider"
        );
        expect(() => utils.nowPerformance()).toThrow(
            "renderChartJSRuntime requires a performance provider"
        );
    });

    it("ignores legacy direct date clock, custom event, and performance properties", () => {
        expect.assertions(5);

        const now = vi.fn(() => 99);
        const dateNow = vi.fn(() => 123);
        const utils = getRenderChartJSRuntime({
            ...unavailableRenderChartScope,
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
