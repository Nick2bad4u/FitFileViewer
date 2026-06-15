import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    areRendererChartControlsVisible,
    ensureRendererChartControlsVisibleState,
    markRendererChartControlsInitialized,
    normalizeRendererChartControlsVisible,
    setRendererChartControlsVisible,
    subscribeToRendererChartControlsVisible as subscribeToChartControlsVisible,
    subscribeToRendererChartControlsVisibleState as subscribeToChartControlsVisibleState,
    toggleRendererChartControlsVisible,
    toggleRendererChartControlsVisibleFromStoredState,
} from "../../../../../electron-app/utils/state/domain/rendererChartControlsState.js";

describe("rendererChartControlsState", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
    });

    it("defaults controls visibility to visible and initializes missing state", () => {
        expect.assertions(3);

        expect(areRendererChartControlsVisible()).toBe(true);

        ensureRendererChartControlsVisibleState({ source: "test" });

        expect(stateManager.getState("charts.controlsVisible")).toBe(true);
        expect(areRendererChartControlsVisible()).toBe(true);
    });

    it("sets and toggles controls visibility through typed helpers", () => {
        expect.assertions(4);

        setRendererChartControlsVisible(false, { source: "test" });

        expect(areRendererChartControlsVisible()).toBe(false);
        expect(toggleRendererChartControlsVisible({ source: "test" })).toBe(
            true
        );
        expect(toggleRendererChartControlsVisible({ source: "test" })).toBe(
            false
        );
        expect(areRendererChartControlsVisible()).toBe(false);
    });

    it("toggles from the stored boolean for legacy UI control behavior", () => {
        expect.assertions(4);

        stateManager.setState("charts.controlsVisible", undefined, {
            source: "test",
        });

        expect(toggleRendererChartControlsVisibleFromStoredState()).toBe(true);
        expect(areRendererChartControlsVisible()).toBe(true);

        expect(toggleRendererChartControlsVisibleFromStoredState()).toBe(false);
        expect(areRendererChartControlsVisible()).toBe(false);
    });

    it("records the initialized chart controls wrapper", () => {
        expect.assertions(1);

        markRendererChartControlsInitialized("chartjs-settings-wrapper", {
            source: "test",
        });

        expect(stateManager.getState("charts")).toMatchObject({
            controlsInitialized: true,
            controlsWrapper: "chartjs-settings-wrapper",
        });
    });

    it("subscribes with normalized controls visibility values", () => {
        expect.assertions(2);

        const values: boolean[] = [];
        const unsubscribe = subscribeToChartControlsVisible((visible) =>
            values.push(visible)
        );

        setRendererChartControlsVisible(false, { source: "test" });
        stateManager.setState("charts.controlsVisible", undefined, {
            source: "test",
        });

        expect(values).toEqual([false, true]);

        unsubscribe();
        setRendererChartControlsVisible(false, { source: "test" });
        expect(values).toEqual([false, true]);
    });

    it("subscribes with raw controls visibility values", () => {
        expect.assertions(1);

        const values: unknown[] = [];
        const unsubscribe = subscribeToChartControlsVisibleState(
            (visible) => values.push(visible)
        );

        stateManager.setState("charts.controlsVisible", undefined, {
            source: "test",
        });
        setRendererChartControlsVisible(false, { source: "test" });
        unsubscribe();

        expect(values).toEqual([undefined, false]);
    });

    it("normalizes controls visibility values", () => {
        expect.assertions(3);

        expect(normalizeRendererChartControlsVisible(false)).toBe(false);
        expect(normalizeRendererChartControlsVisible(true)).toBe(true);
        expect(normalizeRendererChartControlsVisible(undefined)).toBe(true);
    });
});
