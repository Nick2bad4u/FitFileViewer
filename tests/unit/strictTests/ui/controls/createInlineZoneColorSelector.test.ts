import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
    clearChartInstanceRegistryForTests,
    setRegisteredChartInstances,
} from "../../../../../electron-app/utils/charts/core/chartInstanceRegistry.js";
import {
    registerChartStateManager,
    resetChartStateManagerRegistryForTests,
} from "../../../../../electron-app/utils/charts/core/chartStateManagerRegistry.js";
import {
    clearZoneDataState,
    setZoneDataByType,
} from "../../../../../electron-app/utils/data/zones/zoneDataState.js";

type ZoneFixture = {
    label: string;
    time: number;
    zone: number;
};

type ZoneType = "hr" | "power";

type InlineZoneSelectorElement = HTMLDivElement & {
    _updateDisplay: () => void;
};

type ChartCandidate = {
    data?: {
        datasets?: Array<{
            backgroundColor?: string[];
            label?: string;
        }>;
    };
    update?: (mode?: string) => void;
};

// Hoisted mocks to satisfy Vitest's hoisting of vi.mock
const hoisted = vi.hoisted(() => {
    const renderChartJS = vi.fn<() => void>();
    const showNotification = vi.fn<
        (message: string, type?: string) => Promise<void>
    >(async () => {});
    const debouncedRender = vi.fn<(reason?: string) => void>();

    const DEFAULT_HR_ZONE_COLORS = [
        "#a",
        "#b",
        "#c",
    ];
    const DEFAULT_POWER_ZONE_COLORS = [
        "#1",
        "#2",
        "#3",
        "#4",
    ];
    const storeChartSpecific: Record<string, string> = {};
    const storeGeneric: Record<string, string> = {};
    const schemeStore: Record<string, string> = {};
    const getChartSpecificZoneColor = vi.fn<
        (field: string, idx: number) => string
    >(
        (field: string, idx: number) =>
            storeChartSpecific[`${field}:${idx}`] || "#000000"
    );
    const getStoredChartSpecificZoneColor = vi.fn<
        (field: string, idx: number) => null | string
    >(
        (field: string, idx: number) =>
            storeChartSpecific[`${field}:${idx}`] || null
    );
    const getStoredZoneColor = vi.fn<
        (type: string, idx: number) => null | string
    >((type: string, idx: number) => storeGeneric[`${type}:${idx}`] || null);
    const saveChartSpecificZoneColor = vi.fn<
        (field: string, idx: number, val: string) => void
    >((field: string, idx: number, val: string) => {
        storeChartSpecific[`${field}:${idx}`] = val;
    });
    const saveZoneColor = vi.fn<
        (type: string, idx: number, val: string) => void
    >((type: string, idx: number, val: string) => {
        storeGeneric[`${type}:${idx}`] = val;
    });
    const removeChartSpecificZoneColor = vi.fn<
        (field: string, idx: number) => void
    >((field: string, idx: number) => {
        delete storeChartSpecific[`${field}:${idx}`];
    });
    const removeZoneColor = vi.fn<(type: string, idx: number) => void>(
        (type: string, idx: number) => {
            delete storeGeneric[`${type}:${idx}`];
        }
    );
    const getChartColorScheme = vi.fn<(field: string) => string>(
        (field: string) => schemeStore[field] || "custom"
    );
    const setChartColorScheme = vi.fn<
        (field: string, scheme: string) => string
    >((field: string, scheme: string) => {
        schemeStore[field] = scheme;
        return scheme;
    });
    const clearChartColorScheme = vi.fn<(field: string) => boolean>(
        (field: string) => {
            delete schemeStore[field];
            return true;
        }
    );
    const resetChartSpecificZoneColors = vi.fn<
        (field: string, count: number) => void
    >((field: string, count: number) => {
        for (let i = 0; i < count; i++)
            delete storeChartSpecific[`${field}:${i}`];
    });
    const resetZoneColors = vi.fn<(type: string, count: number) => void>(
        (type: string, count: number) => {
            for (let i = 0; i < count; i++) delete storeGeneric[`${type}:${i}`];
        }
    );
    const getChartZoneColors = vi.fn<
        (zoneType: string, count: number, scheme: string) => string[]
    >((zoneType: string, count: number, scheme: string) =>
        Array.from({ length: count }, (_, i) => `#S-${scheme}-${i}`)
    );
    const applyZoneColors = vi.fn<
        (zones: ZoneFixture[], type: string) => ZoneFixture[]
    >((zones: ZoneFixture[], _type: string) => zones);
    const getZoneTypeFromField = vi.fn<(field: string) => ZoneType>(
        (field: string) => (field.includes("hr") ? "hr" : "power")
    );

    // Cache invalidation helper used by the selector when switching schemes.
    const clearCachedChartZoneColor =
        vi.fn<(field: string, idx: number) => void>();

    return {
        renderChartJS,
        showNotification,
        debouncedRender,
        DEFAULT_HR_ZONE_COLORS,
        DEFAULT_POWER_ZONE_COLORS,
        storeChartSpecific,
        storeGeneric,
        schemeStore,
        getChartSpecificZoneColor,
        getStoredChartSpecificZoneColor,
        getStoredZoneColor,
        saveChartSpecificZoneColor,
        saveZoneColor,
        removeChartSpecificZoneColor,
        removeZoneColor,
        getChartColorScheme,
        setChartColorScheme,
        clearChartColorScheme,
        resetChartSpecificZoneColors,
        resetZoneColors,
        getChartZoneColors,
        applyZoneColors,
        getZoneTypeFromField,
        clearCachedChartZoneColor,
    };
});

