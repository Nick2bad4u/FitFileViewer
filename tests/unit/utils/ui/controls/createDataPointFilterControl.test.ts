import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";
import type {
    MapDataPointFilterConfig,
    MetricFilterResult,
} from "../../../../../electron-app/utils/maps/filters/mapMetricFilter.js";

type StateHelpersModule =
    typeof import("../../../../../electron-app/utils/ui/controls/dataPointFilterControl/stateHelpers.js");
type MetricsPreviewModule =
    typeof import("../../../../../electron-app/utils/ui/controls/dataPointFilterControl/metricsPreview.js");
type ShowNotificationModule =
    typeof import("../../../../../electron-app/utils/ui/notifications/showNotification.js");

type FilterChangePayload = {
    action: "apply" | "clear";
    config: MapDataPointFilterConfig;
    result?: Partial<MetricFilterResult>;
};

type FilterChangeHandler = (payload: FilterChangePayload) => void;

vi.mock(
    import("../../../../../electron-app/utils/ui/controls/dataPointFilterControl/stateHelpers.js"),
    async () => {
        const actual = await vi.importActual<StateHelpersModule>(
            "../../../../../electron-app/utils/ui/controls/dataPointFilterControl/stateHelpers.js"
        );
        return {
            ...actual,
            computeRangeState: vi.fn<typeof actual.computeRangeState>(
                actual.computeRangeState
            ),
            resolveInitialConfig: vi.fn<typeof actual.resolveInitialConfig>(
                actual.resolveInitialConfig
            ),
            updateGlobalFilter: vi.fn<typeof actual.updateGlobalFilter>(
                (config) => {
                    actual.updateGlobalFilter(config);
                }
            ),
        };
    }
);

vi.mock(
    import("../../../../../electron-app/utils/ui/controls/dataPointFilterControl/metricsPreview.js"),
    async () => {
        const actual = await vi.importActual<MetricsPreviewModule>(
            "../../../../../electron-app/utils/ui/controls/dataPointFilterControl/metricsPreview.js"
        );
        return {
            ...actual,
            buildSummaryText: vi.fn<typeof actual.buildSummaryText>(
                actual.buildSummaryText
            ),
            previewFilterResult: vi.fn<typeof actual.previewFilterResult>(
                () => null
            ),
        };
    }
);

vi.mock(
    import("../../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: vi.fn<ShowNotificationModule["showNotification"]>(
            async () => {}
        ),
    })
);

import { createDataPointFilterControl } from "../../../../../electron-app/utils/ui/controls/createDataPointFilterControl.js";
import { setActiveFitRawData } from "../../../../../electron-app/utils/state/domain/activeFitRawDataState.js";
import { __resetStateManagerForTests } from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    resetMapDataPointFilterStateForTests,
    setMapDataPointFilter,
    setMapDataPointFilterLastResult,
} from "../../../../../electron-app/utils/maps/state/mapDataPointFilterState.js";
import { showNotification } from "../../../../../electron-app/utils/ui/notifications/showNotification.js";
import {
    computeRangeState,
    resolveInitialConfig,
    updateGlobalFilter,
} from "../../../../../electron-app/utils/ui/controls/dataPointFilterControl/stateHelpers.js";
import * as stateHelpersModule from "../../../../../electron-app/utils/ui/controls/dataPointFilterControl/stateHelpers.js";
import {
    buildSummaryText,
    previewFilterResult,
} from "../../../../../electron-app/utils/ui/controls/dataPointFilterControl/metricsPreview.js";

let actualStateHelpers: StateHelpersModule;
let actualMetricsPreview: MetricsPreviewModule;
let rafId = 0;

type TestGlobalProperty =
    | "cancelAnimationFrame"
    | "queueMicrotask"
    | "requestAnimationFrame";

const originalGlobalDescriptors = new Map<
    TestGlobalProperty,
    PropertyDescriptor
>();

function createOnChangeMock() {
    return vi.fn<FilterChangeHandler>();
}

function getGlobalRestoreDescriptor(
    name: TestGlobalProperty
): PropertyDescriptor {
    return (
        Object.getOwnPropertyDescriptor(globalThis, name) ?? {
            configurable: true,
            value: undefined,
            writable: true,
        }
    );
}

function setTestGlobal(name: TestGlobalProperty, value: unknown): void {
    if (!originalGlobalDescriptors.has(name)) {
        originalGlobalDescriptors.set(name, getGlobalRestoreDescriptor(name));
    }

    Object.defineProperty(globalThis, name, {
        configurable: true,
        value,
        writable: true,
    });
}

function restoreTestGlobals(): void {
    for (const [name, descriptor] of originalGlobalDescriptors) {
        Object.defineProperty(globalThis, name, descriptor);
    }
    originalGlobalDescriptors.clear();
}

function installAnimationFrameFixtures(): void {
    rafId = 0;
    setTestGlobal(
        "requestAnimationFrame",
        vi.fn<(callback: FrameRequestCallback) => number>((callback) => {
            rafId += 1;
            callback(16);
            return rafId;
        })
    );
    setTestGlobal(
        "cancelAnimationFrame",
        vi.fn<(handle: number) => void>(() => {})
    );
}

beforeAll(async () => {
    actualStateHelpers = await vi.importActual<StateHelpersModule>(
        "../../../../../electron-app/utils/ui/controls/dataPointFilterControl/stateHelpers.js"
    );
    actualMetricsPreview = await vi.importActual<MetricsPreviewModule>(
        "../../../../../electron-app/utils/ui/controls/dataPointFilterControl/metricsPreview.js"
    );
});

