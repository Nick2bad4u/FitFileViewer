// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

type ThemeChangeHandler = (theme?: string) => void;
type UpdateAllHandler = (reason: string) => void;

interface TestWindow extends Window {
    ChartUpdater?: { updateAll: ReturnType<typeof vi.fn<UpdateAllHandler>> };
    chartUpdater?: { updateAll: ReturnType<typeof vi.fn<UpdateAllHandler>> };
    globalData?: Record<string, never>;
}

const { mockedChartStateManager } = vi.hoisted(() => ({
    mockedChartStateManager: {
        handleThemeChange: vi.fn<ThemeChangeHandler>(),
    },
}));

vi.mock(
    import("../../../../../utils/charts/core/chartStateManager.js"),
    () => ({
        chartStateManager: mockedChartStateManager,
    })
);

async function importModule(): Promise<
    typeof import("../../../../../utils/charts/theming/chartThemeListener.js")
> {
    return await import("../../../../../utils/charts/theming/chartThemeListener.js");
}

function testWindow(): TestWindow {
    return window as TestWindow;
}

function resetDocumentBody(): void {
    const freshBody = document.createElement("body");
    document.documentElement.replaceChild(freshBody, document.body);
}

function resetGlobals(): void {
    const currentWindow = testWindow();

    delete currentWindow.ChartUpdater;
    delete currentWindow.chartUpdater;
    delete currentWindow.globalData;
}

function buildSettingsDOM(): HTMLElement {
    const settings = document.createElement("div");
    settings.id = "settings";

    const slider1 = document.createElement("input");
    slider1.type = "range";
    slider1.min = "0";
    slider1.max = "100";
    slider1.value = "25";

    const slider2 = document.createElement("input");
    slider2.type = "range";
    slider2.min = "5";
    slider2.max = "5";
    slider2.value = "5";

    const toggleOn = document.createElement("div");
    toggleOn.className = "toggle-switch";
    const thumbOn = document.createElement("div");
    thumbOn.className = "toggle-thumb";
    thumbOn.style.left = "26px";
    toggleOn.append(thumbOn);

    const statusOn = document.createElement("span");
    statusOn.textContent = "On";

    const toggleOff = document.createElement("div");
    toggleOff.className = "toggle-switch";
    const thumbOff = document.createElement("div");
    thumbOff.className = "toggle-thumb";
    thumbOff.style.left = "0px";
    toggleOff.append(thumbOff);

    const statusOff = document.createElement("span");
    statusOff.textContent = "Off";

    settings.append(slider1, slider2, toggleOn, statusOn, toggleOff, statusOff);
    document.body.append(settings);

    return settings;
}

function expectSettingsThemeApplied(settings: HTMLElement): void {
    const sliderBackgrounds = Array.from(
        settings.querySelectorAll<HTMLInputElement>('input[type="range"]'),
        (slider) => slider.style.background
    );
    const toggleBackgrounds = Array.from(
        settings.querySelectorAll<HTMLElement>(".toggle-switch"),
        (toggle) => toggle.style.background
    );
    const statusColors = Array.from(
        settings.querySelectorAll<HTMLElement>(".toggle-switch + span"),
        (status) => status.style.color
    );

    expect(sliderBackgrounds).toHaveLength(2);
    expect(sliderBackgrounds[0]).toContain("25%");
    expect(sliderBackgrounds[1]).toContain("0%");
    expect(toggleBackgrounds).toStrictEqual([
        "var(--color-success)",
        "var(--color-border)",
    ]);
    expect(statusColors).toStrictEqual([
        "var(--color-success)",
        "var(--color-fg)",
    ]);
}

async function runWithCleanEnvironment(
    testBody: () => Promise<void> | void
): Promise<void> {
    resetDocumentBody();
    resetGlobals();
    mockedChartStateManager.handleThemeChange.mockReset();
    vi.spyOn(console, "error").mockReturnValue(undefined);
    vi.spyOn(console, "log").mockReturnValue(undefined);
    vi.spyOn(console, "warn").mockReturnValue(undefined);

    try {
        await testBody();
    } finally {
        vi.resetModules();
        vi.restoreAllMocks();
        vi.useRealTimers();
    }
}

