/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Fresh mocks per test to avoid cross-contamination
const setupStateMocks = () => {
  const setState = vi.fn();
  const getState = vi.fn().mockReturnValue("summary");
  const subscribe = vi.fn();
  vi.doMock("../../../utils/state/core/stateManager.js", () => ({ setState, getState, subscribe }));
  return { setState, getState, subscribe };
};

describe("updateActiveTab.js - additional branches", () => {
  let consoleErrorSpy: any;
  let consoleWarnSpy: any;
  let consoleLogSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(async () => {
    document.body.innerHTML = "";
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("fast path: when requested tab is already active, only updates state", async () => {
    const { setState } = setupStateMocks();
    document.body.innerHTML = `
      <button id="tab-fast" class="tab-button active">Fast</button>
      <button id="tab-other" class="tab-button">Other</button>
    `;

    const { updateActiveTab } = await import("../../../utils/ui/tabs/updateActiveTab.js");
    const result = updateActiveTab("tab-fast");

    expect(result).toBe(true);
    expect(setState).toHaveBeenCalledWith("ui.activeTab", "fast", { source: "updateActiveTab" });
    // Ensure classes remain consistent
    expect(document.getElementById("tab-fast")!.classList.contains("active")).toBe(true);
    expect(document.getElementById("tab-other")!.classList.contains("active")).toBe(false);
  });

  it("logs error and returns false when element exists without classList", async () => {
    const { setState } = setupStateMocks();
    // Create a real element so getElementById finds it by id, but intercept to return a shape without classList
    const real = document.createElement("div");
    real.id = "tab-noclass";
    document.body.appendChild(real);

    const originalGetById = document.getElementById.bind(document);
    // @ts-ignore - deliberately return an object without classList
    document.getElementById = vi.fn((id: string) => (id === "tab-noclass" ? { id: "tab-noclass" } : originalGetById(id)));

    const { updateActiveTab } = await import("../../../utils/ui/tabs/updateActiveTab.js");
    const ok = updateActiveTab("tab-noclass");

    expect(ok).toBe(false);
    expect(setState).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();

    // restore
    document.getElementById = originalGetById;
  });

  it("ignores click when button.disabled === true", async () => {
    const { setState } = setupStateMocks();
    document.body.innerHTML = `
      <button id="tab-disabled-prop" class="tab-button" disabled>Disabled</button>
    `;

    const { initializeActiveTabState } = await import("../../../utils/ui/tabs/updateActiveTab.js");
    initializeActiveTabState();

    // Dispatch a real click event; handler should prevent state update
    document.getElementById("tab-disabled-prop")!.click();
    expect(setState).not.toHaveBeenCalled();
  });

  it("ignores click when element has 'tab-disabled' class", async () => {
    const { setState } = setupStateMocks();
    document.body.innerHTML = `
      <button id="tab-disabled-class" class="tab-button tab-disabled">Disabled</button>
    `;

    const { initializeActiveTabState } = await import("../../../utils/ui/tabs/updateActiveTab.js");
    initializeActiveTabState();

    document.getElementById("tab-disabled-class")!.click();
    expect(setState).not.toHaveBeenCalled();
  });
});
