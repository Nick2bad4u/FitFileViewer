import { describe, expect, it, vi } from "vitest";

import { beginChartDataRenderContext } from "../../../../../electron-app/utils/charts/core/renderChartDataContext.js";

type BeginContextDependencies = Parameters<
    typeof beginChartDataRenderContext
>[0];

function createDependencies(
    overrides: Partial<BeginContextDependencies> = {}
): BeginContextDependencies {
    const createElement = vi.fn<(tagName: string) => HTMLElement>((tagName) =>
        document.createElement(tagName)
    );

    return {
        doc: { createElement } as Pick<Document, "createElement">,
        isChartDebugEnabled: vi.fn<() => boolean>(() => true),
        isDevelopmentEnvironment: vi.fn<() => boolean>(() => true),
        isTestEnvironment: vi.fn<() => boolean>(() => false),
        nowPerformance: vi.fn<() => number>(() => 42.25),
        ...overrides,
    };
}

describe(beginChartDataRenderContext, () => {
    it("captures default render flags and validates DOM creation", () => {
        expect.assertions(2);

        const dependencies = createDependencies();

        expect(beginChartDataRenderContext(dependencies, {})).toStrictEqual({
            isDebugLoggingEnabled: true,
            isTestRuntime: false,
            renderStartTime: 42.25,
            skipControls: false,
            skipTabAbort: false,
        });
        expect(dependencies.doc.createElement).toHaveBeenCalledWith("div");
    });

    it("normalizes caller render options through legacy truthiness", () => {
        expect.assertions(1);

        const dependencies = createDependencies({
            isChartDebugEnabled: vi.fn<() => boolean>(() => false),
            isTestEnvironment: vi.fn<() => boolean>(() => true),
        });

        expect(
            beginChartDataRenderContext(dependencies, {
                skipControls: "yes",
                skipTabAbort: 1,
            })
        ).toMatchObject({
            isDebugLoggingEnabled: false,
            isTestRuntime: true,
            skipControls: true,
            skipTabAbort: true,
        });
    });

    it("uses safe defaults when options are not objects", () => {
        expect.assertions(1);

        const dependencies = createDependencies({
            isDevelopmentEnvironment: vi.fn<() => boolean>(() => false),
        });

        expect(beginChartDataRenderContext(dependencies, null)).toMatchObject({
            isDebugLoggingEnabled: false,
            skipControls: false,
            skipTabAbort: false,
        });
    });

    it("propagates DOM preflight failures before reading environment flags", () => {
        expect.assertions(2);

        const expectedError = new Error("DOM unavailable");
        const dependencies = createDependencies({
            doc: {
                createElement: vi.fn<(tagName: string) => HTMLElement>(() => {
                    throw expectedError;
                }) as Document["createElement"],
            },
            isDevelopmentEnvironment: vi.fn<() => boolean>(() => true),
        });

        expect(() => beginChartDataRenderContext(dependencies, {})).toThrow(
            expectedError
        );
        expect(dependencies.isDevelopmentEnvironment).not.toHaveBeenCalled();
    });
});
