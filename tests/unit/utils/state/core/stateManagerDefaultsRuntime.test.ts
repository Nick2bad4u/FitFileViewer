import { afterEach, describe, expect, it, vi } from "vitest";

import { getStateManagerDefaultsRuntime } from "../../../../../electron-app/utils/state/core/stateManagerDefaultsRuntime.js";

describe("stateManagerDefaultsRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("prefers performance timing for startup timestamps", () => {
        expect.assertions(1);

        expect(
            getStateManagerDefaultsRuntime({
                dateNow: () => 123,
                getPerformance: () => ({ now: () => 45.5 }),
            }).getStartTime()
        ).toBe(45.5);
    });

    it("falls back to the provided date clock without performance timing", () => {
        expect.assertions(1);

        expect(
            getStateManagerDefaultsRuntime({
                dateNow: () => 123,
            }).getStartTime()
        ).toBe(123);
    });

    it("does not borrow ambient clocks for explicit scopes", () => {
        expect.assertions(1);

        expect(() => getStateManagerDefaultsRuntime({}).getStartTime()).toThrow(
            "stateManagerDefaultsRuntime requires a clock"
        );
    });

    it("resolves document titles with the default fallback", () => {
        expect.assertions(3);

        expect(
            getStateManagerDefaultsRuntime({
                getDocument: () => ({ title: "Activity Viewer" }),
            }).getDefaultDocumentTitle()
        ).toBe("Activity Viewer");
        expect(
            getStateManagerDefaultsRuntime({
                getDocument: () => ({ title: "" }),
            }).getDefaultDocumentTitle()
        ).toBe("Fit File Viewer");
        expect(
            getStateManagerDefaultsRuntime({}).getDefaultDocumentTitle()
        ).toBe("Fit File Viewer");
    });

    it("ignores legacy direct document and performance runtime properties", () => {
        expect.assertions(3);

        const performanceNow = vi.fn<() => number>(() => 45.5);
        const runtime = getStateManagerDefaultsRuntime({
            dateNow: () => 123,
            document: { title: "Ignored Activity Viewer" },
            performance: { now: performanceNow },
        } as unknown as Parameters<typeof getStateManagerDefaultsRuntime>[0]);

        expect(runtime.getDefaultDocumentTitle()).toBe("Fit File Viewer");
        expect(runtime.getStartTime()).toBe(123);
        expect(performanceNow).not.toHaveBeenCalled();
    });

    it("resolves default document and performance when runtime operations run", () => {
        expect.assertions(3);

        const document = { title: "Late Activity Viewer" };
        const performance = {
            now: vi.fn<() => number>(() => 77.25),
        };
        const runtime = getStateManagerDefaultsRuntime();

        vi.stubGlobal("document", document);
        vi.stubGlobal("performance", performance);

        expect(runtime.getDefaultDocumentTitle()).toBe("Late Activity Viewer");
        expect(runtime.getStartTime()).toBe(77.25);
        expect(performance.now).toHaveBeenCalledOnce();
    });
});
