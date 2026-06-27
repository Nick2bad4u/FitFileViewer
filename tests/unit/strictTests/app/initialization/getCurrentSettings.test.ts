import { describe, expect, it, vi } from "vitest";
import {
    clearChartInstanceRegistryForTests,
    setRegisteredChartInstances,
} from "../../../../../electron-app/utils/charts/core/chartInstanceRegistry.js";

type GetCurrentSettingsModule =
    typeof import("../../../../../electron-app/utils/app/initialization/getCurrentSettings.js");

const mocks = vi.hoisted(() => ({
    clearCachedChartSettings: vi.fn<(options?: { source?: string }) => void>(),
    debouncedRender: vi.fn<(reason: string) => void>(),
    destroyChart: vi.fn<() => void>(),
    getState: vi.fn<(path: string) => unknown>(),
    setState:
        vi.fn<
            (
                path: string,
                value: unknown,
                options?: { source?: string }
            ) => void
        >(),
    showNotification: vi.fn<(message: string, type: string) => void>(),
    updateAllChartStatusIndicators: vi.fn<() => void>(),
}));

vi.mock(
    import("../../../../../electron-app/utils/charts/plugins/chartOptionsConfig.js"),
    () => ({
        chartOptionsConfig: [
            {
                default: "all",
                id: "maxpoints",
                label: "Max Points",
                type: "select",
            },
            {
                default: true,
                id: "showgrid",
                label: "Show Grid",
                type: "toggle",
            },
            {
                default: 5,
                id: "smoothness",
                label: "Smoothness",
                max: 10,
                min: 0,
                type: "range",
            },
        ],
    })
);

vi.mock(
    import("../../../../../electron-app/utils/formatting/display/formatChartFields.js"),
    () => ({
        fieldColors: { power: "#222222", speed: "#111111" },
        formatChartFields: ["speed", "power"],
    })
);

