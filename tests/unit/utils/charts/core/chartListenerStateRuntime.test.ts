import { describe, expect, it } from "vitest";

import {
    getChartListenerStateRuntime,
    type ChartListenerStateRuntimeScope,
} from "../../../../../electron-app/utils/charts/core/chartListenerStateRuntime.js";
import type { BrowserAbortControllerConstructor } from "../../../../../electron-app/utils/runtime/browserRuntime.js";

const unavailableChartListenerStateScope = {
    getAbortController: () => undefined,
} satisfies ChartListenerStateRuntimeScope;

describe("getChartListenerStateRuntime", () => {
    it("uses browser runtime providers for production defaults", () => {
        expect.assertions(1);

        const utils = getChartListenerStateRuntime();

        expect(utils.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("creates abort controllers through the injected constructor", () => {
        expect.assertions(2);

        const controller = getChartListenerStateRuntime({
            getAbortController: () => AbortController,
        }).createAbortController();

        expect(controller).toBeInstanceOf(AbortController);
        expect(controller.signal.aborted).toBe(false);
    });

    it("fails clearly when AbortController is unavailable", () => {
        expect.assertions(1);

        expect(() =>
            getChartListenerStateRuntime({
                getAbortController: () =>
                    "AbortController" as unknown as BrowserAbortControllerConstructor,
            }).createAbortController()
        ).toThrow("chartListenerState requires an AbortController");
    });

    it("does not borrow the ambient AbortController for explicit scopes", () => {
        expect.assertions(1);

        expect(() =>
            getChartListenerStateRuntime(
                unavailableChartListenerStateScope
            ).createAbortController()
        ).toThrow("chartListenerState requires an AbortController");
    });

    it("fails clearly when runtime providers are omitted", () => {
        expect.assertions(1);

        expect(() =>
            getChartListenerStateRuntime(
                {} as unknown as ChartListenerStateRuntimeScope
            ).createAbortController()
        ).toThrow("chartListenerState requires an AbortController provider");
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(1);

        const legacyScope = {
            ...unavailableChartListenerStateScope,
            AbortController,
        } as unknown as ChartListenerStateRuntimeScope;

        expect(() =>
            getChartListenerStateRuntime(legacyScope).createAbortController()
        ).toThrow("chartListenerState requires an AbortController");
    });
});
