import { describe, expect, it } from "vitest";

import { getChartListenerStateRuntime } from "../../../../../electron-app/utils/charts/core/chartListenerStateRuntime.js";

describe("getChartListenerStateRuntime", () => {
    it("creates abort controllers through the injected constructor", () => {
        expect.assertions(2);

        const controller = getChartListenerStateRuntime({
            AbortController,
        }).createAbortController();

        expect(controller).toBeInstanceOf(AbortController);
        expect(controller.signal.aborted).toBe(false);
    });

    it("fails clearly when AbortController is unavailable", () => {
        expect.assertions(1);

        expect(() =>
            getChartListenerStateRuntime({
                AbortController:
                    "AbortController" as unknown as typeof AbortController,
            }).createAbortController()
        ).toThrow("chartListenerState requires an AbortController");
    });

    it("does not borrow the ambient AbortController for explicit scopes", () => {
        expect.assertions(1);

        expect(() =>
            getChartListenerStateRuntime({}).createAbortController()
        ).toThrow("chartListenerState requires an AbortController");
    });
});
