import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getStateManagerDefaultsRuntime,
    type StateManagerDefaultsRuntimeScope,
} from "../../../../../electron-app/utils/state/core/stateManagerDefaultsRuntime.js";

function createRuntimeScope(
    overrides: Partial<StateManagerDefaultsRuntimeScope> = {}
): StateManagerDefaultsRuntimeScope {
    return {
        getDateNow: () => undefined,
        getDocument: () => undefined,
        getPerformance: () => undefined,
        ...overrides,
    };
}

describe("stateManagerDefaultsRuntime", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("prefers performance timing for startup timestamps", () => {
        expect.assertions(1);

        expect(
            getStateManagerDefaultsRuntime(
                createRuntimeScope({
                    getDateNow: () => () => 123,
                    getPerformance: () => ({ now: () => 45.5 }),
                })
            ).getStartTime()
        ).toBe(45.5);
    });

    it("falls back to the provided date clock without performance timing", () => {
        expect.assertions(1);

        expect(
            getStateManagerDefaultsRuntime(
                createRuntimeScope({
                    getDateNow: () => () => 123,
                })
            ).getStartTime()
        ).toBe(123);
    });

    it("does not borrow ambient clocks for explicit scopes", () => {
        expect.assertions(1);

        expect(() =>
            getStateManagerDefaultsRuntime(
                createRuntimeScope({
                    getDateNow: () => undefined,
                    getPerformance: () => undefined,
                })
            ).getStartTime()
        ).toThrow("stateManagerDefaultsRuntime requires a clock");
    });

    it("resolves document titles with the default fallback", () => {
        expect.assertions(3);

        expect(
            getStateManagerDefaultsRuntime(
                createRuntimeScope({
                    getDocument: () => ({ title: "Activity Viewer" }),
                })
            ).getDefaultDocumentTitle()
        ).toBe("Activity Viewer");
        expect(
            getStateManagerDefaultsRuntime(
                createRuntimeScope({
                    getDocument: () => ({ title: "" }),
                })
            ).getDefaultDocumentTitle()
        ).toBe("Fit File Viewer");
        expect(
            getStateManagerDefaultsRuntime(
                createRuntimeScope({
                    getDocument: () => undefined,
                })
            ).getDefaultDocumentTitle()
        ).toBe("Fit File Viewer");
    });

    it("ignores legacy direct document, clock, and performance runtime properties", () => {
        expect.assertions(4);

        const dateNow = vi.fn<() => number>(() => 123);
        const performanceNow = vi.fn<() => number>(() => 45.5);
        const runtime = getStateManagerDefaultsRuntime({
            dateNow,
            document: { title: "Ignored Activity Viewer" },
            performance: { now: performanceNow },
        } as unknown as Parameters<typeof getStateManagerDefaultsRuntime>[0]);

        expect(runtime.getDefaultDocumentTitle).toThrow(
            "stateManagerDefaultsRuntime requires a document provider"
        );
        expect(() => runtime.getStartTime()).toThrow(
            "stateManagerDefaultsRuntime requires a performance provider"
        );
        expect(dateNow).not.toHaveBeenCalled();
        expect(performanceNow).not.toHaveBeenCalled();
    });

    it("fails clearly when explicit scopes omit provider functions", () => {
        expect.assertions(2);

        const runtime = getStateManagerDefaultsRuntime(
            {} as unknown as StateManagerDefaultsRuntimeScope
        );

        expect(runtime.getDefaultDocumentTitle).toThrow(
            "stateManagerDefaultsRuntime requires a document provider"
        );
        expect(() => runtime.getStartTime()).toThrow(
            "stateManagerDefaultsRuntime requires a performance provider"
        );
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

    it("resolves the default date clock when browser performance is unavailable", () => {
        expect.assertions(2);

        const dateNow = vi.spyOn(Date, "now").mockReturnValue(1234);
        const runtime = getStateManagerDefaultsRuntime();

        vi.stubGlobal("performance", undefined);

        expect(runtime.getStartTime()).toBe(1234);
        expect(dateNow).toHaveBeenCalledOnce();
    });
});
