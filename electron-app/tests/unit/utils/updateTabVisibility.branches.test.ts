import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We'll mock stateManager with incomplete exports to force __vitest_effective_stateManager__ fallback

describe("updateTabVisibility - additional branches", () => {
    const createContentDom = () => {
        document.body.innerHTML = `
            <div id="content-data"></div>
            <div id="content-chartjs"></div>
            <div id="content-browser"></div>
            <div id="content-map"></div>
            <div id="content-summary"></div>
            <div id="content-altfit"></div>
            <div id="content-zwift"></div>
        `;
    };

    beforeEach(() => {
        vi.resetModules();
        createContentDom();
    });

    afterEach(() => {
        // cleanup the global shim if set
        // @ts-ignore
        delete (globalThis as any).__vitest_effective_stateManager__;
        vi.restoreAllMocks();
    });

    it("maps 'summary-content' pattern via extractTabNameFromContentId and sets activeTabContent", async () => {
        // Provide working module exports so primary branch exercised
        const setState = vi.fn();
        const getState = vi.fn();
        const subscribe = vi.fn();
        vi.doMock("../../../utils/state/core/stateManager.js", () => ({
            setState,
            getState,
            subscribe,
        }));

        const { updateTabVisibility } =
            await import("../../../utils/ui/tabs/updateTabVisibility.js");

        updateTabVisibility("summary-content" as any);

        // Should derive 'summary' and set ui.activeTabContent accordingly
        expect(setState).toHaveBeenCalledWith(
            "ui.activeTabContent",
            "summary",
            expect.objectContaining({ source: "updateTabVisibility" })
        );

        // Also verify display toggling behavior: summary visible, others hidden
        const summary = document.getElementById("content-summary")!;
        const data = document.getElementById("content-data")!;
        expect(summary.style.display).toBe("block");
        expect(data.style.display).toBe("none");
    });

    it("falls back to __vitest_effective_stateManager__ when module exports are unavailable", async () => {
        // Mock module with missing methods to fail the primary branch
        vi.doMock("../../../utils/state/core/stateManager.js", () => ({}));

        const effSet = vi.fn();
        const effGet = vi.fn();
        const effSub = vi.fn();
        // @ts-ignore
        (globalThis as any).__vitest_effective_stateManager__ = {
            setState: effSet,
            getState: effGet,
            subscribe: effSub,
        };

        const { updateTabVisibility } =
            await import("../../../utils/ui/tabs/updateTabVisibility.js");

        updateTabVisibility("content-map");

        expect(effSet).toHaveBeenCalledWith(
            "ui.activeTabContent",
            "map",
            expect.objectContaining({ source: "updateTabVisibility" })
        );
        const map = document.getElementById("content-map")!;
        const summary = document.getElementById("content-summary")!;
        expect(map.style.display).toBe("block");
        expect(summary.style.display).toBe("none");
    });
});
