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
                performance: { now: () => 45.5 },
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
                document: { title: "Activity Viewer" },
            }).getDefaultDocumentTitle()
        ).toBe("Activity Viewer");
        expect(
            getStateManagerDefaultsRuntime({
                document: { title: "" },
            }).getDefaultDocumentTitle()
        ).toBe("Fit File Viewer");
        expect(
            getStateManagerDefaultsRuntime({}).getDefaultDocumentTitle()
        ).toBe("Fit File Viewer");
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
