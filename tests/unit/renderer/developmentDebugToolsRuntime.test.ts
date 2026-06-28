import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getRendererDevelopmentDebugToolsRuntime,
    type RendererDevelopmentDebugToolsRuntimeScope,
} from "../../../electron-app/renderer/developmentDebugToolsRuntime.js";

describe("renderer development debug tools runtime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("uses renderer browser runtime providers for production defaults", () => {
        expect.assertions(3);

        vi.stubGlobal("location", { protocol: "fitfileviewer:" });
        vi.stubGlobal("navigator", { language: "en-US" });
        vi.stubGlobal("performance", {
            memory: {
                jsHeapSizeLimit: 30,
                totalJSHeapSize: 20,
                usedJSHeapSize: 10,
            },
        });

        const view = getRendererDevelopmentDebugToolsRuntime();

        expect(view.getLocationSnapshot()).toStrictEqual({
            protocol: "fitfileviewer:",
        });
        expect(view.getNavigatorSnapshot()).toStrictEqual({
            language: "en-US",
        });
        expect(view.getPerformanceMemorySnapshot()).toStrictEqual({
            jsHeapSizeLimit: 30,
            totalJSHeapSize: 20,
            usedJSHeapSize: 10,
        });
    });

    it("reads runtime location, navigator, and memory snapshots from the provided scope", () => {
        expect.assertions(3);

        const view = getRendererDevelopmentDebugToolsRuntime({
            getLocation: () => ({ protocol: "https:" }),
            getNavigator: () => ({
                cookieEnabled: true,
                hardwareConcurrency: 8,
                language: "en-US",
            }),
            getPerformance: () => ({
                memory: {
                    jsHeapSizeLimit: 300,
                    totalJSHeapSize: 200,
                    usedJSHeapSize: 100,
                },
            }),
        });

        expect(view.getLocationSnapshot()).toStrictEqual({
            protocol: "https:",
        });
        expect(view.getNavigatorSnapshot()).toStrictEqual({
            cookieEnabled: true,
            hardwareConcurrency: 8,
            language: "en-US",
        });
        expect(view.getPerformanceMemorySnapshot()).toStrictEqual({
            jsHeapSizeLimit: 300,
            totalJSHeapSize: 200,
            usedJSHeapSize: 100,
        });
    });

    it("returns empty snapshots when runtime metadata is missing", () => {
        expect.assertions(3);

        const view = getRendererDevelopmentDebugToolsRuntime({});

        expect(view.getLocationSnapshot()).toStrictEqual({});
        expect(view.getNavigatorSnapshot()).toStrictEqual({});
        expect(view.getPerformanceMemorySnapshot()).toStrictEqual({});
    });

    it("rejects array-shaped runtime metadata snapshots", () => {
        expect.assertions(3);

        const location = Object.assign([], { protocol: "https:" });
        const navigator = Object.assign([], {
            cookieEnabled: true,
            hardwareConcurrency: 8,
            language: "en-US",
        });
        const performance = {
            memory: Object.assign([], {
                jsHeapSizeLimit: 300,
                totalJSHeapSize: 200,
                usedJSHeapSize: 100,
            }),
        };
        const view = getRendererDevelopmentDebugToolsRuntime({
            getLocation: () => location,
            getNavigator: () => navigator,
            getPerformance: () => performance,
        });

        expect(view.getLocationSnapshot()).toStrictEqual({});
        expect(view.getNavigatorSnapshot()).toStrictEqual({});
        expect(view.getPerformanceMemorySnapshot()).toStrictEqual({});
    });

    it("isolates throwing runtime metadata accessors", () => {
        expect.assertions(3);

        const view = getRendererDevelopmentDebugToolsRuntime({
            getLocation: () => {
                throw new Error("location unavailable");
            },
            getNavigator: () => {
                throw new Error("navigator unavailable");
            },
            getPerformance: () => {
                throw new Error("performance unavailable");
            },
        });

        expect(view.getLocationSnapshot()).toStrictEqual({});
        expect(view.getNavigatorSnapshot()).toStrictEqual({});
        expect(view.getPerformanceMemorySnapshot()).toStrictEqual({});
    });

    it("ignores legacy direct runtime metadata properties", () => {
        expect.assertions(3);

        const scope = {};
        Object.defineProperties(scope, {
            location: {
                get() {
                    throw new Error("location unavailable");
                },
            },
            navigator: {
                get() {
                    throw new Error("navigator unavailable");
                },
            },
            performance: {
                get() {
                    throw new Error("performance unavailable");
                },
            },
        });
        const view = getRendererDevelopmentDebugToolsRuntime(
            scope as RendererDevelopmentDebugToolsRuntimeScope
        );

        expect(view.getLocationSnapshot()).toStrictEqual({});
        expect(view.getNavigatorSnapshot()).toStrictEqual({});
        expect(view.getPerformanceMemorySnapshot()).toStrictEqual({});
    });
});
