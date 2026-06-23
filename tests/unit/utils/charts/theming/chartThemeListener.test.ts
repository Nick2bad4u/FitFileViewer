// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

type ThemeChangeHandler = (theme?: string) => void;
type UpdateChartsHandler = (reason: string) => Promise<boolean>;

const { mockedChartStateManager } = vi.hoisted(() => ({
    mockedChartStateManager: {
        handleThemeChange: vi.fn<ThemeChangeHandler>(),
    },
}));
const updateChartsMock = vi.hoisted(() =>
    vi.fn<UpdateChartsHandler>(() => Promise.resolve(true))
);
const getRegisteredChartStateManagerMock = vi.hoisted(() =>
    vi.fn(() => mockedChartStateManager)
);

vi.mock(
    import("../../../../../electron-app/utils/charts/core/chartStateManagerRegistry.js"),
    () => ({
        getRegisteredChartStateManager: getRegisteredChartStateManagerMock,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/charts/core/chartUpdater.js"),
    () => ({
        updateCharts: updateChartsMock,
    })
);

function mockChartUpdaterModule(): void {
    vi.doMock(
        import("../../../../../electron-app/utils/charts/core/chartUpdater.js"),
        () => ({
            updateCharts: updateChartsMock,
        })
    );
}

async function importModule(): Promise<
    typeof import("../../../../../electron-app/utils/charts/theming/chartThemeListener.js")
> {
    return await import("../../../../../electron-app/utils/charts/theming/chartThemeListener.js");
}

async function resetManagedState(): Promise<void> {
    const { __resetStateManagerForTests } =
        await import("../../../../../electron-app/utils/state/core/stateManager.js");
    __resetStateManagerForTests();
}

async function setManagedGlobalData(data: unknown): Promise<void> {
    const { setActiveFitRawData } =
        await import("../../../../../electron-app/utils/state/domain/activeFitRawDataState.js");
    setActiveFitRawData(data);
}

function resetDocumentBody(): void {
    const freshBody = document.createElement("body");
    document.documentElement.replaceChild(freshBody, document.body);
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
    await resetManagedState();
    resetDocumentBody();
    mockedChartStateManager.handleThemeChange.mockReset();
    getRegisteredChartStateManagerMock.mockReset();
    getRegisteredChartStateManagerMock.mockReturnValue(mockedChartStateManager);
    updateChartsMock.mockReset();
    updateChartsMock.mockResolvedValue(true);
    vi.spyOn(console, "error").mockReturnValue(undefined);
    vi.spyOn(console, "log").mockReturnValue(undefined);
    vi.spyOn(console, "warn").mockReturnValue(undefined);

    try {
        await testBody();
    } finally {
        await resetManagedState();
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
            await setManagedGlobalData({ recordMesgs: [{}] });

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

    it("uses typed chart updates when chartStateManager is unavailable", async () => {
        expect.assertions(7);

        await runWithCleanEnvironment(async () => {
            vi.resetModules();
            vi.doMock(
                import("../../../../../electron-app/utils/charts/core/chartStateManagerRegistry.js"),
                () => ({
                    getRegisteredChartStateManager: () => null,
                })
            );
            mockChartUpdaterModule();

            const { setupChartThemeListener } = await importModule();
            const settings = buildSettingsDOM();
            await setManagedGlobalData({ recordMesgs: [{}] });

            vi.useFakeTimers();
            setupChartThemeListener(document.createElement("div"), settings);
            document.body.dispatchEvent(
                new CustomEvent("themechange", { detail: { theme: "dark" } })
            );
            vi.advanceTimersByTime(200);
            await Promise.resolve();
            await Promise.resolve();

            expect(updateChartsMock).toHaveBeenCalledWith("Theme change");

            expect(settings.querySelectorAll(".toggle-switch")).toHaveLength(2);

            expectSettingsThemeApplied(settings);
        });
    });

    it("warns when typed chart updates fail", async () => {
        expect.assertions(7);

        await runWithCleanEnvironment(async () => {
            vi.resetModules();
            vi.doMock(
                import("../../../../../electron-app/utils/charts/core/chartStateManagerRegistry.js"),
                () => ({
                    getRegisteredChartStateManager: () => null,
                })
            );
            mockChartUpdaterModule();

            const { setupChartThemeListener } = await importModule();
            const settings = buildSettingsDOM();
            const error = new Error("update failed");
            updateChartsMock.mockRejectedValueOnce(error);
            await setManagedGlobalData({ recordMesgs: [{}] });

            vi.useFakeTimers();
            setupChartThemeListener(document.createElement("div"), settings);
            document.body.dispatchEvent(
                new CustomEvent("themechange", { detail: { theme: "dark" } })
            );
            vi.advanceTimersByTime(200);
            await Promise.resolve();
            await Promise.resolve();

            expect(console.warn).toHaveBeenCalledWith(
                "[ChartThemeListener] No chart update mechanism available",
                error
            );

            expect(settings.querySelectorAll(".toggle-switch")).toHaveLength(2);

            expectSettingsThemeApplied(settings);
        });
    });

    it("does not warn when typed fallback chart updates succeed", async () => {
        expect.assertions(7);

        await runWithCleanEnvironment(async () => {
            vi.resetModules();
            vi.doMock(
                import("../../../../../electron-app/utils/charts/core/chartStateManagerRegistry.js"),
                () => ({
                    getRegisteredChartStateManager: () => null,
                })
            );
            mockChartUpdaterModule();

            const { setupChartThemeListener } = await importModule();
            const settings = buildSettingsDOM();
            await setManagedGlobalData({ recordMesgs: [{}] });

            vi.useFakeTimers();
            setupChartThemeListener(document.createElement("div"), settings);
            document.body.dispatchEvent(
                new CustomEvent("themechange", { detail: { theme: "dark" } })
            );
            vi.advanceTimersByTime(200);
            await Promise.resolve();
            await Promise.resolve();

            expect(console.warn).not.toHaveBeenCalledWith(
                "[ChartThemeListener] No chart update mechanism available",
                expect.anything()
            );

            expect(settings.querySelectorAll(".toggle-switch")).toHaveLength(2);

            expectSettingsThemeApplied(settings);
        });
    });

    it("removes the active theme listener and cancels pending theme updates", async () => {
        expect.assertions(2);

        await runWithCleanEnvironment(async () => {
            const { removeChartThemeListener, setupChartThemeListener } =
                await importModule();
            const settings = buildSettingsDOM();
            await setManagedGlobalData({ recordMesgs: [{}] });

            vi.useFakeTimers();
            setupChartThemeListener(document.createElement("div"), settings);
            document.body.dispatchEvent(
                new CustomEvent("themechange", { detail: { theme: "dark" } })
            );
            removeChartThemeListener();
            document.body.dispatchEvent(
                new CustomEvent("themechange", { detail: { theme: "light" } })
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
                import("../../../../../electron-app/utils/charts/core/chartStateManagerRegistry.js"),
                () => ({
                    getRegisteredChartStateManager: () => null,
                })
            );
            mockChartUpdaterModule();

            const { forceUpdateChartTheme } = await importModule();
            const settings = buildSettingsDOM();
            await setManagedGlobalData({ recordMesgs: [{}] });

            forceUpdateChartTheme(document.createElement("div"), settings);
            await Promise.resolve();
            await Promise.resolve();

            expect(updateChartsMock).toHaveBeenCalledWith("Force theme update");

            expect(settings.querySelectorAll(".toggle-switch")).toHaveLength(2);

            expectSettingsThemeApplied(settings);
        });
    });

    it("force update warns when typed chart update fails", async () => {
        expect.assertions(8);

        await runWithCleanEnvironment(async () => {
            vi.resetModules();
            vi.doMock(
                import("../../../../../electron-app/utils/charts/core/chartStateManagerRegistry.js"),
                () => ({
                    getRegisteredChartStateManager: () => null,
                })
            );
            mockChartUpdaterModule();

            const { forceUpdateChartTheme } = await importModule();
            const error = new Error("force update failed");
            const settings = buildSettingsDOM();
            updateChartsMock.mockRejectedValueOnce(error);
            await setManagedGlobalData({ recordMesgs: [{}] });

            expect(() =>
                forceUpdateChartTheme(document.createElement("div"), settings)
            ).not.toThrow();

            await Promise.resolve();
            await Promise.resolve();

            expect(console.warn).toHaveBeenCalledWith(
                "[ChartThemeListener] No chart update mechanism available for force update",
                error
            );

            expect(settings.querySelectorAll(".toggle-switch")).toHaveLength(2);

            expectSettingsThemeApplied(settings);
        });
    });

    it("force update does not warn when typed fallback chart updates succeed", async () => {
        expect.assertions(8);

        await runWithCleanEnvironment(async () => {
            vi.resetModules();
            vi.doMock(
                import("../../../../../electron-app/utils/charts/core/chartStateManagerRegistry.js"),
                () => ({
                    getRegisteredChartStateManager: () => null,
                })
            );
            mockChartUpdaterModule();

            const { forceUpdateChartTheme } = await importModule();
            const settings = buildSettingsDOM();
            await setManagedGlobalData({ recordMesgs: [{}] });

            expect(() =>
                forceUpdateChartTheme(document.createElement("div"), settings)
            ).not.toThrow();
            await Promise.resolve();
            await Promise.resolve();

            expect(console.warn).not.toHaveBeenCalledWith(
                "[ChartThemeListener] No chart update mechanism available for force update",
                expect.anything()
            );

            expect(settings.querySelectorAll(".toggle-switch")).toHaveLength(2);

            expectSettingsThemeApplied(settings);
        });
    });
});
