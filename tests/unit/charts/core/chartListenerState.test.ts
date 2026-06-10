import { afterEach, describe, expect, it } from "vitest";

import {
    abortSharedConfigurationListener,
    isChartRequestListenerRegistered,
    isSharedConfigurationListenerRegistered,
    registerChartRequestListenerController,
    registerSharedConfigurationListenerController,
    resetChartListenerStateForTests,
} from "../../../../electron-app/utils/charts/core/chartListenerState.js";

describe("chartListenerState", () => {
    afterEach(() => {
        resetChartListenerStateForTests();
    });

    it("tracks chart request listener registration and aborts stale signals", () => {
        expect.assertions(4);

        const firstSignal = registerChartRequestListenerController();

        expect(isChartRequestListenerRegistered()).toBe(true);
        expect(firstSignal.aborted).toBe(false);

        const secondSignal = registerChartRequestListenerController();

        expect(firstSignal.aborted).toBe(true);
        expect(secondSignal.aborted).toBe(false);
    });

    it("tracks shared configuration listener registration and aborts on disposal", () => {
        expect.assertions(4);

        const signal = registerSharedConfigurationListenerController();

        expect(isSharedConfigurationListenerRegistered()).toBe(true);
        expect(signal.aborted).toBe(false);

        abortSharedConfigurationListener();

        expect(isSharedConfigurationListenerRegistered()).toBe(false);
        expect(signal.aborted).toBe(true);
    });

    it("resets both listener states for tests", () => {
        expect.assertions(4);

        const chartRequestSignal = registerChartRequestListenerController();
        const sharedConfigurationSignal =
            registerSharedConfigurationListenerController();

        resetChartListenerStateForTests();

        expect(isChartRequestListenerRegistered()).toBe(false);
        expect(isSharedConfigurationListenerRegistered()).toBe(false);
        expect(chartRequestSignal.aborted).toBe(true);
        expect(sharedConfigurationSignal.aborted).toBe(true);
    });
});
