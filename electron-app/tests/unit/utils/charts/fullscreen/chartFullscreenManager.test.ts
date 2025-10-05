/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import {
    enterChartFullscreen,
    exitChartFullscreen,
    isChartFullscreenActive,
    toggleChartFullscreen,
    subscribeToChartFullscreen,
} from "../../../../../utils/charts/fullscreen/chartFullscreenManager.js";

const getOverlay = () => document.querySelector<HTMLElement>("#chart-fullscreen-overlay");

describe("chartFullscreenManager", () => {
    beforeEach(() => {
        exitChartFullscreen();
        document.body.className = "";
        document.body.innerHTML = "";
        vi.restoreAllMocks();
    });

    afterEach(() => {
        exitChartFullscreen();
        document.body.className = "";
        document.body.innerHTML = "";
    });

    it("enters fullscreen using overlay and restores on exit", () => {
        const wrapper = document.createElement("div");
        wrapper.className = "chart-wrapper";
        wrapper.dataset.chartTitle = "Power Output";

        const host = document.createElement("div");
        host.id = "chart-host";
        host.append(wrapper);
        document.body.append(host);

        expect(isChartFullscreenActive()).toBe(false);

        enterChartFullscreen(wrapper, { title: "Power Output" });

        const overlay = getOverlay();
        expect(overlay).toBeTruthy();
        expect(document.body.classList.contains("chart-fullscreen-active")).toBe(true);
        expect(wrapper.classList.contains("chart-wrapper--fullscreen")).toBe(true);
        expect(overlay?.querySelector("[data-role=content]")?.contains(wrapper)).toBe(true);

        expect(isChartFullscreenActive(wrapper)).toBe(true);
        expect(host.contains(wrapper)).toBe(false);

        exitChartFullscreen();

        expect(isChartFullscreenActive()).toBe(false);
        expect(document.body.classList.contains("chart-fullscreen-active")).toBe(false);
        expect(host.contains(wrapper)).toBe(true);
        expect(getOverlay()).toBeNull();
    });

    it("supports toggling and listener notifications", () => {
        const wrapper = document.createElement("div");
        document.body.append(wrapper);

        const listener = vi.fn();
        const unsubscribe = subscribeToChartFullscreen(listener);

        toggleChartFullscreen(wrapper, { title: "Speed" });
        expect(listener).toHaveBeenLastCalledWith({ active: true, wrapper });
        expect(isChartFullscreenActive(wrapper)).toBe(true);

        toggleChartFullscreen(wrapper);
        expect(listener).toHaveBeenLastCalledWith({ active: false, wrapper });
        expect(isChartFullscreenActive(wrapper)).toBe(false);

        unsubscribe();
    });

    it("ignores repeated enter calls for the same wrapper", () => {
        const wrapper = document.createElement("div");
        document.body.append(wrapper);

        enterChartFullscreen(wrapper, { title: "Cadence" });
        const overlay = getOverlay();
        expect(overlay).toBeTruthy();

        enterChartFullscreen(wrapper, { title: "Cadence" });
        expect(getOverlay()).toBe(overlay);
        expect(isChartFullscreenActive(wrapper)).toBe(true);
    });
});