// Use the real formatTime implementation to avoid hoisting/TDZ issues
vi.mock(
    import("../../../../../electron-app/utils/charts/core/renderChartJS.js"),
    () => ({
        renderChartJS: hoisted.renderChartJS,
    })
);
vi.mock(
    import("../../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: hoisted.showNotification,
    })
);
vi.mock(
    import("../../../../../electron-app/utils/data/zones/chartZoneColorUtils.js"),
    () => ({
        DEFAULT_HR_ZONE_COLORS: hoisted.DEFAULT_HR_ZONE_COLORS,
        DEFAULT_POWER_ZONE_COLORS: hoisted.DEFAULT_POWER_ZONE_COLORS,
        applyZoneColors: hoisted.applyZoneColors,
        clearChartColorScheme: hoisted.clearChartColorScheme,
        getChartSpecificZoneColor: hoisted.getChartSpecificZoneColor,
        getChartColorScheme: hoisted.getChartColorScheme,
        getStoredChartSpecificZoneColor:
            hoisted.getStoredChartSpecificZoneColor,
        getStoredZoneColor: hoisted.getStoredZoneColor,
        getChartZoneColors: hoisted.getChartZoneColors,
        getZoneTypeFromField: hoisted.getZoneTypeFromField,
        removeChartSpecificZoneColor: hoisted.removeChartSpecificZoneColor,
        removeZoneColor: hoisted.removeZoneColor,
        resetChartSpecificZoneColors: hoisted.resetChartSpecificZoneColors,
        resetZoneColors: hoisted.resetZoneColors,
        saveChartSpecificZoneColor: hoisted.saveChartSpecificZoneColor,
        saveZoneColor: hoisted.saveZoneColor,
        setChartColorScheme: hoisted.setChartColorScheme,
    })
);

// Under test
import {
    createInlineZoneColorSelector,
    removeInlineZoneColorSelectors,
    updateInlineZoneColorSelectors,
    clearZoneColorData,
    getCurrentColorScheme,
} from "../../../../../electron-app/utils/ui/controls/createInlineZoneColorSelector.js";

