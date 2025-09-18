/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// This suite specifically validates the getStateMgr() fallback path via
// __vitest_effective_stateManager__, independent of the normal module mocks.
// We avoid mocking the module path here; instead we inject the global and
// dynamically import the module under test.

// Spy logs to keep output quiet
/** @type {any} */
let originalConsoleLog;
/** @type {any} */
let originalConsoleWarn;
/** @type {any} */
let originalConsoleError;

// Mock the state manager module to an empty object so getStateMgr() must use the
// __vitest_effective_stateManager__ fallback branch.
vi.mock("../../../../../utils/state/core/stateManager.js", () => ({}));

describe("tabStateManager.fallback", () => {
  beforeEach(() => {
    originalConsoleLog = console.log;
    originalConsoleWarn = console.warn;
    originalConsoleError = console.error;
    console.log = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();

    // Inject a minimal effective state manager
    // eslint-disable-next-line no-underscore-dangle
    (/** @type {any} */ (globalThis)).__vitest_effective_stateManager__ = {
      getState: vi.fn((key) => {
        if (key === "ui.activeTab") return "summary";
        if (key === "summary.lastDataHash") return "";
        if (key === "globalData") return { recordMesgs: [{ timestamp: 1 }, { timestamp: 2 }] };
        return null;
      }),
      setState: vi.fn(),
      subscribe: vi.fn(() => () => { }),
    };

    Object.assign(window, {
      renderSummary: vi.fn(),
    });
  });

  afterEach(() => {
    console.log = /** @type {any} */ (originalConsoleLog);
    console.warn = /** @type {any} */ (originalConsoleWarn);
    console.error = /** @type {any} */ (originalConsoleError);
    vi.resetAllMocks();
    // eslint-disable-next-line no-underscore-dangle
    // @ts-ignore
    delete (/** @type {any} */ (globalThis)).__vitest_effective_stateManager__;
  });

  it("uses global fallback state manager and renders summary path", async () => {
    const mod = await import("../../../../../utils/ui/tabs/tabStateManager.js");
    const instance = mod.tabStateManager;

    await instance.handleTabSpecificLogic("summary");

    expect((/** @type {any} */ (window)).renderSummary).toHaveBeenCalled();
    // Verify setState through the fallback manager was called
    // eslint-disable-next-line no-underscore-dangle
    const eff = /** @type {any} */ ((/** @type {any} */ (globalThis)).__vitest_effective_stateManager__);
    expect(eff.setState).toHaveBeenCalledWith(
      "summary.lastDataHash",
      expect.any(String),
      expect.objectContaining({ source: expect.stringContaining("TabStateManager.handleSummaryTab") })
    );

    // Also exercise switchToTab via fallback
    instance.switchToTab("map");
    expect(eff.setState).toHaveBeenCalledWith(
      "ui.activeTab",
      "map",
      expect.objectContaining({ source: expect.stringContaining("TabStateManager.switchToTab") })
    );
  });
});
