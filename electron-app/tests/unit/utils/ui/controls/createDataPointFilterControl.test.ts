// @ts-nocheck

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../../utils/ui/controls/dataPointFilterControl/stateHelpers.js", async () => {
    const actual = await vi.importActual<any>(
        "../../../../../utils/ui/controls/dataPointFilterControl/stateHelpers.js"
    );
    return {
        ...actual,
        computeRangeState: vi.fn(actual.computeRangeState),
        resolveInitialConfig: vi.fn(actual.resolveInitialConfig),
        updateGlobalFilter: vi.fn((config) => actual.updateGlobalFilter(config)),
    };
});

vi.mock("../../../../../utils/ui/controls/dataPointFilterControl/metricsPreview.js", async () => {
    const actual = await vi.importActual<any>(
        "../../../../../utils/ui/controls/dataPointFilterControl/metricsPreview.js"
    );
    return {
        ...actual,
        buildSummaryText: vi.fn(actual.buildSummaryText),
        previewFilterResult: vi.fn(() => null),
    };
});

vi.mock("../../../../../utils/ui/notifications/showNotification.js", () => ({
    showNotification: vi.fn(),
}));

import { createDataPointFilterControl } from "../../../../../utils/ui/controls/createDataPointFilterControl.js";
import { showNotification } from "../../../../../utils/ui/notifications/showNotification.js";
import { computeRangeState, resolveInitialConfig, updateGlobalFilter } from "../../../../../utils/ui/controls/dataPointFilterControl/stateHelpers.js";
import * as stateHelpersModule from "../../../../../utils/ui/controls/dataPointFilterControl/stateHelpers.js";
import { buildSummaryText, previewFilterResult } from "../../../../../utils/ui/controls/dataPointFilterControl/metricsPreview.js";

let actualStateHelpers: any;
let actualMetricsPreview: any;
let originalRAF: typeof globalThis.requestAnimationFrame;
let originalCancelRAF: typeof globalThis.cancelAnimationFrame;
let originalQueueMicrotask: typeof globalThis.queueMicrotask;
let rafId = 0;

beforeAll(async () => {
    actualStateHelpers = await vi.importActual("../../../../../utils/ui/controls/dataPointFilterControl/stateHelpers.js");
    actualMetricsPreview = await vi.importActual("../../../../../utils/ui/controls/dataPointFilterControl/metricsPreview.js");
});

beforeEach(() => {
    vi.clearAllMocks();
    resolveInitialConfig.mockImplementation(actualStateHelpers.resolveInitialConfig);
    computeRangeState.mockImplementation(actualStateHelpers.computeRangeState);
    updateGlobalFilter.mockImplementation((config) => actualStateHelpers.updateGlobalFilter(config));
    buildSummaryText.mockImplementation(actualMetricsPreview.buildSummaryText);
    previewFilterResult.mockImplementation(() => null);
    (showNotification as any).mockReset?.();

    document.body.innerHTML = "";
    globalThis.mapDataPointFilter = undefined;
    globalThis.mapDataPointFilterLastResult = undefined;
    globalThis.globalData = { recordMesgs: [] };
    originalQueueMicrotask = globalThis.queueMicrotask;

    originalRAF = globalThis.requestAnimationFrame;
    originalCancelRAF = globalThis.cancelAnimationFrame;
    rafId = 0;
    globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
        rafId += 1;
        cb(16);
        return rafId;
    });
    globalThis.cancelAnimationFrame = vi.fn();
});

afterEach(() => {
    globalThis.requestAnimationFrame = originalRAF;
    globalThis.cancelAnimationFrame = originalCancelRAF;
    globalThis.queueMicrotask = originalQueueMicrotask;
});

function appendControl(container: HTMLDivElement) {
    document.body.append(container);
    return container;
}

function openPanel(container: HTMLDivElement) {
    const toggle = container.querySelector<HTMLButtonElement>(".data-point-filter-control__toggle");
    toggle?.click();
}