beforeEach(() => {
    __resetStateManagerForTests();
    vi.clearAllMocks();
    resolveInitialConfig.mockImplementation(
        actualStateHelpers.resolveInitialConfig
    );
    computeRangeState.mockImplementation(actualStateHelpers.computeRangeState);
    updateGlobalFilter.mockImplementation((config) =>
        actualStateHelpers.updateGlobalFilter(config)
    );
    buildSummaryText.mockImplementation(actualMetricsPreview.buildSummaryText);
    previewFilterResult.mockReturnValue(null);
    (showNotification as any).mockReset?.();

    document.body.replaceChildren();
    resetMapDataPointFilterStateForTests();
    setActiveFitRawData(
        {
            recordMesgs: [
                {
                    speed: 6.5,
                    power: 210,
                    cadence: 85,
                    heartRate: 145,
                    altitude: 120,
                },
                {
                    speed: 7.2,
                    power: 230,
                    cadence: 92,
                    heartRate: 152,
                    altitude: 128,
                },
            ],
        },
        { source: "test" }
    );
    installAnimationFrameFixtures();
});

afterEach(() => {
    __resetStateManagerForTests();
    resetMapDataPointFilterStateForTests();
    restoreTestGlobals();
});

function appendControl(container: HTMLDivElement) {
    document.body.append(container);
    return container;
}

function openPanel(container: HTMLDivElement) {
    const toggle = container.querySelector<HTMLButtonElement>(
        ".data-point-filter-control__toggle"
    );
    toggle?.click();
}

function requireElement<T extends Element>(
    element: T | null,
    label: string
): T {
    if (element === null) {
        throw new Error(`${label} was not rendered`);
    }
    return element;
}

function getClassList(element: Element): string[] {
    return [...element.classList];
}

function getRadioCheckedState(
    rangeRadio: HTMLInputElement | null,
    topPercentRadio: HTMLInputElement | null
): Record<"range" | "topPercent", boolean | undefined> {
    return {
        range: rangeRadio?.checked,
        topPercent: topPercentRadio?.checked,
    };
}

