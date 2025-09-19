/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { JSDOM } from "jsdom";

// Utility to cleanly reset modules between environment permutations
const resetAll = async () => {
    vi.clearAllMocks();
    vi.resetModules();
};

describe("updateActiveTab.js - environment fallbacks", () => {
    beforeEach(async () => {
        await resetAll();
    });

    afterEach(async () => {
        // Restore globals mutated during tests
        try {
            delete (globalThis as any).__vitest_effective_document__;
        } catch {}
        try {
            delete (globalThis as any).__vitest_effective_stateManager__;
        } catch {}
        await resetAll();
    });

    it("uses __vitest_effective_stateManager__ when module functions are unavailable", async () => {
        // Arrange a normal JSDOM document for DOM operations
        document.body.innerHTML = `
      <button id="tab-summary" class="tab-button">Summary</button>
    `;

        // Provide a global effective state manager (distinct spies)
        const effSetState = vi.fn();
        const effGetState = vi.fn().mockReturnValue("summary");
        const effSubscribe = vi.fn();
        (globalThis as any).__vitest_effective_stateManager__ = {
            setState: effSetState,
            getState: effGetState,
            subscribe: effSubscribe,
        };

        // Mock the module path used within updateActiveTab.js to export no functions,
        // forcing getStateMgr() to pick up the global effective state manager.
        vi.doMock("../../../utils/state/core/stateManager.js", () => ({}));

        const { updateActiveTab } = await import("../../../utils/ui/tabs/updateActiveTab.js");

        // Act
        const ok = updateActiveTab("tab-summary");

        // Assert
        expect(ok).toBe(true);
        expect(effSetState).toHaveBeenCalledWith("ui.activeTab", "summary", { source: "updateActiveTab" });
        expect(effSubscribe).not.toHaveBeenCalled();
    });

    it("falls back to __vitest_effective_document__ when document/window are unavailable/invalid", async () => {
        // Create a separate JSDOM to act as the effective document
        const effDom = new JSDOM(
            '<!doctype html><html><body><button id="tab-chart" class="tab-button">Chart</button></body></html>'
        );
        (globalThis as any).__vitest_effective_document__ = effDom.window.document;

        // Invalidate the standard globals so getDoc() prefers the effective document
        // Note: typeof checks in getDoc guard these assignments.
        (globalThis as any).document = undefined;
        (globalThis as any).window = undefined;

        // Provide a minimal viable state manager to satisfy calls
        const setState = vi.fn();
        const getState = vi.fn().mockReturnValue("chart");
        const subscribe = vi.fn();
        vi.doMock("../../../utils/state/core/stateManager.js", () => ({ setState, getState, subscribe }));

        const { updateActiveTab } = await import("../../../utils/ui/tabs/updateActiveTab.js");

        const ok = updateActiveTab("tab-chart");

        expect(ok).toBe(true);
        expect(setState).toHaveBeenCalledWith("ui.activeTab", "chart", { source: "updateActiveTab" });
        // Validate that the class was toggled on the effective document element
        const el = (globalThis as any).__vitest_effective_document__.getElementById("tab-chart");
        expect(el.classList.contains("active")).toBe(true);
    });

    it("uses window.document when document is undefined (window fallback)", async () => {
        // Prepare a fresh JSDOM to simulate window.document while document is undefined
        const dom = new JSDOM(
            '<!doctype html><html><body><button id="tab-win" class="tab-button">Win</button></body></html>'
        );

        // Invalidate document; provide window.document only
        (globalThis as any).document = undefined;
        (globalThis as any).window = { document: dom.window.document } as unknown as Window;

        const setState = vi.fn();
        const getState = vi.fn().mockReturnValue("win");
        const subscribe = vi.fn();
        vi.doMock("../../../utils/state/core/stateManager.js", () => ({ setState, getState, subscribe }));

        const { updateActiveTab } = await import("../../../utils/ui/tabs/updateActiveTab.js");
        const ok = updateActiveTab("tab-win");

        expect(ok).toBe(true);
        expect(setState).toHaveBeenCalledWith("ui.activeTab", "win", { source: "updateActiveTab" });
        const el = (globalThis as any).window.document.getElementById("tab-win");
        expect(el.classList.contains("active")).toBe(true);
    });

    it("subscribes and updates aria-selected via state callback (valid path)", async () => {
        // Standard DOM with two buttons
        document.body.innerHTML = `
      <button id="tab-summary" class="tab-button" aria-selected="false">Summary</button>
      <button id="tab-data" class="tab-button" aria-selected="false">Data</button>
    `;

        const setState = vi.fn();
        const getState = vi.fn().mockReturnValue("summary");
        const subscribe = vi.fn();
        vi.doMock("../../../utils/state/core/stateManager.js", () => ({ setState, getState, subscribe }));

        const { initializeActiveTabState } = await import("../../../utils/ui/tabs/updateActiveTab.js");

        // Capture subscription
        initializeActiveTabState();
        expect(subscribe).toHaveBeenCalledWith("ui.activeTab", expect.any(Function));
        const call = subscribe.mock.calls.find((c: any[]) => c[0] === "ui.activeTab");
        expect(call).toBeTruthy();
        const cb = (call as any[])[1] as (val: string) => void;

        // Act: make "data" active via state
        cb("data");

        // Assert: aria-selected and classes reflect state
        expect(document.getElementById("tab-summary")?.classList.contains("active")).toBe(false);
        expect(document.getElementById("tab-summary")?.getAttribute("aria-selected")).toBe("false");
        expect(document.getElementById("tab-data")?.classList.contains("active")).toBe(true);
        expect(document.getElementById("tab-data")?.getAttribute("aria-selected")).toBe("true");
    });

    it('ignores clicks on aria-disabled="true" buttons (no disabled/class)', async () => {
        document.body.innerHTML = `
      <button id="tab-map" class="tab-button" aria-disabled="true">Map</button>
    `;

        const setState = vi.fn();
        const getState = vi.fn().mockReturnValue("summary");
        const subscribe = vi.fn();
        vi.doMock("../../../utils/state/core/stateManager.js", () => ({ setState, getState, subscribe }));

        const { initializeActiveTabState } = await import("../../../utils/ui/tabs/updateActiveTab.js");
        initializeActiveTabState();

        document.getElementById("tab-map")!.click();
        expect(setState).not.toHaveBeenCalled();
    });
});
