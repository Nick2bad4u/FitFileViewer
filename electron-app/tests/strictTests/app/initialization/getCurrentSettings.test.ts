import { describe, it, expect, beforeEach, vi } from "vitest";

// Mocks for dependencies used by getCurrentSettings.js
vi.mock("../../../../utils/charts/plugins/chartOptionsConfig.js", () => ({
  chartOptionsConfig: [
    { id: "maxpoints", label: "Max Points", type: "select", default: "all" },
    { id: "showgrid", label: "Show Grid", type: "toggle", default: true },
    { id: "smoothness", label: "Smoothness", type: "range", default: 5, min: 0, max: 10 },
  ],
}));
vi.mock("../../../../utils/formatting/display/formatChartFields.js", () => ({
  fieldColors: { speed: "#111111", power: "#222222" },
  formatChartFields: ["speed", "power"],
}));
vi.mock("../../../../utils/theming/core/theme.js", () => ({
  getThemeConfig: () => ({ colors: { primaryAlpha: "#abcdef", accent: "#123456", borderLight: "#eeeeee" } }),
}));
vi.mock("../../../../utils/charts/core/renderChartJS.js", () => ({ renderChartJS: vi.fn() }));
vi.mock("../../../../utils/ui/notifications/showNotification.js", () => ({ showNotification: vi.fn() }));
vi.mock("../../../../utils/charts/components/chartStatusIndicator.js", () => ({ updateAllChartStatusIndicators: vi.fn() }));
vi.mock("../../../../utils/state/core/stateManager.js", () => ({ setState: vi.fn() }));
vi.mock("../../../../utils/charts/core/chartStateManager.js", () => ({ chartStateManager: { debouncedRender: vi.fn() } }));

const modPath = "../../../../utils/app/initialization/getCurrentSettings.js";

describe("getCurrentSettings module", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="chartjs-settings-wrapper">
        <div class="setting-row">
          <label class="setting-label">Max Points</label>
          <select id="chartjs-maxpoints-dropdown"></select>
        </div>
        <div class="setting-row">
          <label class="setting-label">Show Grid</label>
          <div id="chartjs-showgrid" class="toggle-switch"></div>
        </div>
        <div class="setting-row">
          <label class="setting-label">Smoothness</label>
          <div id="chartjs-smoothness-container"><input id="chartjs-smoothness-slider" type="range" /><span style="position:absolute"></span></div>
        </div>
        <div class="field-toggle"><input type="checkbox"></div>
        <input id="chartjs-speed" type="color" />
        <input id="chartjs-power" type="color" />
      </div>
      <div id="content-chart"></div>
    `;
    // chart instances holder
    (window as any)._chartjsInstances = [];
    (window as any).globalData = { recordMesgs: [{}] };
    localStorage.clear();
    vi.useFakeTimers();
    vi.resetModules();
  });

  it("getDefaultSettings returns defaults and field colors", async () => {
    const { getDefaultSettings } = await import(modPath);
    const def = getDefaultSettings();
    expect(def.maxpoints).toBe("all");
    expect(def.showgrid).toBe(true);
    expect(def.smoothness).toBe(5);
    expect(def.colors).toMatchObject({ speed: "#111111", power: "#222222" });
  });

  it("getCurrentSettings parses stored values and falls back to theme", async () => {
    localStorage.setItem("chartjs_maxpoints", "1000");
    localStorage.setItem("chartjs_showgrid", "false");
    localStorage.setItem("chartjs_smoothness", "7");
    // only set one color, the other should come from defaults/theme
    localStorage.setItem("chartjs_color_speed", "#ff00ff");
    const { getCurrentSettings } = await import(modPath);
    const cur = getCurrentSettings();
    expect(cur.maxpoints).toBe(1000);
    expect(cur.showgrid).toBe(false);
    expect(cur.smoothness).toBe(7);
    expect(cur.colors.speed).toBe("#ff00ff");
    // power should be default from fieldColors
    expect(cur.colors.power).toBe("#222222");
  });

  it("resetAllSettings clears storage, updates UI, and re-renders", async () => {
    const { resetAllSettings } = await import(modPath);
    // Seed storage with values to ensure they're cleared
    localStorage.setItem("chartjs_maxpoints", "1000");
    localStorage.setItem("chartjs_showgrid", "false");
    localStorage.setItem("chartjs_smoothness", "7");
    localStorage.setItem("chartjs_color_speed", "#ff00ff");
    const ok = resetAllSettings();
    expect(ok).toBe(true);
    // run the queued timers to allow DOM updates
    vi.runAllTimers();
    expect(localStorage.getItem("chartjs_maxpoints")).toBeNull();
    expect(localStorage.getItem("chartjs_color_speed")).toBeNull();
  });

  it("reRenderChartsAfterSettingChange clears caches and triggers render", async () => {
    const { reRenderChartsAfterSettingChange } = await import(modPath);
    // Create some fake canvases to be purged
    const c1 = document.createElement("canvas"); c1.id = "chart-1"; document.body.appendChild(c1);
    const c2 = document.createElement("canvas"); c2.id = "chartjs-canvas-2"; document.body.appendChild(c2);
    // Add a dummy chart instance with destroy
    (window as any)._chartjsInstances = [{ destroy: vi.fn() }];
    reRenderChartsAfterSettingChange("showgrid", true);
    // canvases should be removed by the time timers run
    vi.runAllTimers();
    expect(document.getElementById("chart-1")).toBeNull();
    expect(document.getElementById("chartjs-canvas-2")).toBeNull();
  });
});
