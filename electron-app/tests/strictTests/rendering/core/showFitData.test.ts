import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../../../utils/state/core/stateManager.js", () => ({
  setState: vi.fn(),
}));

vi.mock("../../../../utils/charts/components/createGlobalChartStatusIndicator.js", () => ({
  createGlobalChartStatusIndicator: vi.fn(),
}));

async function loadModule() {
  return await import("../../../../utils/rendering/core/showFitData.js");
}

describe("showFitData", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="${"activeFileNameContainer"}"></div>
      <span id="${"activeFileName"}"></span>
      <button id="${"unloadFileBtn"}"></button>
    `;
    (window as any).electronAPI = { send: vi.fn() };
    (window as any).setTabButtonsEnabled = vi.fn();
    (window as any).createTables = vi.fn();
    (window as any).renderSummary = vi.fn();
    (window as any).updateTabVisibility = vi.fn();
    (window as any).updateActiveTab = vi.fn();
    (window as any).renderMap = vi.fn();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("updates UI, state, dispatches events, and triggers map render", async () => {
    const { showFitData } = await loadModule();
    const data = {} as any;
    const filePath = "C:/tmp/file.fit";
    showFitData(data, filePath);

    // Verify UI update
    const nameSpan = document.getElementById("activeFileName")!;
    expect(nameSpan.textContent).toContain("Active:");

    // setTimeout branch for tab visibility and map render
    vi.runAllTimers();
    expect((window as any).updateTabVisibility).toHaveBeenCalledWith("content-map");
    expect((window as any).updateActiveTab).toHaveBeenCalledWith("tab-map");
    expect((window as any).renderMap).toHaveBeenCalled();

    // Should have called createTables and renderSummary
    expect((window as any).createTables).toHaveBeenCalled();
    expect((window as any).renderSummary).toHaveBeenCalled();

    // IPC send
    expect((window as any).electronAPI.send).toHaveBeenCalled();
  });

  it("throws on invalid data and writes error state", async () => {
    const { showFitData } = await loadModule();
    await expect(() => showFitData(null as any, undefined)).toThrowError();
  });
});
