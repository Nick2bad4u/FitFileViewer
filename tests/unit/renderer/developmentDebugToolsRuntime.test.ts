import { describe, expect, it } from "vitest";

import {
    getRendererDevelopmentDebugToolsRuntime,
    type RendererDevelopmentDebugToolsRuntimeScope,
} from "../../../electron-app/renderer/developmentDebugToolsRuntime.js";

describe("renderer development debug tools runtime", () => {
    it("reads runtime location, navigator, and memory records from the provided scope", () => {
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

        expect(view.getLocationRecord()).toStrictEqual({
            protocol: "https:",
        });
        expect(view.getNavigatorRecord()).toMatchObject({
            cookieEnabled: true,
            hardwareConcurrency: 8,
            language: "en-US",
        });
        expect(view.getPerformanceMemoryRecord()).toStrictEqual({
            jsHeapSizeLimit: 300,
            totalJSHeapSize: 200,
            usedJSHeapSize: 100,
        });
    });

    it("returns empty records when runtime metadata is missing", () => {
        expect.assertions(3);

        const view = getRendererDevelopmentDebugToolsRuntime({});

        expect(view.getLocationRecord()).toStrictEqual({});
        expect(view.getNavigatorRecord()).toStrictEqual({});
        expect(view.getPerformanceMemoryRecord()).toStrictEqual({});
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

        expect(view.getLocationRecord()).toStrictEqual({});
        expect(view.getNavigatorRecord()).toStrictEqual({});
        expect(view.getPerformanceMemoryRecord()).toStrictEqual({});
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

        expect(view.getLocationRecord()).toStrictEqual({});
        expect(view.getNavigatorRecord()).toStrictEqual({});
        expect(view.getPerformanceMemoryRecord()).toStrictEqual({});
    });
});