describe("chartThemeListener", () => {
    it("sets up listener, debounces chart updates, and updates settings UI", async () => {
        expect.assertions(8);

        await runWithCleanEnvironment(async () => {
            const { setupChartThemeListener } = await importModule();
            const chartsContainer = document.createElement("div");
            const settings = buildSettingsDOM();
            testWindow().globalData = {};

            vi.useFakeTimers();
            setupChartThemeListener(chartsContainer, settings);
            document.body.dispatchEvent(
                new CustomEvent("themechange", { detail: { theme: "dark" } })
            );

            expect(
                mockedChartStateManager.handleThemeChange
            ).not.toHaveBeenCalled();

            vi.advanceTimersByTime(160);

            expect(
                mockedChartStateManager.handleThemeChange
            ).toHaveBeenCalledWith("dark");

            expect(settings.querySelectorAll(".toggle-switch")).toHaveLength(2);

            expectSettingsThemeApplied(settings);
        });
    });

    it("does not update charts when global data is unavailable", async () => {
        expect.assertions(7);

        await runWithCleanEnvironment(async () => {
            const { setupChartThemeListener } = await importModule();
            const chartsContainer = document.createElement("div");
            const settings = buildSettingsDOM();

            vi.useFakeTimers();
            setupChartThemeListener(chartsContainer, settings);
            document.body.dispatchEvent(
                new CustomEvent("themechange", { detail: { theme: "light" } })
            );
            vi.advanceTimersByTime(200);

            expect(
                mockedChartStateManager.handleThemeChange
            ).not.toHaveBeenCalled();

            expect(settings.querySelectorAll(".toggle-switch")).toHaveLength(2);

            expectSettingsThemeApplied(settings);
        });
    });

    it("falls back to ChartUpdater when chartStateManager is unavailable", async () => {
        expect.assertions(7);

        await runWithCleanEnvironment(async () => {
            vi.resetModules();
            vi.doMock(
                import("../../../../../utils/charts/core/chartStateManager.js"),
                () => ({ chartStateManager: null })
            );

            const { setupChartThemeListener } = await importModule();
            const settings = buildSettingsDOM();
            const updateAll = vi.fn<UpdateAllHandler>();
            testWindow().globalData = {};
            testWindow().ChartUpdater = { updateAll };

            vi.useFakeTimers();
            setupChartThemeListener(document.createElement("div"), settings);
            document.body.dispatchEvent(
                new CustomEvent("themechange", { detail: { theme: "dark" } })
            );
            vi.advanceTimersByTime(200);

            expect(updateAll).toHaveBeenCalledWith("Theme change");

            expect(settings.querySelectorAll(".toggle-switch")).toHaveLength(2);

            expectSettingsThemeApplied(settings);
        });
    });

    it("falls back to chartUpdater when ChartUpdater is unavailable", async () => {
        expect.assertions(7);

        await runWithCleanEnvironment(async () => {
            vi.resetModules();
            vi.doMock(
                import("../../../../../utils/charts/core/chartStateManager.js"),
                () => ({ chartStateManager: null })
            );

            const { setupChartThemeListener } = await importModule();
            const settings = buildSettingsDOM();
            const updateAll = vi.fn<UpdateAllHandler>();
            testWindow().globalData = {};
            testWindow().chartUpdater = { updateAll };

            vi.useFakeTimers();
            setupChartThemeListener(document.createElement("div"), settings);
            document.body.dispatchEvent(
                new CustomEvent("themechange", { detail: { theme: "dark" } })
            );
            vi.advanceTimersByTime(200);

            expect(updateAll).toHaveBeenCalledWith("Theme change");

            expect(settings.querySelectorAll(".toggle-switch")).toHaveLength(2);

            expectSettingsThemeApplied(settings);
        });
    });

    it("warns when no chart update mechanism is available", async () => {
        expect.assertions(7);

        await runWithCleanEnvironment(async () => {
            vi.resetModules();
            vi.doMock(
                import("../../../../../utils/charts/core/chartStateManager.js"),
                () => ({ chartStateManager: null })
            );

            const { setupChartThemeListener } = await importModule();
            const settings = buildSettingsDOM();
            testWindow().globalData = {};

            vi.useFakeTimers();
            setupChartThemeListener(document.createElement("div"), settings);
            document.body.dispatchEvent(
                new CustomEvent("themechange", { detail: { theme: "dark" } })
            );
            vi.advanceTimersByTime(200);

            expect(console.warn).toHaveBeenCalledWith(
                "[ChartThemeListener] No chart update mechanism available"
            );

            expect(settings.querySelectorAll(".toggle-switch")).toHaveLength(2);

            expectSettingsThemeApplied(settings);
        });
    });

    it("removes the active theme listener", async () => {
        expect.assertions(2);

        await runWithCleanEnvironment(async () => {
            const { removeChartThemeListener, setupChartThemeListener } =
                await importModule();
            const settings = buildSettingsDOM();
            testWindow().globalData = {};

            vi.useFakeTimers();
            setupChartThemeListener(document.createElement("div"), settings);
            removeChartThemeListener();
            document.body.dispatchEvent(
                new CustomEvent("themechange", { detail: { theme: "dark" } })
            );
            vi.advanceTimersByTime(200);

            expect(
                mockedChartStateManager.handleThemeChange
            ).not.toHaveBeenCalled();
            expect(
                settings.querySelector<HTMLInputElement>('input[type="range"]')
                    ?.style.background
            ).toBe("");
        });
    });

    it("force updates charts immediately and updates settings UI", async () => {
        expect.assertions(7);

        await runWithCleanEnvironment(async () => {
            vi.resetModules();
            vi.doMock(
                import("../../../../../utils/charts/core/chartStateManager.js"),
                () => ({ chartStateManager: null })
            );

            const { forceUpdateChartTheme } = await importModule();
            const updateAll = vi.fn<UpdateAllHandler>();
            const settings = buildSettingsDOM();
            testWindow().globalData = {};
            testWindow().ChartUpdater = { updateAll };

            forceUpdateChartTheme(document.createElement("div"), settings);

            expect(updateAll).toHaveBeenCalledWith("Force theme update");

            expect(settings.querySelectorAll(".toggle-switch")).toHaveLength(2);

            expectSettingsThemeApplied(settings);
        });
    });

    it("force update falls back to chartUpdater", async () => {
        expect.assertions(8);

        await runWithCleanEnvironment(async () => {
            vi.resetModules();
            vi.doMock(
                import("../../../../../utils/charts/core/chartStateManager.js"),
                () => ({ chartStateManager: null })
            );

            const { forceUpdateChartTheme } = await importModule();
            const updateAll = vi.fn<UpdateAllHandler>();
            const settings = buildSettingsDOM();
            testWindow().globalData = {};
            testWindow().chartUpdater = { updateAll };

            expect(() =>
                forceUpdateChartTheme(document.createElement("div"), settings)
            ).not.toThrow();

            expect(updateAll).toHaveBeenCalledWith("Force theme update");

            expect(settings.querySelectorAll(".toggle-switch")).toHaveLength(2);

            expectSettingsThemeApplied(settings);
        });
    });

    it("force update warns when no chart update mechanism is available", async () => {
        expect.assertions(8);

        await runWithCleanEnvironment(async () => {
            vi.resetModules();
            vi.doMock(
                import("../../../../../utils/charts/core/chartStateManager.js"),
                () => ({ chartStateManager: null })
            );

            const { forceUpdateChartTheme } = await importModule();
            const settings = buildSettingsDOM();
            testWindow().globalData = {};

            expect(() =>
                forceUpdateChartTheme(document.createElement("div"), settings)
            ).not.toThrow();

            expect(console.warn).toHaveBeenCalledWith(
                "[ChartThemeListener] No chart update mechanism available for force update"
            );

            expect(settings.querySelectorAll(".toggle-switch")).toHaveLength(2);

            expectSettingsThemeApplied(settings);
        });
    });
});