describe(createDataPointFilterControl, () => {
    it("uses persisted configuration to seed summary without overwriting", async () => {
        expect.assertions(2);

        setMapDataPointFilter({
            enabled: true,
            metric: "power",
            mode: "topPercent",
            percent: 12,
        });
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

        const summary = document.body.querySelector<HTMLParagraphElement>(
            ".data-point-filter-control__summary"
        );
        expect(summary?.textContent).toBe("Persisted summary");
        expect(updateGlobalFilter).not.toHaveBeenCalled();
    });

    it("initializes defaults and updates global filter when none persisted", () => {
        expect.assertions(5);

        const container = appendControl(createDataPointFilterControl());
        expect(updateGlobalFilter).toHaveBeenCalledOnce();
        const initialConfig = updateGlobalFilter.mock.calls[0][0];
        expect(initialConfig.metric).toBe("speed");
        expect(initialConfig.mode).toBe("topPercent");
        const toggle = requireElement(
            container.querySelector<HTMLButtonElement>(
                ".data-point-filter-control__toggle"
            ),
            "filter toggle"
        );
        expect(toggle.type).toBe("button");
        expect(toggle.getAttribute("aria-expanded")).toBe("false");
    });

    it("opens and closes the panel via toggle and outside clicks", async () => {
        expect.assertions(5);

        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const panel = document.body.querySelector<HTMLDivElement>(
            ".data-point-filter-control__panel"
        );
        const panelElement = requireElement(panel, "filter panel");
        expect(panelElement).toHaveProperty("hidden", false);
        expect(getClassList(container)).toContain(
            "data-point-filter-control--open"
        );

        const outside = document.createElement("div");
        document.body.append(outside);
        outside.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        await Promise.resolve();

        expect(panelElement).toHaveProperty("hidden", true);
        expect(getClassList(container)).not.toContain(
            "data-point-filter-control--open"
        );
        expect(
            container
                .querySelector(".data-point-filter-control__toggle")
                ?.getAttribute("aria-expanded")
        ).toBe("false");
    });

    it("applies top percent filters successfully", async () => {
        expect.assertions(7);

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
        const onChange = createOnChangeMock();

        const container = appendControl(createDataPointFilterControl(onChange));
        openPanel(container);
        await Promise.resolve();

        const percentInput = document.body.querySelector<HTMLInputElement>(
            ".data-point-filter-control__input"
        );
        const applyButton = document.body.querySelector<HTMLButtonElement>(
            ".data-point-filter-control__apply"
        );
        const percentInputElement = requireElement(
            percentInput,
            "percent input"
        );
        const applyButtonElement = requireElement(applyButton, "apply button");
        expect(percentInputElement.type).toBe("number");
        expect(percentInputElement.min).toBe("1");
        expect(percentInputElement.max).toBe("100");
        percentInputElement.value = "150";
        applyButtonElement.click();
        await Promise.resolve();

        expect(updateGlobalFilter).toHaveBeenLastCalledWith(
            expect.objectContaining({
                enabled: true,
                mode: "topPercent",
                percent: 100,
            })
        );
        expect(showNotification).toHaveBeenCalledWith(
            "Showing top 100% Speed data points",
            "success"
        );
        expect(onChange).toHaveBeenCalledWith(
            expect.objectContaining({
                action: "apply",
                config: expect.objectContaining({
                    mode: "topPercent",
                    percent: 100,
                }),
            })
        );
        const summary = document.body.querySelector<HTMLParagraphElement>(
            ".data-point-filter-control__summary"
        );
        expect(summary?.textContent).toBe("Top summary");
    });

    it("handles top percent previews that cannot be applied", async () => {
        expect.assertions(5);

        previewFilterResult.mockReturnValueOnce({
            isActive: false,
            metric: "speed",
            mode: "topPercent",
            percent: 10,
            reason: "No data",
            selectedCount: 0,
            totalCandidates: 0,
        });
        const onChange = createOnChangeMock();

        const container = appendControl(createDataPointFilterControl(onChange));
        openPanel(container);
        await Promise.resolve();

        const applyButton = document.body.querySelector<HTMLButtonElement>(
            ".data-point-filter-control__apply"
        );
        applyButton!.click();

        const summary = document.body.querySelector<HTMLParagraphElement>(
            ".data-point-filter-control__summary"
        );
        expect(summary?.textContent).toBe("No data");

        await Promise.resolve();

        expect(updateGlobalFilter).toHaveBeenLastCalledWith(
            expect.objectContaining({ enabled: false, mode: "topPercent" })
        );
        expect(showNotification).toHaveBeenCalledWith("No data", "info");
        expect(onChange).toHaveBeenCalledWith(
            expect.objectContaining({
                action: "clear",
                config: expect.objectContaining({ mode: "topPercent" }),
            })
        );
        expect(summary?.textContent).toBe(
            "Highlight the most intense sections of your ride."
        );
    });

    it("clears top percent filters when the preview returns no points or reason", async () => {
        expect.assertions(3);

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

        const onChange = createOnChangeMock();

        const container = appendControl(createDataPointFilterControl(onChange));
        openPanel(container);
        await Promise.resolve();

        const applyButton = document.body.querySelector<HTMLButtonElement>(
            ".data-point-filter-control__apply"
        );
        applyButton!.click();

        const summary = document.body.querySelector<HTMLParagraphElement>(
            ".data-point-filter-control__summary"
        );
        expect(summary?.textContent).toBe(
            "Filter disabled due to insufficient data."
        );
        expect(showNotification).toHaveBeenCalledWith(
            "No data points available for that metric.",
            "info"
        );
        expect(onChange.mock.calls.at(-1)).toEqual([
            {
                action: "clear",
                config: expect.objectContaining({ mode: "topPercent" }),
                result: expect.objectContaining({
                    selectedCount: 0,
                    reason: undefined,
                }),
            },
        ]);
    });

    it("applies value range filters using range stats", async () => {
        expect.assertions(4);

        computeRangeState.mockReturnValue({
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
        });
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
        const onChange = createOnChangeMock();

        const container = appendControl(createDataPointFilterControl(onChange));
        openPanel(container);
        await Promise.resolve();

        const rangeRadio = document.body.querySelector<HTMLInputElement>(
            "input[value='valueRange']"
        );
        rangeRadio!.checked = true;
        rangeRadio!.dispatchEvent(new Event("change", { bubbles: true }));

        const applyButton = document.body.querySelector<HTMLButtonElement>(
            ".data-point-filter-control__apply"
        );
        applyButton!.click();
        await Promise.resolve();

        expect(updateGlobalFilter).toHaveBeenLastCalledWith(
            expect.objectContaining({
                enabled: true,
                mode: "valueRange",
                minValue: 200,
                maxValue: 500,
            })
        );
        expect(showNotification).toHaveBeenCalledWith(
            "Showing Watts between 220 and 480 (55% coverage)",
            "success"
        );
        expect(onChange).toHaveBeenCalledWith(
            expect.objectContaining({
                action: "apply",
                result: expect.objectContaining({ mode: "valueRange" }),
            })
        );
        const summary = document.body.querySelector<HTMLParagraphElement>(
            ".data-point-filter-control__summary"
        );
        expect(summary?.textContent).toBe("Range summary");
    });

    it("clears range filters when preview returns an issue", async () => {
        expect.assertions(5);

        computeRangeState.mockReturnValue({
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
        });
        previewFilterResult.mockReturnValueOnce({
            isActive: true,
            metric: "temperature",
            mode: "valueRange",
            reason: "Insufficient points",
            selectedCount: 0,
            totalCandidates: 0,
        });
        const onChange = createOnChangeMock();

        const container = appendControl(createDataPointFilterControl(onChange));
        openPanel(container);
        await Promise.resolve();

        const rangeRadio = document.body.querySelector<HTMLInputElement>(
            "input[value='valueRange']"
        );
        rangeRadio!.checked = true;
        rangeRadio!.dispatchEvent(new Event("change", { bubbles: true }));

        const applyButton = document.body.querySelector<HTMLButtonElement>(
            ".data-point-filter-control__apply"
        );
        applyButton!.click();

        const summary = document.body.querySelector<HTMLParagraphElement>(
            ".data-point-filter-control__summary"
        );
        expect(summary?.textContent).toBe("Insufficient points");

        await Promise.resolve();

        expect(updateGlobalFilter).toHaveBeenLastCalledWith(
            expect.objectContaining({ enabled: false, mode: "valueRange" })
        );
        expect(showNotification).toHaveBeenCalledWith(
            "Insufficient points",
            "info"
        );
        expect(summary?.textContent).toBe(
            "Highlight the most intense sections of your ride."
        );
        expect(onChange).toHaveBeenCalledWith(
            expect.objectContaining({
                action: "clear",
                config: expect.objectContaining({ mode: "valueRange" }),
            })
        );
    });

    it("stops value range application when range stats are unavailable", async () => {
        expect.assertions(3);

        computeRangeState.mockReturnValue({
            stats: null,
            rangeValues: null,
            sliderValues: null,
        });

        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const rangeRadio = document.body.querySelector<HTMLInputElement>(
            "input[value='valueRange']"
        );
        rangeRadio!.checked = true;
        rangeRadio!.dispatchEvent(new Event("change", { bubbles: true }));

        const applyButton = document.body.querySelector<HTMLButtonElement>(
            ".data-point-filter-control__apply"
        );
        const summary = document.body.querySelector<HTMLParagraphElement>(
            ".data-point-filter-control__summary"
        );
        showNotification.mockClear();
        const callsBefore = updateGlobalFilter.mock.calls.length;
        applyButton!.click();

        expect(summary?.textContent).toBe(
            "Highlight the most intense sections of your ride."
        );
        expect(showNotification).toHaveBeenCalledWith(
            "No data points available for that metric.",
            "info"
        );
        expect(updateGlobalFilter).toHaveBeenCalledTimes(callsBefore);
    });

    it("disables value range filters when the preview returns no points or reason", async () => {
        expect.assertions(3);

        computeRangeState.mockReturnValue({
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
        });

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

        const rangeRadio = document.body.querySelector<HTMLInputElement>(
            "input[value='valueRange']"
        );
        rangeRadio!.checked = true;
        rangeRadio!.dispatchEvent(new Event("change", { bubbles: true }));

        const applyButton = document.body.querySelector<HTMLButtonElement>(
            ".data-point-filter-control__apply"
        );
        applyButton!.click();

        const summary = document.body.querySelector<HTMLParagraphElement>(
            ".data-point-filter-control__summary"
        );
        expect(summary?.textContent).toBe(
            "Filter disabled due to insufficient data."
        );
        expect(showNotification).toHaveBeenCalledWith(
            "No data points available for that range.",
            "info"
        );
        expect(updateGlobalFilter).toHaveBeenLastCalledWith(
            expect.objectContaining({ enabled: false, mode: "valueRange" })
        );
    });

    it("uses metric stats when cached range values are undefined", async () => {
        expect.assertions(2);

        computeRangeState.mockReturnValue({
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
        });
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

        const rangeRadio = document.body.querySelector<HTMLInputElement>(
            "input[value='valueRange']"
        );
        rangeRadio!.checked = true;
        rangeRadio!.dispatchEvent(new Event("change", { bubbles: true }));

        const applyButton = document.body.querySelector<HTMLButtonElement>(
            ".data-point-filter-control__apply"
        );
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
        const summary = document.body.querySelector<HTMLParagraphElement>(
            ".data-point-filter-control__summary"
        );
        expect(summary?.textContent).toBe("Stats fallback summary");
    });

    it("resets filter state appropriately for both modes", async () => {
        expect.assertions(5);

        computeRangeState.mockReturnValue({
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
        });
        const onChange = createOnChangeMock();

        const container = appendControl(createDataPointFilterControl(onChange));
        openPanel(container);
        await Promise.resolve();

        const resetButton = document.body.querySelector<HTMLButtonElement>(
            ".data-point-filter-control__reset"
        );
        const resetButtonElement = requireElement(resetButton, "reset button");
        resetButtonElement.click();
        await Promise.resolve();
        expect(updateGlobalFilter).toHaveBeenLastCalledWith(
            expect.objectContaining({ enabled: false, mode: "topPercent" })
        );
        expect(onChange).toHaveBeenCalledWith(
            expect.objectContaining({
                action: "clear",
                config: expect.objectContaining({ mode: "topPercent" }),
            })
        );
        expect(
            document.body.querySelector<HTMLParagraphElement>(
                ".data-point-filter-control__summary"
            )?.textContent
        ).toBe("Highlight the most intense sections of your ride.");
        const panelElement = requireElement(
            document.body.querySelector<HTMLDivElement>(
                ".data-point-filter-control__panel"
            ),
            "filter panel"
        );
        expect(panelElement).toHaveProperty("hidden", true);

        const rangeRadio = document.body.querySelector<HTMLInputElement>(
            "input[value='valueRange']"
        );
        rangeRadio!.checked = true;
        rangeRadio!.dispatchEvent(new Event("change", { bubbles: true }));
        resetButtonElement.click();
        await Promise.resolve();
        expect(updateGlobalFilter).toHaveBeenLastCalledWith(
            expect.objectContaining({
                enabled: false,
                mode: "valueRange",
                minValue: 10,
                maxValue: 20,
            })
        );
    });

    it("synchronizes range sliders and toggles mode when user adjusts values", async () => {
        expect.assertions(7);

        computeRangeState.mockReturnValue({
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
        });

        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const minSlider = document.body.querySelector<HTMLInputElement>(
            "input[id^='map-filter-range-min-']"
        );
        const maxSlider = document.body.querySelector<HTMLInputElement>(
            "input[id^='map-filter-range-max-']"
        );
        const rangeRadio = document.body.querySelector<HTMLInputElement>(
            "input[value='valueRange']"
        );
        const topPercentRadio = document.body.querySelector<HTMLInputElement>(
            "input[value='topPercent']"
        );
        const rangeValues = document.body.querySelector<HTMLDivElement>(
            ".data-point-filter-control__range-values"
        );

        const minSliderElement = requireElement(minSlider, "minimum slider");
        const maxSliderElement = requireElement(maxSlider, "maximum slider");
        expect(minSliderElement.type).toBe("range");
        expect(maxSliderElement.type).toBe("range");

        minSliderElement.value = "260";
        minSliderElement.dispatchEvent(new Event("input", { bubbles: true }));
        await Promise.resolve();

        expect(getRadioCheckedState(rangeRadio, topPercentRadio)).toStrictEqual(
            {
                range: true,
                topPercent: false,
            }
        );
        expect(rangeValues?.textContent).toContain("260");
        expect(maxSliderElement.value).toBe("260");

        minSliderElement.value = "350";
        minSliderElement.dispatchEvent(new Event("change", { bubbles: true }));
        await Promise.resolve();
        expect(maxSliderElement.value).toBe("300");
        expect(rangeValues?.textContent).toContain("300");
    });

    it("falls back to Promise microtasks when queueMicrotask is unavailable", async () => {
        expect.assertions(1);

        computeRangeState.mockReturnValue({
            rangeValues: { min: 110, max: 190 },
            sliderValues: { min: "110", max: "190" },
            stats: {
                decimals: 0,
                max: 210,
                metric: "power",
                metricLabel: "W",
                min: 90,
                step: 5,
            },
        });

        // Simulate environments (older Safari/Electron) that lack queueMicrotask.
        setTestGlobal("queueMicrotask", undefined);

        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const summary = document.body.querySelector<HTMLParagraphElement>(
            ".data-point-filter-control__summary"
        );
        const summaryElement = requireElement(summary, "summary");

        summaryElement.textContent = "Original summary";
        setMapDataPointFilterLastResult({
            applied: false,
            reason: "Fallback microtask refresh",
        });

        const metricSelect = document.body.querySelector<HTMLSelectElement>(
            ".data-point-filter-control__select"
        );
        metricSelect!.dispatchEvent(new Event("change", { bubbles: true }));

        // The fallback uses Promise.resolve().then(...); flush twice to cover chained jobs.
        await Promise.resolve();
        await Promise.resolve();

        expect(summaryElement.textContent).toBe("Fallback microtask refresh");
    });

    it("promotes slider interaction to value range mode when starting in top-percent", async () => {
        expect.assertions(3);

        setMapDataPointFilter({
            enabled: true,
            metric: "power",
            mode: "topPercent",
            percent: 15,
        });
        computeRangeState.mockReturnValue({
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
        });

        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const minSlider = document.body.querySelector<HTMLInputElement>(
            "input[id^='map-filter-range-min-']"
        );
        const maxSlider = document.body.querySelector<HTMLInputElement>(
            "input[id^='map-filter-range-max-']"
        );
        const rangeRadio = document.body.querySelector<HTMLInputElement>(
            "input[value='valueRange']"
        );
        const topPercentRadio = document.body.querySelector<HTMLInputElement>(
            "input[value='topPercent']"
        );

        const minSliderElement = requireElement(minSlider, "minimum slider");
        const maxSliderElement = requireElement(maxSlider, "maximum slider");
        expect(minSliderElement.type).toBe("range");
        expect(getRadioCheckedState(rangeRadio, topPercentRadio)).toStrictEqual(
            {
                range: false,
                topPercent: true,
            }
        );

        minSliderElement.value = "200";
        minSliderElement.dispatchEvent(new Event("input", { bubbles: true }));
        await Promise.resolve();

        maxSliderElement.value = "360";
        maxSliderElement.dispatchEvent(new Event("change", { bubbles: true }));
        await Promise.resolve();

        expect(getRadioCheckedState(rangeRadio, topPercentRadio)).toStrictEqual(
            {
                range: true,
                topPercent: false,
            }
        );
    });

    it("clamps percent input values on change events", async () => {
        expect.assertions(3);

        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const percentInput = document.body.querySelector<HTMLInputElement>(
            ".data-point-filter-control__input"
        );
        const percentInputElement = requireElement(
            percentInput,
            "percent input"
        );
        expect(percentInputElement.type).toBe("number");
        percentInputElement.value = "0";
        percentInputElement.dispatchEvent(
            new Event("change", { bubbles: true })
        );
        expect(percentInputElement.value).toBe("1");

        percentInputElement.value = "250";
        percentInputElement.dispatchEvent(
            new Event("change", { bubbles: true })
        );
        expect(percentInputElement.value).toBe("100");
    });

    it("applies value-range filters using preview-adjusted bounds", async () => {
        expect.assertions(5);

        computeRangeState.mockReturnValue({
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
        });
        previewFilterResult.mockReturnValueOnce({
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
        });
        buildSummaryText.mockReturnValueOnce("Power between 160 and 310");

        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const minSlider = document.body.querySelector<HTMLInputElement>(
            "input[id^='map-filter-range-min-']"
        );
        const maxSlider = document.body.querySelector<HTMLInputElement>(
            "input[id^='map-filter-range-max-']"
        );
        const applyButton = document.body.querySelector<HTMLButtonElement>(
            ".data-point-filter-control__apply"
        );
        const summary = document.body.querySelector<HTMLParagraphElement>(
            ".data-point-filter-control__summary"
        );

        minSlider!.value = "170";
        minSlider!.dispatchEvent(new Event("input", { bubbles: true }));
        maxSlider!.value = "330";
        maxSlider!.dispatchEvent(new Event("input", { bubbles: true }));

        applyButton!.click();
        await Promise.resolve();

        expect(updateGlobalFilter).toHaveBeenLastCalledWith(
            expect.objectContaining({
                mode: "valueRange",
                minValue: 170,
                maxValue: 330,
            })
        );
        expect(summary?.textContent).toBe("Power between 160 and 310");
        expect(showNotification).toHaveBeenLastCalledWith(
            "Showing Power between 160 and 310 (45% coverage)",
            "success"
        );

        // Sliders retain the preview-adjusted bounds after applying.
        expect(minSlider?.value).toBe("160");
        expect(maxSlider?.value).toBe("310");
    });

    it("applies value-range filters falling back to computed stats when sliders untouched", async () => {
        expect.assertions(2);

        computeRangeState.mockReturnValue({
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
        });
        previewFilterResult.mockReturnValueOnce({
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
        });
        buildSummaryText.mockReturnValueOnce("Cadence between 90 and 210");

        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const rangeRadio = document.body.querySelector<HTMLInputElement>(
            "input[value='valueRange']"
        );
        rangeRadio!.checked = true;
        rangeRadio!.dispatchEvent(new Event("change", { bubbles: true }));

        const applyButton = document.body.querySelector<HTMLButtonElement>(
            ".data-point-filter-control__apply"
        );
        const summary = document.body.querySelector<HTMLParagraphElement>(
            ".data-point-filter-control__summary"
        );

        applyButton!.click();
        await Promise.resolve();

        expect(updateGlobalFilter).toHaveBeenLastCalledWith(
            expect.objectContaining({
                mode: "valueRange",
                minValue: 90,
                maxValue: 210,
            })
        );
        expect(summary?.textContent).toBe("Cadence between 90 and 210");
    });

    it("recomputes range stats on metric change without preserving selection", async () => {
        expect.assertions(2);

        const metricCalls: Array<{
            metric: string;
            current: unknown;
            options: any;
        }> = [];
        computeRangeState.mockImplementation(
            (metric, currentRange, options) => {
                metricCalls.push({ metric, current: currentRange, options });
                return actualStateHelpers.computeRangeState(
                    metric,
                    currentRange,
                    options
                );
            }
        );

        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const metricSelect = document.body.querySelector<HTMLSelectElement>(
            ".data-point-filter-control__select"
        );
        const metricSelectElement = requireElement(
            metricSelect,
            "metric select"
        );
        expect(metricSelectElement.options.length).toBeGreaterThan(1);
        metricSelectElement.selectedIndex =
            (metricSelectElement.selectedIndex + 1) %
            metricSelectElement.options.length;
        metricSelectElement.dispatchEvent(
            new Event("change", { bubbles: true })
        );

        expect({
            hasEmptyRangeCall: metricCalls.some(
                (call) =>
                    call.current?.min === undefined &&
                    call.current?.max === undefined
            ),
            hasResetSelectionCall: metricCalls.some(
                (call) => call.options?.preserveSelection === false
            ),
        }).toStrictEqual({
            hasEmptyRangeCall: true,
            hasResetSelectionCall: true,
        });
    });

    it("disables range controls when stats are unavailable", async () => {
        expect.assertions(4);

        computeRangeState.mockReturnValue({
            stats: null,
            rangeValues: null,
            sliderValues: null,
        });

        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const rangeGroup = document.body.querySelector<HTMLDivElement>(
            ".data-point-filter-control__range"
        );
        const minSlider = document.body.querySelector<HTMLInputElement>(
            "input[id^='map-filter-range-min-']"
        );
        const maxSlider = document.body.querySelector<HTMLInputElement>(
            "input[id^='map-filter-range-max-']"
        );
        const rangeValues = document.body.querySelector<HTMLDivElement>(
            ".data-point-filter-control__range-values"
        );

        expect(rangeGroup?.dataset.disabled).toBe("true");
        expect({
            maxSliderDisabled: maxSlider?.disabled,
            minSliderDisabled: minSlider?.disabled,
        }).toStrictEqual({
            maxSliderDisabled: true,
            minSliderDisabled: true,
        });
        expect(rangeValues?.textContent).toBe("Range unavailable");

        minSlider?.dispatchEvent(new Event("input", { bubbles: true }));
        maxSlider?.dispatchEvent(new Event("change", { bubbles: true }));
        await Promise.resolve();
        expect(updateGlobalFilter).toHaveBeenCalledOnce();
    });

    it("handles non-numeric slider input gracefully", async () => {
        expect.assertions(4);

        const clampMock = vi
            .spyOn(stateHelpersModule, "clampRangeValue")
            .mockImplementation((value, stats) =>
                actualStateHelpers.clampRangeValue(value, stats)
            );
        computeRangeState.mockReturnValue({
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
        });

        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const minSlider = document.body.querySelector<HTMLInputElement>(
            "input[id^='map-filter-range-min-']"
        );
        const maxSlider = document.body.querySelector<HTMLInputElement>(
            "input[id^='map-filter-range-max-']"
        );
        const minSliderElement = requireElement(minSlider, "minimum slider");
        const maxSliderElement = requireElement(maxSlider, "maximum slider");
        expect(minSliderElement.value).toBe("175");
        expect(maxSliderElement.value).toBe("300");

        const minInternal = { value: minSliderElement.value };
        Object.defineProperty(minSliderElement, "value", {
            configurable: true,
            enumerable: true,
            get: () => minInternal.value,
            set: (val: string) => {
                minInternal.value = val;
            },
        });

        clampMock.mockClear();
        minInternal.value = "NaN";
        minSliderElement.dispatchEvent(new Event("input", { bubbles: true }));
        await Promise.resolve();
        expect(clampMock.mock.calls.some(([value]) => value === 175)).toBe(
            true
        );

        delete (minSliderElement as any).value;

        const maxInternal = { value: maxSliderElement.value };
        Object.defineProperty(maxSliderElement, "value", {
            configurable: true,
            enumerable: true,
            get: () => maxInternal.value,
            set: (val: string) => {
                maxInternal.value = val;
            },
        });

        clampMock.mockClear();
        maxInternal.value = "NaN";
        maxSliderElement.dispatchEvent(new Event("input", { bubbles: true }));
        await Promise.resolve();
        expect(clampMock.mock.calls.some(([value]) => value === 300)).toBe(
            true
        );

        delete (maxSliderElement as any).value;

        clampMock.mockRestore();
    });

    it("aligns the minimum slider when the maximum slider dips below it", async () => {
        expect.assertions(4);

        computeRangeState.mockReturnValue({
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
        });

        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const minSlider = document.body.querySelector<HTMLInputElement>(
            "input[id^='map-filter-range-min-']"
        );
        const maxSlider = document.body.querySelector<HTMLInputElement>(
            "input[id^='map-filter-range-max-']"
        );
        const rangeValues = document.body.querySelector<HTMLDivElement>(
            ".data-point-filter-control__range-values"
        );

        expect(minSlider?.value).toBe("90");
        expect(maxSlider?.value).toBe("140");

        maxSlider!.value = "80";
        maxSlider!.dispatchEvent(new Event("input", { bubbles: true }));
        await Promise.resolve();

        expect(minSlider?.value).toBe("80");
        expect(rangeValues?.textContent).toContain("80");
    });

    it("toggling the top percent radio hides range controls", async () => {
        expect.assertions(4);

        computeRangeState.mockReturnValue({
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
        });

        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const rangeRadio = document.body.querySelector<HTMLInputElement>(
            "input[value='valueRange']"
        );
        const topRadio = document.body.querySelector<HTMLInputElement>(
            "input[value='topPercent']"
        );
        const percentGroup = document.body.querySelector<HTMLDivElement>(
            ".data-point-filter-control__percent"
        );
        const rangeGroup = document.body.querySelector<HTMLDivElement>(
            ".data-point-filter-control__range"
        );

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
        expect.assertions(2);

        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const rafMock = globalThis.requestAnimationFrame as unknown as vi.Mock;
        const initialCalls = rafMock.mock.calls.length;
        window.dispatchEvent(new Event("scroll", { bubbles: true }));
        await Promise.resolve();
        expect(rafMock.mock.calls.length).toBeGreaterThan(initialCalls);

        const toggle = container.querySelector<HTMLButtonElement>(
            ".data-point-filter-control__toggle"
        );
        toggle!.click();
        await Promise.resolve();
        const callsAfterClose = rafMock.mock.calls.length;
        window.dispatchEvent(new Event("scroll", { bubbles: true }));
        await Promise.resolve();
        expect(rafMock).toHaveBeenCalledTimes(callsAfterClose);
    });

    it("repositions the panel based on viewport constraints", async () => {
        expect.assertions(4);

        const container = appendControl(createDataPointFilterControl());
        const toggle = container.querySelector<HTMLButtonElement>(
            ".data-point-filter-control__toggle"
        );
        toggle!.getBoundingClientRect = () =>
            ({
                bottom: 700,
                height: 40,
                left: 200,
                right: 240,
                top: 660,
                width: 40,
                x: 200,
                y: 660,
            }) as DOMRect;
        Object.defineProperty(window, "innerWidth", {
            value: 800,
            configurable: true,
        });
        Object.defineProperty(window, "innerHeight", {
            value: 720,
            configurable: true,
        });

        openPanel(container);
        await Promise.resolve();

        const panel = document.body.querySelector<HTMLDivElement>(
            ".data-point-filter-control__panel"
        );
        panel!.getBoundingClientRect = () =>
            ({
                bottom: 680,
                height: 120,
                left: 0,
                right: 0,
                top: 560,
                width: 320,
                x: 0,
                y: 560,
            }) as DOMRect;

        window.dispatchEvent(new Event("resize"));
        await Promise.resolve();

        expect(panel?.style.left).toMatch(/px/);
        expect(panel?.style.top).toMatch(/px/);
        expect(
            panel?.style.getPropertyValue("--data-point-filter-arrow-offset")
        ).toMatch(/px/);

        // Force reverse positioning by shrinking viewport height.
        Object.defineProperty(window, "innerHeight", {
            value: 650,
            configurable: true,
        });
        window.dispatchEvent(new Event("resize"));
        await Promise.resolve();
        expect(getClassList(requireElement(panel, "filter panel"))).toContain(
            "data-point-filter-control__panel--reverse"
        );
    });

    it("clamps the panel arrow offset when positioned near viewport edges", async () => {
        expect.assertions(3);

        const originalWidth = window.innerWidth;
        const originalHeight = window.innerHeight;

        const container = appendControl(createDataPointFilterControl());
        const toggle = container.querySelector<HTMLButtonElement>(
            ".data-point-filter-control__toggle"
        );

        Object.defineProperty(window, "innerWidth", {
            value: 720,
            configurable: true,
        });
        Object.defineProperty(window, "innerHeight", {
            value: 640,
            configurable: true,
        });

        toggle!.getBoundingClientRect = () =>
            ({
                bottom: 160,
                height: 32,
                left: 0,
                right: 32,
                top: 128,
                width: 32,
                x: 0,
                y: 128,
            }) as DOMRect;

        openPanel(container);
        await Promise.resolve();

        const panel = document.body.querySelector<HTMLDivElement>(
            ".data-point-filter-control__panel"
        );
        const panelElement = requireElement(panel, "filter panel");
        expect(panelElement).toHaveProperty("hidden", false);

        panelElement.getBoundingClientRect = () =>
            ({
                bottom: 240,
                height: 160,
                left: 0,
                right: 320,
                top: 80,
                width: 320,
                x: 0,
                y: 80,
            }) as DOMRect;

        window.dispatchEvent(new Event("resize"));
        await Promise.resolve();

        const leftClamp = Number.parseInt(
            panelElement.style.getPropertyValue(
                "--data-point-filter-arrow-offset"
            ),
            10
        );
        expect(leftClamp).toBe(14);

        toggle!.getBoundingClientRect = () =>
            ({
                bottom: 160,
                height: 32,
                left: 700,
                right: 732,
                top: 128,
                width: 32,
                x: 700,
                y: 128,
            }) as DOMRect;

        window.dispatchEvent(new Event("resize"));
        await Promise.resolve();

        const rightClamp = Number.parseInt(
            panelElement.style.getPropertyValue(
                "--data-point-filter-arrow-offset"
            ),
            10
        );
        expect(rightClamp).toBe(306);

        Object.defineProperty(window, "innerWidth", {
            value: originalWidth,
            configurable: true,
        });
        Object.defineProperty(window, "innerHeight", {
            value: originalHeight,
            configurable: true,
        });
    });

    it("skips repositioning when the panel reports zero dimensions", async () => {
        expect.assertions(3);

        const container = appendControl(createDataPointFilterControl());
        const toggle = container.querySelector<HTMLButtonElement>(
            ".data-point-filter-control__toggle"
        );
        toggle!.getBoundingClientRect = () =>
            ({
                bottom: 200,
                height: 32,
                left: 100,
                right: 132,
                top: 168,
                width: 32,
                x: 100,
                y: 168,
            }) as DOMRect;

        openPanel(container);
        await Promise.resolve();

        const panel = document.body.querySelector<HTMLDivElement>(
            ".data-point-filter-control__panel"
        );
        panel!.style.left = "10px";
        panel!.style.top = "20px";
        panel!.getBoundingClientRect = () =>
            ({
                bottom: 0,
                height: 0,
                left: 0,
                right: 0,
                top: 0,
                width: 0,
                x: 0,
                y: 0,
            }) as DOMRect;

        window.dispatchEvent(new Event("resize"));
        await Promise.resolve();

        expect(panel?.style.left).toBe("10px");
        expect(panel?.style.top).toBe("20px");
        expect(
            panel?.style.getPropertyValue("--data-point-filter-arrow-offset")
        ).toBe("");
    });

    it("refreshes summary from cached results and handles escape key", async () => {
        expect.assertions(6);

        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const summary = document.body.querySelector<HTMLParagraphElement>(
            ".data-point-filter-control__summary"
        );
        const summaryElement = requireElement(summary, "summary");
        expect(summaryElement.tagName).toBe("P");

        setMapDataPointFilterLastResult({
            applied: true,
            appliedMax: 300,
            appliedMin: 150,
            metric: "power",
            metricLabel: "Power",
            mode: "valueRange",
            percent: 40,
            selectedCount: 12,
            totalCandidates: 30,
        });
        (container as any).refreshSummary();
        expect(summaryElement.textContent).toContain("12 of 30");

        setMapDataPointFilterLastResult({
            applied: true,
            metric: "speed",
            metricLabel: "Speed",
            mode: "topPercent",
            percent: 20,
            selectedCount: 6,
            totalCandidates: 24,
        });
        (container as any).refreshSummary();
        expect(summaryElement.textContent).toContain("top 20%");

        setMapDataPointFilterLastResult({ reason: "Disabled" });
        (container as any).refreshSummary();
        expect(summaryElement.textContent).toBe("Disabled");

        setMapDataPointFilter({ enabled: false });
        setMapDataPointFilterLastResult(null);
        (container as any).refreshSummary();
        expect(summaryElement.textContent).toBe(
            "Highlight the most intense sections of your ride."
        );

        const event = new KeyboardEvent("keydown", {
            key: "Escape",
            bubbles: true,
        });
        container.dispatchEvent(event);
        await Promise.resolve();
        const panel = document.body.querySelector<HTMLDivElement>(
            ".data-point-filter-control__panel"
        );
        const panelElement = requireElement(panel, "filter panel");
        expect(panelElement).toHaveProperty("hidden", true);
    });

    it("falls back to candidate values and default coverage in cached summaries", async () => {
        expect.assertions(3);

        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const summary = document.body.querySelector<HTMLParagraphElement>(
            ".data-point-filter-control__summary"
        );
        const summaryElement = requireElement(summary, "summary");
        expect(summaryElement.textContent).toBe(
            "Highlight the most intense sections of your ride."
        );

        setMapDataPointFilterLastResult({
            applied: true,
            maxCandidate: 672.4,
            metric: "altitude",
            metricLabel: "Altitude",
            minCandidate: 512.1,
            mode: "valueRange",
            percent: 37,
            selectedCount: 4,
            totalCandidates: 9,
        });
        (container as any).refreshSummary();
        expect(summaryElement.textContent).toContain("37% coverage");

        setMapDataPointFilterLastResult({
            applied: true,
            maxCandidate: 12,
            metric: "speed",
            minCandidate: 6,
            mode: "valueRange",
            percent: "n/a",
            selectedCount: 1,
            totalCandidates: 10,
        } as any);
        (container as any).refreshSummary();
        expect(summaryElement.textContent).toContain("0% coverage");
    });

    it("preserves summaries when filter stays active and swallows refresh errors", async () => {
        expect.assertions(4);

        const container = appendControl(createDataPointFilterControl());
        openPanel(container);
        await Promise.resolve();

        const summary = document.body.querySelector<HTMLParagraphElement>(
            ".data-point-filter-control__summary"
        );
        const summaryElement = requireElement(summary, "summary");
        expect(summaryElement.textContent).toBe(
            "Highlight the most intense sections of your ride."
        );

        summaryElement.textContent = "Original summary";

        setMapDataPointFilter({ enabled: true });
        setMapDataPointFilterLastResult(null);
        (container as any).refreshSummary();
        expect(summaryElement.textContent).toBe("Original summary");

        const formatMetricValueSpy = vi
            .spyOn(stateHelpersModule, "formatMetricValue")
            .mockImplementation(() => {
                throw new Error("format failure");
            });

        setMapDataPointFilterLastResult({
            applied: true,
            metric: "speed",
            metricLabel: "Speed",
            mode: "valueRange",
            selectedCount: 0,
            totalCandidates: 0,
        } as any);

        summaryElement.textContent = "Stable summary";
        expect(() => (container as any).refreshSummary()).not.toThrow();
        expect(summaryElement.textContent).toBe("Stable summary");

        formatMetricValueSpy.mockRestore();
    });
});
