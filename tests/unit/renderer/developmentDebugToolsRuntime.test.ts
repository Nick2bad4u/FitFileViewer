import { describe, expect, it } from "vitest";

import { getRendererDevelopmentDebugToolsRuntime } from "../../../electron-app/renderer/developmentDebugToolsRuntime.js";

describe("renderer development debug tools runtime", () => {
    it("reads runtime location, navigator, and memory records from the provided scope", () => {
        expect.assertions(3);

        const view = getRendererDevelopmentDebugToolsRuntime({
            location: { protocol: "https:" },
            navigator: {
                cookieEnabled: true,
                hardwareConcurrency: 8,
                language: "en-US",
            },
            performance: {
                memory: {
                    jsHeapSizeLimit: 300,
                    totalJSHeapSize: 200,
                    usedJSHeapSize: 100,
                },
            },
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
        const view = getRendererDevelopmentDebugToolsRuntime(scope);

        expect(view.getLocationRecord()).toStrictEqual({});
        expect(view.getNavigatorRecord()).toStrictEqual({});
        expect(view.getPerformanceMemoryRecord()).toStrictEqual({});
    });
});
