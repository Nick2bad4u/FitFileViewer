import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

async function importHelpers() {
    return await import("../../../../utils/rendering/helpers/renderSummaryHelpers.js");
}
async function importRenderSummary() {
    return await import("../../../../utils/rendering/core/renderSummary.js");
}

describe("renderSummary helpers + renderSummary", () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="content-summary"></div>';
        localStorage.clear();
    });
    afterEach(() => {
        vi.resetModules();
    });

    it("getStorageKey prefers window.globalData.cachedFilePath then data.cachedFilePath then activeFitFileName", async () => {
        const { getStorageKey } = await importHelpers();
        // No hints
        expect(getStorageKey({}, [])).toBe("summaryColSel_default");
        // globalData
        (window as any).globalData = { cachedFilePath: "C:/tmp/foo.fit" };
        expect(getStorageKey({}, [])).toContain("summaryColSel_");
        // data fallback
        delete (window as any).globalData;
        expect(getStorageKey({ cachedFilePath: "/a/b/c.fit" } as any, [])).toContain("summaryColSel_");
        // activeFitFileName fallback
        (window as any).activeFitFileName = "bar.fit";
        expect(getStorageKey({}, [])).toContain("summaryColSel_");
    });

    it("save/load column preferences roundtrip", async () => {
        const { saveColPrefs, loadColPrefs } = await importHelpers();
        const key = "summaryColSel_test";
        const cols = ["a", "b", "c"];
        saveColPrefs(key, cols, undefined);
        expect(loadColPrefs(key, undefined)).toEqual(cols);
        // Invalid stored value returns null
        localStorage.setItem(key, "not-an-array");
        expect(loadColPrefs(key, undefined)).toBeNull();
    });

    it("renderSummary renders header, gear button opens modal, and table rows filter", async () => {
        const { renderSummary } = await importRenderSummary();

        // Minimal data
        const data = {
            sessionMesgs: [{ total_ascent: 100, total_descent: 80 }],
            lapMesgs: [
                { lap_index: 1, total_time: 10 },
                { lap_index: 2, total_time: 12 },
            ],
        } as any;

        renderSummary(data);
        const container = document.getElementById("content-summary")!;
        // Header exists
        const headerTitle = container.querySelector(".summary-title") as HTMLElement;
        expect(headerTitle?.textContent).toContain("Activity Summary");
        // Gear opens modal
        const gear = container.querySelector(".summary-gear-btn") as HTMLButtonElement;
        expect(gear).toBeTruthy();
        gear.click();
        const modal = document.querySelector(".summary-col-modal-overlay");
        expect(modal).toBeTruthy();
        // Filter select should exist and change triggers rerender
        const select = container.querySelector(".summary-filter-bar select") as HTMLSelectElement;
        expect(select).toBeTruthy();
        select.value = "Lap 1";
        select.dispatchEvent(new Event("change"));
        // Ensure at least one body row exists
        const bodyRows = container.querySelectorAll("tbody tr");
        expect(bodyRows.length).toBeGreaterThan(0);
    });
});
