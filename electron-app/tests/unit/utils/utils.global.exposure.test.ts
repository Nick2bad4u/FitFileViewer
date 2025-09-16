import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Utilities
const utilsModulePath = "../../../utils.js";

// Helper to import fresh module instance each time
async function importFresh() {
  // Reset module cache to ensure fresh evaluation (module has top-level side-effects)
  vi.resetModules();
  return await import(utilsModulePath);
}

// Small helper to wait for next macrotask so setTimeout(..., 0) fires
function nextTick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// Ensure clean window between tests
afterEach(() => {
  // Attempt to run provided cleanup if available to remove globals we attached
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w: any = window as any;
    if (w.FitFileViewerUtils && typeof w.FitFileViewerUtils.cleanup === "function") {
      w.FitFileViewerUtils.cleanup();
    }
  } catch {
    // ignore
  }

  // Remove testing electronAPI stub if present
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).electronAPI = undefined;
});

describe("utils.js – global exposure and helpers", () => {
  beforeEach(() => {
    // Ensure process.env changes don't leak across tests
    vi.unstubAllGlobals();
  });

  it("exposes FitFileViewerUtils and attaches utilities to window", async () => {
    const mod = await importFresh();
    // Wait for attachUtilitiesToWindow (setTimeout(..., 0))
    await nextTick();

    // Basic named exports should exist
    expect(mod).toHaveProperty("FitFileViewerUtils");
    expect(mod).toHaveProperty("UTILS_CONSTANTS");

    // The global namespace should be attached synchronously
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w: any = window as any;
    expect(w.FitFileViewerUtils).toBeDefined();
    expect(typeof w.FitFileViewerUtils.getAvailableUtils).toBe("function");

    // setTimeout callback should have attached the individual utilities on window
    const available = w.FitFileViewerUtils.getAvailableUtils();
    // Spot-check some high-signal utilities
    expect(available).toEqual(expect.arrayContaining([
      "formatDistance",
      "formatDuration",
      "renderMap",
      "renderSummary",
      "updateActiveTab",
    ]));

    // And they should be functions on window
    for (const key of [
      "formatDistance",
      "formatDuration",
      "renderMap",
      "renderSummary",
      "updateActiveTab",
    ]) {
      expect(typeof w[key]).toBe("function");
      expect(w.FitFileViewerUtils.isUtilAvailable(key)).toBe(true);
    }
  });

  it("loads version from electron API when available", async () => {
    // Provide an electronAPI before importing module so init path picks it up immediately
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).electronAPI = {
      getAppVersion: vi.fn().mockResolvedValue("9.9.9"),
    };

    const mod = await importFresh();
    // Give the async version loader a moment to resolve
    await nextTick();

    // UTILS_CONSTANTS.VERSION and FitFileViewerUtils.version should reflect the mocked version
    expect(mod.UTILS_CONSTANTS).toBeDefined();
    expect(mod.UTILS_CONSTANTS).toHaveProperty("VERSION");
    expect(mod.UTILS_CONSTANTS.VERSION).toBe("9.9.9");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w: any = window as any;
    expect(w.FitFileViewerUtils.version).toBe("9.9.9");
    // Ensure electronAPI was queried
    expect((window as any).electronAPI.getAppVersion).toHaveBeenCalledTimes(1);
  });

  it("safeExecute throws for unknown utility and succeeds for known one", async () => {
    const mod = await importFresh();
    await nextTick();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w: any = window as any;

    // Unknown util should throw
    expect(() => w.FitFileViewerUtils.safeExecute("__does_not_exist__")).toThrow();

    // Known util should execute without throwing; we don't assert exact return shape to avoid coupling
    expect(() => w.FitFileViewerUtils.safeExecute("formatDistance", 1000)).not.toThrow();
  });

  it("exposes dev helpers in development and records collisions", async () => {
    // Force development mode so dev helpers are exposed (evaluated at module init)
    vi.stubEnv("NODE_ENV", "development");

    // Pre-populate a conflicting function on window before import to trigger collision handling
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).formatDistance = function legacyImpl() { /* legacy */ };

    await importFresh();
    await nextTick();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w: any = window as any;
    expect(w.devUtilsHelpers).toBeDefined();
    expect(typeof w.devUtilsHelpers.getAttachmentResults).toBe("function");

    const results = w.devUtilsHelpers.getAttachmentResults();
    expect(results).toBeDefined();
    expect(Array.isArray(results.collisions)).toBe(true);

    const hasFormatDistanceCollision = results.collisions.some((c: { name: string }) => c.name === "formatDistance");
    expect(hasFormatDistanceCollision).toBe(true);
  });

  it("cleanup removes attached global utilities", async () => {
    await importFresh();
    await nextTick();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w: any = window as any;
    expect(typeof w.formatDistance).toBe("function");

    // Remove everything
    w.FitFileViewerUtils.cleanup();

    expect(w.formatDistance).toBeUndefined();
    expect(w.renderSummary).toBeUndefined();
  });
});