describe(createInlineZoneColorSelector, () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        document.body.replaceChildren();
        clearChartInstanceRegistryForTests();
        resetChartStateManagerRegistryForTests();
        registerChartStateManager({
            debouncedRender: hoisted.debouncedRender,
        });
        clearZoneDataState();
        localStorage.clear();
        setZoneDataByType("hr", [
            { label: "Z1", zone: 1, time: 10 },
            { label: "Z2", zone: 2, time: 20 },
            { label: "Z3", zone: 3, time: 30 },
        ]);
        setZoneDataByType("power", [
            { label: "P1", zone: 1, time: 5 },
            { label: "P2", zone: 2, time: 15 },
            { label: "P3", zone: 3, time: 25 },
            { label: "P4", zone: 4, time: 35 },
        ]);
    });

    afterEach(() => {
        vi.useRealTimers();
        document.body.replaceChildren();
        resetChartStateManagerRegistryForTests();
    });

    it("creates HR zone selector and applies initial scheme when none customized", () => {
        expect.assertions(4);

        const container = document.createElement("div");
        document.body.appendChild(container);
        const el = createInlineZoneColorSelector("hr_zone", container);
        expect(el).toBeInstanceOf(HTMLDivElement);
        expect(el?.classList.contains("inline-zone-color-selector")).toBe(true);
        expect(container.querySelectorAll(".zone-color-item")).toHaveLength(3);
        // Initial timers apply scheme if not custom
        vi.advanceTimersByTime(20);
        expect(hoisted.getZoneTypeFromField).toHaveBeenCalledWith("hr_zone");
    });

    it("creates Power zone selector and scheme change updates generic colors and triggers rerender", () => {
        expect.assertions(5);

        const container = document.createElement("div");
        document.body.appendChild(container);
        const el = createInlineZoneColorSelector(
            "power_zone",
            container
        ) as InlineZoneSelectorElement;
        expect(el).toBeInstanceOf(HTMLDivElement);
        expect(el.classList.contains("inline-zone-color-selector")).toBe(true);
        // Change scheme from default custom to vibrant
        const select = container.querySelector("select") as HTMLSelectElement;
        select.value = "vibrant";
        select.dispatchEvent(new Event("change"));
        // saveZoneColor called for each zone
        expect(hoisted.saveZoneColor).toHaveBeenCalledWith(
            "power",
            0,
            "#S-vibrant-0"
        );
        expect(hoisted.debouncedRender).toHaveBeenCalledWith(
            "Zone scheme change: vibrant"
        );
        expect(hoisted.showNotification).toHaveBeenCalledWith(
            "Applied Vibrant color scheme",
            "success"
        );
    });

    it("changing a color switches scheme to custom and updates storages and preview", () => {
        expect.assertions(7);

        const container = document.createElement("div");
        document.body.appendChild(container);
        const el = createInlineZoneColorSelector(
            "hr_zone",
            container
        ) as InlineZoneSelectorElement;
        expect(el).toBeInstanceOf(HTMLDivElement);
        expect(el.classList.contains("inline-zone-color-selector")).toBe(true);
        const item = container.querySelector(".zone-color-item") as HTMLElement;
        const input = item.querySelector(
            ".zone-color-input"
        ) as HTMLInputElement;
        const preview = item.querySelector(
            ".zone-color-preview"
        ) as HTMLElement;
        input.value = "#ff0000";
        input.dispatchEvent(new Event("change"));
        expect(hoisted.setChartColorScheme).toHaveBeenCalledWith(
            "hr_zone",
            "custom"
        );
        expect(hoisted.saveChartSpecificZoneColor).toHaveBeenCalledWith(
            "hr_zone",
            0,
            "#ff0000"
        );
        expect(hoisted.saveZoneColor).toHaveBeenCalledWith("hr", 0, "#ff0000");
        expect(hoisted.debouncedRender).toHaveBeenCalledWith(
            "Zone color change: zone 0"
        );
        const bg = getComputedStyle(preview).backgroundColor;
        expect(
            bg === "#ff0000" || /rgb\(\s*255\s*,\s*0\s*,\s*0\s*\)/i.test(bg)
        ).toBe(true);
    });

    it("ignores array-shaped chart candidates when updating previews", () => {
        expect.assertions(4);

        const update = vi.fn<(mode?: string) => void>();
        const arrayChart = [] as unknown[] & ChartCandidate;
        arrayChart.data = {
            datasets: [
                {
                    label: "Heart Rate Zones",
                    backgroundColor: ["#000000"],
                },
            ],
        };
        arrayChart.update = update;
        setRegisteredChartInstances([arrayChart]);

        const container = document.createElement("div");
        document.body.append(container);
        const el = createInlineZoneColorSelector(
            "hr_zone",
            container
        ) as InlineZoneSelectorElement;
        expect(el).toBeInstanceOf(HTMLDivElement);

        const input =
            container.querySelector<HTMLInputElement>(".zone-color-input");
        expect(input).toBeInstanceOf(HTMLInputElement);
        if (!input) {
            throw new Error("Zone color input not rendered");
        }
        input.value = "#ff0000";
        input.dispatchEvent(new Event("change"));

        expect(arrayChart.data.datasets[0]?.backgroundColor?.[0]).toBe(
            "#000000"
        );
        expect(update).not.toHaveBeenCalled();
    });

    it("reset button clears storages and triggers rerender and update of all selectors", () => {
        expect.assertions(9);

        const container = document.createElement("div");
        document.body.appendChild(container);
        const el = createInlineZoneColorSelector(
            "hr_zone",
            container
        ) as InlineZoneSelectorElement;
        expect(el).toBeInstanceOf(HTMLDivElement);
        expect(el.classList.contains("inline-zone-color-selector")).toBe(true);
        // Add a second selector to verify updateInlineZoneColorSelectors behavior
        const el2 = createInlineZoneColorSelector(
            "hr_zone",
            container
        ) as InlineZoneSelectorElement;
        expect(el2).toBeInstanceOf(HTMLDivElement);
        expect(el2.classList.contains("inline-zone-color-selector")).toBe(true);
        // Spy the _updateDisplay on both
        const upd1 = vi.spyOn(el, "_updateDisplay");
        const upd2 = vi.spyOn(el2, "_updateDisplay");

        // Click reset
        const reset = container.querySelector("button") as HTMLButtonElement;
        reset.click();
        expect(hoisted.resetChartSpecificZoneColors).toHaveBeenCalledWith(
            "hr_zone",
            3
        );
        expect(hoisted.resetZoneColors).toHaveBeenCalledWith("hr", 3);
        expect(hoisted.debouncedRender).toHaveBeenCalledWith(
            "Zone colors reset for hr"
        );
        expect(upd1).toHaveBeenCalledWith();
        expect(upd2).toHaveBeenCalledWith();
    });

    it("helpers: remove and update inline selectors, clearZoneColorData and getCurrentColorScheme", () => {
        expect.assertions(9);

        const container = document.createElement("div");
        document.body.appendChild(container);
        const el = createInlineZoneColorSelector(
            "hr_zone",
            container
        ) as InlineZoneSelectorElement;
        expect(el).toBeInstanceOf(HTMLDivElement);
        expect(el.classList.contains("inline-zone-color-selector")).toBe(true);

        // updateInlineZoneColorSelectors calls _updateDisplay
        const upd = vi.spyOn(el, "_updateDisplay");
        updateInlineZoneColorSelectors(container);
        expect(upd).toHaveBeenCalledWith();

        // clear
        clearZoneColorData("hr_zone", 3);
        expect(hoisted.clearChartColorScheme).toHaveBeenCalledWith("hr_zone");
        expect(hoisted.removeChartSpecificZoneColor).toHaveBeenCalledWith(
            "hr_zone",
            0
        );
        expect(hoisted.removeZoneColor).toHaveBeenCalledWith("hr", 0);

        // remove
        removeInlineZoneColorSelectors(container);
        expect(
            container.querySelector(".inline-zone-color-selector")
        ).toBeNull();

        // scheme getter
        expect(getCurrentColorScheme("hr_zone")).toBe("custom");
        hoisted.setChartColorScheme("hr_zone", "classic");
        expect(getCurrentColorScheme("hr_zone")).toBe("classic");
    });
});