describe("createDataPointFilterControl", () => {
    it("uses persisted configuration to seed summary without overwriting", async () => {
        globalThis.mapDataPointFilter = {
            enabled: true,
            metric: "power",
            mode: "topPercent",
            percent: 12,
        };
        previewFilterResult.mockReturnValueOnce({
            isActive: true,
            metric: "power",
            mode: "topPercent",
            percent: 12,
            reason: null,
            selectedCount: 8,
            totalCandidates: 20,
        });
        buildSummaryText.mockReturnValueOnce("Persisted summary");

        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const summary = document.body.querySelector<HTMLParagraphElement>(".data-point-filter-control__summary");
        expect(summary?.textContent).toBe("Persisted summary");
        expect(updateGlobalFilter).not.toHaveBeenCalled();
    });

    it("initializes defaults and updates global filter when none persisted", () => {
        const container = appendControl(createDataPointFilterControl());
        expect(updateGlobalFilter).toHaveBeenCalledTimes(1);
        const initialConfig = updateGlobalFilter.mock.calls[0][0];
        expect(initialConfig.metric).toBeTruthy();
        expect(initialConfig.mode).toBe("topPercent");
        expect(container.querySelector(".data-point-filter-control__toggle")).toBeTruthy();
    });

    it("opens and closes the panel via toggle and outside clicks", async () => {
        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const panel = document.body.querySelector<HTMLDivElement>(".data-point-filter-control__panel");
        expect(panel?.hidden).toBe(false);
        expect(container.classList.contains("data-point-filter-control--open")).toBe(true);

        const outside = document.createElement("div");
        document.body.append(outside);
        outside.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        await Promise.resolve();

        expect(panel?.hidden).toBe(true);
        expect(container.classList.contains("data-point-filter-control--open")).toBe(false);
        expect(container.querySelector(".data-point-filter-control__toggle")?.getAttribute("aria-expanded")).toBe("false");
    });

    it("applies top percent filters successfully", async () => {
        previewFilterResult.mockReturnValueOnce({
            isActive: true,
            metric: "speed",
            metricLabel: "Speed",
            mode: "topPercent",
            percent: 25,
            reason: null,
            selectedCount: 5,
            totalCandidates: 10,
        });
        buildSummaryText.mockReturnValueOnce("Top summary");
        const onChange = vi.fn();

        const container = appendControl(createDataPointFilterControl(onChange));
        openPanel(container);
        await Promise.resolve();

        const percentInput = document.body.querySelector<HTMLInputElement>(".data-point-filter-control__input");
        const applyButton = document.body.querySelector<HTMLButtonElement>(".data-point-filter-control__apply");
        expect(percentInput).toBeTruthy();
        expect(applyButton).toBeTruthy();
        percentInput!.value = "150";
        applyButton!.click();
        await Promise.resolve();

        expect(updateGlobalFilter).toHaveBeenLastCalledWith(
            expect.objectContaining({ enabled: true, mode: "topPercent", percent: 100 })
        );
        expect(showNotification).toHaveBeenCalledWith(expect.stringContaining("top 100%"), "success");
        expect(onChange).toHaveBeenCalledWith(
            expect.objectContaining({
                action: "apply",
                config: expect.objectContaining({ mode: "topPercent", percent: 100 }),
            })
        );
        const summary = document.body.querySelector<HTMLParagraphElement>(".data-point-filter-control__summary");
        expect(summary?.textContent).toBe("Top summary");
    });

    it("handles top percent previews that cannot be applied", async () => {
        previewFilterResult.mockReturnValueOnce({
            isActive: false,
            metric: "speed",
            mode: "topPercent",
            percent: 10,
            reason: "No data",
            selectedCount: 0,
            totalCandidates: 0,
        });
        const onChange = vi.fn();

        const container = appendControl(createDataPointFilterControl(onChange));
        openPanel(container);
        await Promise.resolve();

        const applyButton = document.body.querySelector<HTMLButtonElement>(".data-point-filter-control__apply");
        applyButton!.click();

        const summary = document.body.querySelector<HTMLParagraphElement>(".data-point-filter-control__summary");
        expect(summary?.textContent).toBe("No data");

        await Promise.resolve();

        expect(updateGlobalFilter).toHaveBeenLastCalledWith(
            expect.objectContaining({ enabled: false, mode: "topPercent" })
        );
        expect(showNotification).toHaveBeenCalledWith("No data", "info");
        expect(onChange).toHaveBeenCalledWith(
            expect.objectContaining({ action: "clear", config: expect.objectContaining({ mode: "topPercent" }) })
        );
        expect(summary?.textContent).toBe("Highlight the most intense sections of your ride.");
    });

    it("clears top percent filters when the preview returns no points or reason", async () => {
        previewFilterResult.mockReturnValueOnce({
            isActive: true,
            metric: "power",
            metricLabel: "Power",
            mode: "topPercent",
            percent: 5,
            reason: undefined,
            selectedCount: 0,
            totalCandidates: 42,
        });
        buildSummaryText.mockReturnValueOnce("Summary should not be used");

        const onChange = vi.fn();

        const container = appendControl(createDataPointFilterControl(onChange));
        openPanel(container);
        await Promise.resolve();

        const applyButton = document.body.querySelector<HTMLButtonElement>(".data-point-filter-control__apply");
        applyButton!.click();

        const summary = document.body.querySelector<HTMLParagraphElement>(
            ".data-point-filter-control__summary"
        );
        expect(summary?.textContent).toBe("Filter disabled due to insufficient data.");
        expect(showNotification).toHaveBeenCalledWith("No data points available for that metric.", "info");
        expect(onChange.mock.calls.at(-1)).toEqual([
            {
                action: "clear",
                config: expect.objectContaining({ mode: "topPercent" }),
                result: expect.objectContaining({ selectedCount: 0, reason: undefined }),
            },
        ]);
    });

    it("applies value range filters using range stats", async () => {
        computeRangeState.mockImplementation(() => ({
            rangeValues: { min: 200, max: 500 },
            sliderValues: { min: "200", max: "500" },
            stats: {
                decimals: 0,
                max: 600,
                metric: "power",
                metricLabel: "Watts",
                min: 150,
                step: 1,
            },
        }));
        previewFilterResult.mockReturnValueOnce({
            appliedMax: 480,
            appliedMin: 220,
            isActive: true,
            metric: "power",
            metricLabel: "Watts",
            mode: "valueRange",
            percent: 55,
            reason: null,
            selectedCount: 30,
            totalCandidates: 60,
        });
        buildSummaryText.mockReturnValueOnce("Range summary");
        const onChange = vi.fn();

        const container = appendControl(createDataPointFilterControl(onChange));
        openPanel(container);
        await Promise.resolve();

        const rangeRadio = document.body.querySelector<HTMLInputElement>("input[value='valueRange']");
        rangeRadio!.checked = true;
        rangeRadio!.dispatchEvent(new Event("change", { bubbles: true }));

        const applyButton = document.body.querySelector<HTMLButtonElement>(".data-point-filter-control__apply");
        applyButton!.click();
        await Promise.resolve();

        expect(updateGlobalFilter).toHaveBeenLastCalledWith(
            expect.objectContaining({ enabled: true, mode: "valueRange", minValue: 200, maxValue: 500 })
        );
        expect(showNotification).toHaveBeenCalledWith(
            expect.stringContaining("Watts"),
            "success"
        );
        expect(onChange).toHaveBeenCalledWith(
            expect.objectContaining({ action: "apply", result: expect.objectContaining({ mode: "valueRange" }) })
        );
        const summary = document.body.querySelector<HTMLParagraphElement>(".data-point-filter-control__summary");
        expect(summary?.textContent).toBe("Range summary");
    });

    it("clears range filters when preview returns an issue", async () => {
        computeRangeState.mockImplementation(() => ({
            rangeValues: { min: 100, max: 200 },
            sliderValues: { min: "100", max: "200" },
            stats: {
                decimals: 1,
                max: 250,
                metric: "temperature",
                metricLabel: "°C",
                min: 50,
                step: 0.5,
            },
        }));
        previewFilterResult.mockReturnValueOnce({
            isActive: true,
            metric: "temperature",
            mode: "valueRange",
            reason: "Insufficient points",
            selectedCount: 0,
            totalCandidates: 0,
        });
        const onChange = vi.fn();

        const container = appendControl(createDataPointFilterControl(onChange));
        openPanel(container);
        await Promise.resolve();

        const rangeRadio = document.body.querySelector<HTMLInputElement>("input[value='valueRange']");
        rangeRadio!.checked = true;
        rangeRadio!.dispatchEvent(new Event("change", { bubbles: true }));

        const applyButton = document.body.querySelector<HTMLButtonElement>(".data-point-filter-control__apply");
        applyButton!.click();

        const summary = document.body.querySelector<HTMLParagraphElement>(".data-point-filter-control__summary");
        expect(summary?.textContent).toBe("Insufficient points");

        await Promise.resolve();

        expect(updateGlobalFilter).toHaveBeenLastCalledWith(
            expect.objectContaining({ enabled: false, mode: "valueRange" })
        );
        expect(showNotification).toHaveBeenCalledWith("Insufficient points", "info");
        expect(summary?.textContent).toBe("Highlight the most intense sections of your ride.");
        expect(onChange).toHaveBeenCalledWith(
            expect.objectContaining({ action: "clear", config: expect.objectContaining({ mode: "valueRange" }) })
        );
    });

    it("stops value range application when range stats are unavailable", async () => {
        computeRangeState.mockImplementation(() => ({
            stats: null,
            rangeValues: null,
            sliderValues: null,
        }));

        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const rangeRadio = document.body.querySelector<HTMLInputElement>("input[value='valueRange']");
        rangeRadio!.checked = true;
        rangeRadio!.dispatchEvent(new Event("change", { bubbles: true }));

        const applyButton = document.body.querySelector<HTMLButtonElement>(
            ".data-point-filter-control__apply"
        );
        showNotification.mockClear();
        const callsBefore = updateGlobalFilter.mock.calls.length;
        applyButton!.click();

        expect(showNotification).toHaveBeenCalledWith("No data points available for that metric.", "info");
        expect(updateGlobalFilter.mock.calls.length).toBe(callsBefore);
    });

    it("disables value range filters when the preview returns no points or reason", async () => {
        computeRangeState.mockImplementation(() => ({
            rangeValues: { min: 100, max: 400 },
            sliderValues: { min: "100", max: "400" },
            stats: {
                decimals: 0,
                max: 400,
                metric: "power",
                metricLabel: "Power",
                min: 100,
                step: 1,
            },
        }));

        previewFilterResult.mockReturnValueOnce({
            isActive: true,
            metric: "power",
            metricLabel: "Power",
            mode: "valueRange",
            percent: 0,
            reason: undefined,
            selectedCount: 0,
            totalCandidates: 25,
        });

        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const rangeRadio = document.body.querySelector<HTMLInputElement>("input[value='valueRange']");
        rangeRadio!.checked = true;
        rangeRadio!.dispatchEvent(new Event("change", { bubbles: true }));

        const applyButton = document.body.querySelector<HTMLButtonElement>(
            ".data-point-filter-control__apply"
        );
        applyButton!.click();

        const summary = document.body.querySelector<HTMLParagraphElement>(
            ".data-point-filter-control__summary"
        );
        expect(summary?.textContent).toBe("Filter disabled due to insufficient data.");
        expect(showNotification).toHaveBeenCalledWith("No data points available for that range.", "info");
        expect(updateGlobalFilter).toHaveBeenLastCalledWith(
            expect.objectContaining({ enabled: false, mode: "valueRange" })
        );
    });

    it("uses metric stats when cached range values are undefined", async () => {
        computeRangeState.mockImplementation(() => ({
            rangeValues: { min: undefined, max: undefined },
            sliderValues: { min: "150", max: "600" },
            stats: {
                decimals: 0,
                max: 600,
                metric: "power",
                metricLabel: "Watts",
                min: 150,
                step: 1,
            },
        }));
        previewFilterResult.mockReturnValueOnce({
            isActive: true,
            metric: "power",
            metricLabel: "Watts",
            mode: "valueRange",
            percent: 75,
            reason: null,
            selectedCount: 12,
            totalCandidates: 16,
        });
        buildSummaryText.mockReturnValueOnce("Stats fallback summary");

        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const rangeRadio = document.body.querySelector<HTMLInputElement>("input[value='valueRange']");
        rangeRadio!.checked = true;
        rangeRadio!.dispatchEvent(new Event("change", { bubbles: true }));

        const applyButton = document.body.querySelector<HTMLButtonElement>(".data-point-filter-control__apply");
        applyButton!.click();
        await Promise.resolve();

        expect(updateGlobalFilter).toHaveBeenLastCalledWith(
            expect.objectContaining({
                enabled: true,
                maxValue: 600,
                minValue: 150,
                mode: "valueRange",
            })
        );
        const summary = document.body.querySelector<HTMLParagraphElement>(".data-point-filter-control__summary");
        expect(summary?.textContent).toBe("Stats fallback summary");
    });

    it("resets filter state appropriately for both modes", async () => {
        computeRangeState.mockImplementation(() => ({
            rangeValues: { min: 10, max: 20 },
            sliderValues: { min: "10", max: "20" },
            stats: {
                decimals: 0,
                max: 25,
                metric: "speed",
                metricLabel: "km/h",
                min: 5,
                step: 1,
            },
        }));
        const onChange = vi.fn();

        const container = appendControl(createDataPointFilterControl(onChange));
        openPanel(container);
        await Promise.resolve();

        const resetButton = document.body.querySelector<HTMLButtonElement>(".data-point-filter-control__reset");
        resetButton!.click();
        await Promise.resolve();
        expect(updateGlobalFilter).toHaveBeenLastCalledWith(
            expect.objectContaining({ enabled: false, mode: "topPercent" })
        );
        expect(onChange).toHaveBeenCalledWith(
            expect.objectContaining({ action: "clear", config: expect.objectContaining({ mode: "topPercent" }) })
        );

        const rangeRadio = document.body.querySelector<HTMLInputElement>("input[value='valueRange']");
        rangeRadio!.checked = true;
        rangeRadio!.dispatchEvent(new Event("change", { bubbles: true }));
        resetButton!.click();
        await Promise.resolve();
        expect(updateGlobalFilter).toHaveBeenLastCalledWith(
            expect.objectContaining({ enabled: false, mode: "valueRange", minValue: 10, maxValue: 20 })
        );
    });

    it("synchronizes range sliders and toggles mode when user adjusts values", async () => {
        computeRangeState.mockImplementation(() => ({
            rangeValues: { min: 100, max: 200 },
            sliderValues: { min: "100", max: "200" },
            stats: {
                decimals: 0,
                max: 300,
                metric: "heart_rate",
                metricLabel: "bpm",
                min: 50,
                step: 1,
            },
        }));

        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const minSlider = document.body.querySelector<HTMLInputElement>("input[id^='map-filter-range-min-']");
        const maxSlider = document.body.querySelector<HTMLInputElement>("input[id^='map-filter-range-max-']");
        const rangeRadio = document.body.querySelector<HTMLInputElement>("input[value='valueRange']");
        const topPercentRadio = document.body.querySelector<HTMLInputElement>("input[value='topPercent']");
        const rangeValues = document.body.querySelector<HTMLDivElement>(".data-point-filter-control__range-values");

        expect(minSlider).toBeTruthy();
        expect(maxSlider).toBeTruthy();

        minSlider!.value = "260";
        minSlider!.dispatchEvent(new Event("input", { bubbles: true }));
        await Promise.resolve();

        expect(rangeRadio?.checked).toBe(true);
        expect(topPercentRadio?.checked).toBe(false);
        expect(rangeValues?.textContent).toContain("260");

        minSlider!.value = "350";
        minSlider!.dispatchEvent(new Event("change", { bubbles: true }));
        await Promise.resolve();
        expect(maxSlider!.value).toBe("300");
        expect(rangeValues?.textContent).toContain("300");
    });

    it("promotes slider interaction to value range mode when starting in top-percent", async () => {
        globalThis.mapDataPointFilter = {
            enabled: true,
            metric: "power",
            mode: "topPercent",
            percent: 15,
        };
        computeRangeState.mockImplementation(() => ({
            rangeValues: { min: 120, max: 340 },
            sliderValues: { min: "120", max: "340" },
            stats: {
                decimals: 0,
                max: 400,
                metric: "power",
                metricLabel: "W",
                min: 80,
                step: 1,
            },
        }));

        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const minSlider = document.body.querySelector<HTMLInputElement>("input[id^='map-filter-range-min-']");
        const maxSlider = document.body.querySelector<HTMLInputElement>("input[id^='map-filter-range-max-']");
        const rangeRadio = document.body.querySelector<HTMLInputElement>("input[value='valueRange']");
        const topPercentRadio = document.body.querySelector<HTMLInputElement>("input[value='topPercent']");

        expect(minSlider).toBeTruthy();
        expect(rangeRadio?.checked).toBe(false);
        expect(topPercentRadio?.checked).toBe(true);

        minSlider!.value = "200";
        minSlider!.dispatchEvent(new Event("input", { bubbles: true }));
        await Promise.resolve();

        maxSlider!.value = "360";
        maxSlider!.dispatchEvent(new Event("change", { bubbles: true }));
        await Promise.resolve();

        expect(rangeRadio?.checked).toBe(true);
        expect(topPercentRadio?.checked).toBe(false);
    });

    it("clamps percent input values on change events", async () => {
        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const percentInput = document.body.querySelector<HTMLInputElement>(".data-point-filter-control__input");
        expect(percentInput).toBeTruthy();
        percentInput!.value = "0";
        percentInput!.dispatchEvent(new Event("change", { bubbles: true }));
        expect(percentInput!.value).toBe("1");

        percentInput!.value = "250";
        percentInput!.dispatchEvent(new Event("change", { bubbles: true }));
        expect(percentInput!.value).toBe("100");
    });

    it("applies value-range filters using preview-adjusted bounds", async () => {
        computeRangeState.mockImplementation(() => ({
            rangeValues: { min: 140, max: 320 },
            sliderValues: { min: "140", max: "320" },
            stats: {
                decimals: 0,
                max: 400,
                metric: "power",
                metricLabel: "W",
                min: 80,
                step: 5,
            },
        }));
        previewFilterResult.mockImplementationOnce(() => ({
            appliedMax: 310,
            appliedMin: 160,
            isActive: true,
            metric: "power",
            metricLabel: "Power",
            mode: "valueRange",
            percent: 45,
            reason: null,
            selectedCount: 12,
            totalCandidates: 50,
        }));
        buildSummaryText.mockImplementationOnce(() => "Power between 160 and 310");

        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const minSlider = document.body.querySelector<HTMLInputElement>("input[id^='map-filter-range-min-']");
        const maxSlider = document.body.querySelector<HTMLInputElement>("input[id^='map-filter-range-max-']");
        const applyButton = document.body.querySelector<HTMLButtonElement>(".data-point-filter-control__apply");
        const summary = document.body.querySelector<HTMLParagraphElement>(".data-point-filter-control__summary");

        minSlider!.value = "170";
        minSlider!.dispatchEvent(new Event("input", { bubbles: true }));
        maxSlider!.value = "330";
        maxSlider!.dispatchEvent(new Event("input", { bubbles: true }));

        applyButton!.click();
        await Promise.resolve();

        expect(updateGlobalFilter).toHaveBeenLastCalledWith(
            expect.objectContaining({ mode: "valueRange", minValue: 170, maxValue: 330 })
        );
        expect(summary?.textContent).toBe("Power between 160 and 310");
        expect(showNotification).toHaveBeenLastCalledWith(
            expect.stringContaining("160"),
            "success"
        );

        // Sliders retain the preview-adjusted bounds after applying.
        expect(minSlider?.value).toBe("160");
        expect(maxSlider?.value).toBe("310");
    });

    it("applies value-range filters falling back to computed stats when sliders untouched", async () => {
        computeRangeState.mockImplementation(() => ({
            rangeValues: { min: undefined, max: undefined },
            sliderValues: { min: "90", max: "210" },
            stats: {
                decimals: 0,
                max: 210,
                metric: "cadence",
                metricLabel: "rpm",
                min: 90,
                step: 1,
            },
        }));
        previewFilterResult.mockImplementationOnce(() => ({
            applied: true,
            appliedMax: undefined,
            appliedMin: undefined,
            isActive: true,
            metric: "cadence",
            metricLabel: "Cadence",
            mode: "valueRange",
            percent: 30,
            reason: null,
            selectedCount: 20,
            totalCandidates: 40,
        }));
        buildSummaryText.mockImplementationOnce(() => "Cadence between 90 and 210");

        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const applyButton = document.body.querySelector<HTMLButtonElement>(".data-point-filter-control__apply");
        const summary = document.body.querySelector<HTMLParagraphElement>(".data-point-filter-control__summary");

        applyButton!.click();
        await Promise.resolve();

        expect(updateGlobalFilter).toHaveBeenLastCalledWith(
            expect.objectContaining({ mode: "valueRange", minValue: 90, maxValue: 210 })
        );
        expect(summary?.textContent).toBe("Cadence between 90 and 210");
    });

    it("recomputes range stats on metric change without preserving selection", async () => {
        const metricCalls: Array<{ metric: string; current: unknown; options: any }> = [];
        computeRangeState.mockImplementation((metric, currentRange, options) => {
            metricCalls.push({ metric, current: currentRange, options });
            return actualStateHelpers.computeRangeState(metric, currentRange, options);
        });

        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const metricSelect = document.body.querySelector<HTMLSelectElement>(".data-point-filter-control__select");
        expect(metricSelect).toBeTruthy();
        metricSelect!.selectedIndex = (metricSelect!.selectedIndex + 1) % metricSelect!.options.length;
        metricSelect!.dispatchEvent(new Event("change", { bubbles: true }));

        expect(metricCalls.some((call) => call.options?.preserveSelection === false)).toBe(true);
        expect(metricCalls.some((call) => call.current?.min === undefined && call.current?.max === undefined)).toBe(true);
    });

    it("disables range controls when stats are unavailable", async () => {
        computeRangeState.mockImplementation(() => ({ stats: null, rangeValues: null, sliderValues: null }));

        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const rangeGroup = document.body.querySelector<HTMLDivElement>(".data-point-filter-control__range");
        const minSlider = document.body.querySelector<HTMLInputElement>("input[id^='map-filter-range-min-']");
        const maxSlider = document.body.querySelector<HTMLInputElement>("input[id^='map-filter-range-max-']");
        const rangeValues = document.body.querySelector<HTMLDivElement>(".data-point-filter-control__range-values");

        expect(rangeGroup?.dataset.disabled).toBe("true");
        expect(minSlider?.disabled).toBe(true);
        expect(maxSlider?.disabled).toBe(true);
        expect(rangeValues?.textContent).toBe("Range unavailable");

        minSlider?.dispatchEvent(new Event("input", { bubbles: true }));
        maxSlider?.dispatchEvent(new Event("change", { bubbles: true }));
        await Promise.resolve();
        expect(rangeValues?.textContent).toBe("Range unavailable");
    });

    it("handles non-numeric slider input gracefully", async () => {
        const clampMock = vi.spyOn(stateHelpersModule, "clampRangeValue").mockImplementation(
            /** @type {any} */ ((value, stats) => actualStateHelpers.clampRangeValue(value, stats))
        );
        computeRangeState.mockImplementation(() => ({
            rangeValues: { min: 175, max: 300 },
            sliderValues: { min: "175", max: "300" },
            stats: {
                decimals: 0,
                max: 300,
                metric: "heart_rate",
                metricLabel: "bpm",
                min: 175,
                step: 1,
            },
        }));

        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const minSlider = document.body.querySelector<HTMLInputElement>("input[id^='map-filter-range-min-']");
        const maxSlider = document.body.querySelector<HTMLInputElement>("input[id^='map-filter-range-max-']");
        expect(minSlider).toBeTruthy();
        expect(maxSlider).toBeTruthy();

        const minInternal = { value: minSlider!.value };
        Object.defineProperty(minSlider!, "value", {
            configurable: true,
            enumerable: true,
            get: () => minInternal.value,
            set: (val: string) => {
                minInternal.value = val;
            },
        });

        clampMock.mockClear();
        minInternal.value = "NaN";
        minSlider!.dispatchEvent(new Event("input", { bubbles: true }));
        await Promise.resolve();
        expect(clampMock.mock.calls.some(([value]) => value === 175)).toBe(true);

        delete (minSlider as any).value;

        const maxInternal = { value: maxSlider!.value };
        Object.defineProperty(maxSlider!, "value", {
            configurable: true,
            enumerable: true,
            get: () => maxInternal.value,
            set: (val: string) => {
                maxInternal.value = val;
            },
        });

        clampMock.mockClear();
        maxInternal.value = "NaN";
        maxSlider!.dispatchEvent(new Event("input", { bubbles: true }));
        await Promise.resolve();
        expect(clampMock.mock.calls.some(([value]) => value === 300)).toBe(true);

        delete (maxSlider as any).value;

        clampMock.mockRestore();
    });

    it("aligns the minimum slider when the maximum slider dips below it", async () => {
        computeRangeState.mockImplementation(() => ({
            rangeValues: { min: 90, max: 140 },
            sliderValues: { min: "90", max: "140" },
            stats: {
                decimals: 0,
                max: 180,
                metric: "heart_rate",
                metricLabel: "bpm",
                min: 60,
                step: 1,
            },
        }));

        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const minSlider = document.body.querySelector<HTMLInputElement>("input[id^='map-filter-range-min-']");
        const maxSlider = document.body.querySelector<HTMLInputElement>("input[id^='map-filter-range-max-']");
        const rangeValues = document.body.querySelector<HTMLDivElement>(".data-point-filter-control__range-values");

        expect(minSlider?.value).toBe("90");
        expect(maxSlider?.value).toBe("140");

        maxSlider!.value = "80";
        maxSlider!.dispatchEvent(new Event("input", { bubbles: true }));
        await Promise.resolve();

        expect(minSlider?.value).toBe("80");
        expect(rangeValues?.textContent).toContain("80");
    });

    it("toggling the top percent radio hides range controls", async () => {
        computeRangeState.mockImplementation(() => ({
            rangeValues: { min: 10, max: 20 },
            sliderValues: { min: "10", max: "20" },
            stats: {
                decimals: 0,
                max: 25,
                metric: "speed",
                metricLabel: "km/h",
                min: 5,
                step: 1,
            },
        }));

        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const rangeRadio = document.body.querySelector<HTMLInputElement>("input[value='valueRange']");
        const topRadio = document.body.querySelector<HTMLInputElement>("input[value='topPercent']");
        const percentGroup = document.body.querySelector<HTMLDivElement>(".data-point-filter-control__percent");
        const rangeGroup = document.body.querySelector<HTMLDivElement>(".data-point-filter-control__range");

        rangeRadio!.checked = true;
        rangeRadio!.dispatchEvent(new Event("change", { bubbles: true }));
        topRadio!.checked = true;
        topRadio!.dispatchEvent(new Event("change", { bubbles: true }));

        expect(percentGroup?.style.display).not.toBe("none");
        expect(rangeGroup?.style.display).toBe("none");
        expect(percentGroup?.getAttribute("aria-hidden")).toBe("false");
        expect(rangeGroup?.getAttribute("aria-hidden")).toBe("true");
    });

    it("ignores viewport scroll events once the panel is closed", async () => {
        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const rafMock = globalThis.requestAnimationFrame as unknown as vi.Mock;
        const initialCalls = rafMock.mock.calls.length;
        window.dispatchEvent(new Event("scroll", { bubbles: true }));
        await Promise.resolve();
        expect(rafMock.mock.calls.length).toBeGreaterThan(initialCalls);

        const toggle = container.querySelector<HTMLButtonElement>(".data-point-filter-control__toggle");
        toggle!.click();
        await Promise.resolve();
        const callsAfterClose = rafMock.mock.calls.length;
        window.dispatchEvent(new Event("scroll", { bubbles: true }));
        await Promise.resolve();
        expect(rafMock.mock.calls.length).toBe(callsAfterClose);
    });

    it("repositions the panel based on viewport constraints", async () => {
        const container = appendControl(createDataPointFilterControl());
        const toggle = container.querySelector<HTMLButtonElement>(".data-point-filter-control__toggle");
        toggle!.getBoundingClientRect = () => ({
            bottom: 700,
            height: 40,
            left: 200,
            right: 240,
            top: 660,
            width: 40,
            x: 200,
            y: 660,
        } as DOMRect);
        Object.defineProperty(window, "innerWidth", { value: 800, configurable: true });
        Object.defineProperty(window, "innerHeight", { value: 720, configurable: true });

        openPanel(container);
        await Promise.resolve();

        const panel = document.body.querySelector<HTMLDivElement>(".data-point-filter-control__panel");
        panel!.getBoundingClientRect = () => ({
            bottom: 680,
            height: 120,
            left: 0,
            right: 0,
            top: 560,
            width: 320,
            x: 0,
            y: 560,
        } as DOMRect);

        window.dispatchEvent(new Event("resize"));
        await Promise.resolve();

        expect(panel?.style.left).toMatch(/px/);
        expect(panel?.style.top).toMatch(/px/);
        expect(panel?.style.getPropertyValue("--data-point-filter-arrow-offset")).toMatch(/px/);

        // Force reverse positioning by shrinking viewport height.
        Object.defineProperty(window, "innerHeight", { value: 650, configurable: true });
        window.dispatchEvent(new Event("resize"));
        await Promise.resolve();
        expect(panel?.classList.contains("data-point-filter-control__panel--reverse")).toBe(true);
    });

    it("skips repositioning when the panel reports zero dimensions", async () => {
        const container = appendControl(createDataPointFilterControl());
        const toggle = container.querySelector<HTMLButtonElement>(".data-point-filter-control__toggle");
        toggle!.getBoundingClientRect = () => ({
            bottom: 200,
            height: 32,
            left: 100,
            right: 132,
            top: 168,
            width: 32,
            x: 100,
            y: 168,
        } as DOMRect);

        openPanel(container);
        await Promise.resolve();

        const panel = document.body.querySelector<HTMLDivElement>(".data-point-filter-control__panel");
        panel!.style.left = "10px";
        panel!.style.top = "20px";
        panel!.getBoundingClientRect = () => ({
            bottom: 0,
            height: 0,
            left: 0,
            right: 0,
            top: 0,
            width: 0,
            x: 0,
            y: 0,
        } as DOMRect);

        window.dispatchEvent(new Event("resize"));
        await Promise.resolve();

        expect(panel?.style.left).toBe("10px");
        expect(panel?.style.top).toBe("20px");
        expect(panel?.style.getPropertyValue("--data-point-filter-arrow-offset")).toBe("");
    });

    it("refreshes summary from cached results and handles escape key", async () => {
        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const summary = document.body.querySelector<HTMLParagraphElement>(".data-point-filter-control__summary");
        expect(summary).toBeTruthy();

        globalThis.mapDataPointFilterLastResult = {
            applied: true,
            appliedMax: 300,
            appliedMin: 150,
            metric: "power",
            metricLabel: "Power",
            mode: "valueRange",
            percent: 40,
            selectedCount: 12,
            totalCandidates: 30,
        };
        (container as any).refreshSummary();
        expect(summary?.textContent).toContain("12 of 30");

        globalThis.mapDataPointFilterLastResult = {
            applied: true,
            metric: "speed",
            metricLabel: "Speed",
            mode: "topPercent",
            percent: 20,
            selectedCount: 6,
            totalCandidates: 24,
        };
        (container as any).refreshSummary();
        expect(summary?.textContent).toContain("top 20%");

        globalThis.mapDataPointFilterLastResult = { reason: "Disabled" };
        (container as any).refreshSummary();
        expect(summary?.textContent).toBe("Disabled");

        globalThis.mapDataPointFilter = { enabled: false };
        globalThis.mapDataPointFilterLastResult = null;
        (container as any).refreshSummary();
        expect(summary?.textContent).toBe("Highlight the most intense sections of your ride.");

        const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true });
        container.dispatchEvent(event);
        await Promise.resolve();
        const panel = document.body.querySelector<HTMLDivElement>(".data-point-filter-control__panel");
        expect(panel?.hidden).toBe(true);
    });

    it("falls back to candidate values and default coverage in cached summaries", async () => {
        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const summary = document.body.querySelector<HTMLParagraphElement>(".data-point-filter-control__summary");
        expect(summary).toBeTruthy();

        globalThis.mapDataPointFilterLastResult = {
            applied: true,
            maxCandidate: 672.4,
            metric: "altitude",
            metricLabel: "Altitude",
            minCandidate: 512.1,
            mode: "valueRange",
            percent: 37,
            selectedCount: 4,
            totalCandidates: 9,
        };
        (container as any).refreshSummary();
        expect(summary?.textContent).toContain("37% coverage");

        globalThis.mapDataPointFilterLastResult = {
            applied: true,
            maxCandidate: 12,
            metric: "speed",
            minCandidate: 6,
            mode: "valueRange",
            percent: "n/a",
            selectedCount: 1,
            totalCandidates: 10,
        };
        (container as any).refreshSummary();
        expect(summary?.textContent).toContain("0% coverage");
    });

    it("preserves summaries when filter stays active and swallows refresh errors", async () => {
        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const summary = document.body.querySelector<HTMLParagraphElement>(".data-point-filter-control__summary");
        expect(summary).toBeTruthy();
        if (!summary) {
            return;
        }

        summary.textContent = "Original summary";

        globalThis.mapDataPointFilter = { enabled: true };
        globalThis.mapDataPointFilterLastResult = null;
        (container as any).refreshSummary();
        expect(summary.textContent).toBe("Original summary");

        const formatMetricValueSpy = vi.spyOn(stateHelpersModule, "formatMetricValue").mockImplementation(() => {
            throw new Error("format failure");
        });

        globalThis.mapDataPointFilterLastResult = {
            applied: true,
            metric: "speed",
            metricLabel: "Speed",
            mode: "valueRange",
            selectedCount: 0,
            totalCandidates: 0,
        } as any;

        expect(() => (container as any).refreshSummary()).not.toThrow();
        expect(summary.textContent).toBe("Original summary");

        formatMetricValueSpy.mockRestore();
    });
});