vi.mock(
    import("../../../../../electron-app/utils/theming/core/theme.js"),
    () => ({
        getThemeConfig: (): { colors: Record<string, string> } => ({
            colors: {
                accent: "#123456",
                borderLight: "#eeeeee",
                primaryAlpha: "#abcdef",
            },
        }),
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: mocks.showNotification,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/charts/components/chartStatusIndicator.js"),
    () => ({
        updateAllChartStatusIndicators: mocks.updateAllChartStatusIndicators,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/state/core/stateManager.js"),
    () => ({
        getState: mocks.getState,
        setState: mocks.setState,
        subscribe: vi.fn<(path: string, callback: () => void) => () => void>(
            () => () => {
                return undefined;
            }
        ),
    })
);

vi.mock(
    import("../../../../../electron-app/utils/charts/core/chartStateManagerRegistry.js"),
    () => ({
        getRegisteredChartStateManager: () => ({
            debouncedRender: mocks.debouncedRender,
        }),
    })
);

vi.mock(
    import("../../../../../electron-app/utils/state/domain/settingsStateManager.js"),
    () => ({
        clearCachedChartSettings: mocks.clearCachedChartSettings,
        getChartSettings: readChartSettingsFromStorage,
        resetChartSettings: vi.fn<(_options?: { silent?: boolean }) => boolean>(
            () => {
                const keysToRemove: string[] = [];

                for (let index = 0; index < localStorage.length; index++) {
                    const key = localStorage.key(index);
                    if (key?.startsWith("chartjs_")) {
                        keysToRemove.push(key);
                    }
                }

                for (const key of keysToRemove) {
                    localStorage.removeItem(key);
                }

                return true;
            }
        ),
    })
);

describe("getCurrentSettings module", () => {
    it("getDefaultSettings returns defaults and field colors", async () => {
        expect.assertions(4);

        resetTestState();

        const { getDefaultSettings } = await importGetCurrentSettings();
        const settings = getDefaultSettings();

        expect(settings["maxpoints"]).toBe("all");
        expect({ showgrid: settings["showgrid"] }).toStrictEqual({
            showgrid: true,
        });
        expect(settings["smoothness"]).toBe(5);
        expect(settings.colors).toStrictEqual({
            power: "#222222",
            speed: "#111111",
        });
    });

    it("getCurrentSettings parses stored values and uses default field colors", async () => {
        expect.assertions(5);

        resetTestState();
        localStorage.setItem("chartjs_maxpoints", "1000");
        localStorage.setItem("chartjs_showgrid", "false");
        localStorage.setItem("chartjs_smoothness", "7");
        localStorage.setItem("chartjs_color_speed", "#ff00ff");

        const { getCurrentSettings } = await importGetCurrentSettings();
        const settings = getCurrentSettings();

        expect(settings["maxpoints"]).toBe(1000);
        expect({ showgrid: settings["showgrid"] }).toStrictEqual({
            showgrid: false,
        });
        expect(settings["smoothness"]).toBe(7);
        expect(settings.colors["speed"]).toBe("#ff00ff");
        expect(settings.colors["power"]).toBe("#222222");
    });

    it("resetAllSettings clears storage, updates UI, and reports success", async () => {
        expect.assertions(6);

        resetTestState();
        localStorage.setItem("chartjs_maxpoints", "1000");
        localStorage.setItem("chartjs_color_speed", "#ff00ff");

        const resetHook = vi.fn<() => void>();
        const resettableControl = Object.assign(document.createElement("div"), {
            _updateFromReset: resetHook,
        });
        const malformedResetControl = Object.assign(
            document.createElement("div"),
            {
                _updateFromReset: true,
            }
        );
        document
            .getElementById("chartjs-settings-wrapper")
            ?.append(resettableControl, malformedResetControl);

        const { resetAllSettings } = await importGetCurrentSettings();
        const didReset = resetAllSettings();
        vi.runAllTimers();

        expect({ didReset }).toStrictEqual({ didReset: true });
        expect(localStorage.getItem("chartjs_maxpoints")).toBeNull();
        expect(localStorage.getItem("chartjs_color_speed")).toBeNull();
        expect(mocks.showNotification).toHaveBeenCalledWith(
            "Settings reset to defaults",
            "success"
        );
        expect(resetHook).toHaveBeenCalledWith();
        expect(resetHook).toHaveBeenCalledTimes(1);
    });

    it("reRenderChartsAfterSettingChange clears caches and delegates rendering", async () => {
        expect.assertions(5);

        resetTestState();

        const firstCanvas = document.createElement("canvas");
        firstCanvas.id = "chart-1";
        document.body.append(firstCanvas);

        const secondCanvas = document.createElement("canvas");
        secondCanvas.id = "chartjs-canvas-2";
        document.body.append(secondCanvas);

        setRegisteredChartInstances([{ destroy: mocks.destroyChart }]);

        const { reRenderChartsAfterSettingChange } =
            await importGetCurrentSettings();
        reRenderChartsAfterSettingChange("showgrid", true);

        expect(mocks.clearCachedChartSettings).toHaveBeenCalledWith({
            source: "reRenderChartsAfterSettingChange",
        });
        expect(mocks.debouncedRender).toHaveBeenCalledWith(
            "Setting change: showgrid"
        );
        expect(mocks.destroyChart).not.toHaveBeenCalled();
        expect(document.getElementById("chart-1")).toBe(firstCanvas);
        expect(document.getElementById("chartjs-canvas-2")).toBe(secondCanvas);
    });
});

async function importGetCurrentSettings(): Promise<GetCurrentSettingsModule> {
    return import("../../../../../electron-app/utils/app/initialization/getCurrentSettings.js");
}

function readChartSettingsFromStorage(): Record<string, string> {
    const settings: Record<string, string> = {};

    for (let index = 0; index < localStorage.length; index++) {
        const key = localStorage.key(index);
        if (!key?.startsWith("chartjs_")) {
            continue;
        }

        const value = localStorage.getItem(key);
        if (value !== null) {
            settings[key.slice("chartjs_".length)] = value;
        }
    }

    return settings;
}

function resetTestState(): void {
    vi.useFakeTimers();
    vi.resetModules();
    vi.clearAllMocks();
    localStorage.clear();
    document.body.textContent = "";

    const wrapper = document.createElement("div");
    wrapper.id = "chartjs-settings-wrapper";
    wrapper.append(
        createSelectSetting("Max Points", "chartjs-maxpoints-dropdown"),
        createToggleSetting("Show Grid", "chartjs-showgrid"),
        createRangeSetting(),
        createFieldToggle(),
        createColorInput("chartjs-speed"),
        createColorInput("chartjs-power")
    );

    const chartContainer = document.createElement("div");
    chartContainer.id = "content-chart";
    document.body.append(wrapper, chartContainer);

    clearChartInstanceRegistryForTests();
    mocks.getState.mockImplementation((path) =>
        path === "fitFile.rawData" ? { recordMesgs: [{}] } : undefined
    );
}

function createSelectSetting(labelText: string, selectId: string): HTMLElement {
    const row = createSettingRow(labelText);
    const select = document.createElement("select");
    select.id = selectId;
    row.append(select);
    return row;
}

function createToggleSetting(labelText: string, toggleId: string): HTMLElement {
    const row = createSettingRow(labelText);
    const toggle = document.createElement("div");
    toggle.id = toggleId;
    toggle.className = "toggle-switch";
    row.append(toggle);
    return row;
}

function createRangeSetting(): HTMLElement {
    const row = createSettingRow("Smoothness");
    const container = document.createElement("div");
    container.id = "chartjs-smoothness-container";

    const slider = document.createElement("input");
    slider.id = "chartjs-smoothness-slider";
    slider.type = "range";

    const valueDisplay = document.createElement("span");
    valueDisplay.style.position = "absolute";

    container.append(slider, valueDisplay);
    row.append(container);
    return row;
}

function createSettingRow(labelText: string): HTMLElement {
    const row = document.createElement("div");
    row.className = "setting-row";

    const label = document.createElement("label");
    label.className = "setting-label";
    label.textContent = labelText;

    row.append(label);
    return row;
}

function createFieldToggle(): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = "field-toggle";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    wrapper.append(checkbox);
    return wrapper;
}

function createColorInput(id: string): HTMLInputElement {
    const input = document.createElement("input");
    input.id = id;
    input.type = "color";
    return input;
}
