import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const HELPERS = "../../../../../utils/rendering/helpers/renderSummaryHelpers.js";

describe("showColModal interactions", () => {
    const origClipboard: any = (global.navigator as any)?.clipboard;

    beforeEach(() => {
        document.body.innerHTML = "";
        vi.resetModules();
        vi.restoreAllMocks();
        // Ensure globalData exists for storage key building
        (global.window as any).globalData = { cachedFilePath: "/tmp/file.fit" };
        // Clean localStorage
        localStorage.clear();
        // Mock clipboard to avoid errors if used elsewhere
        (global.navigator as any).clipboard = { writeText: vi.fn() };
    });

    afterEach(() => {
        (global.navigator as any).clipboard = origClipboard;
    });

    it("toggles Select All / Deselect All, persists on OK, and discards on Cancel", async () => {
        const { showColModal, getStorageKey, loadColPrefs } = await import(HELPERS);

        const allKeys = ["Speed", "Distance", "HeartRate"];
        let visible: string[] = ["Speed"]; // start with 1 selected
        const setVisibleColumns = vi.fn((cols: string[]) => {
            visible = [...cols];
        });
        const reRender = vi.fn();

        showColModal({ allKeys, visibleColumns: visible, setVisibleColumns, renderTable: reRender });

        // There should be an overlay in the DOM
        const overlay = document.querySelector(".summary-col-modal-overlay") as HTMLElement;
        expect(overlay).toBeTruthy();

        // The button text should be "Select All" initially (not all selected)
        const selectAllBtn = overlay.querySelector(".select-all-btn") as HTMLButtonElement;
        expect(selectAllBtn).toBeTruthy();
        expect(selectAllBtn.textContent).toMatch(/Select All/i);

        // Click Select All -> becomes Deselect All and setVisibleColumns called with all keys
        selectAllBtn.click();
        expect(selectAllBtn.textContent).toMatch(/Deselect All/i);
        expect(setVisibleColumns).toHaveBeenCalled();
        expect(visible).toEqual(allKeys);
        expect(reRender).toHaveBeenCalledTimes(1);

        // Click OK persists to localStorage
        const okBtn = overlay.querySelector(".modal-actions .themed-btn:last-of-type") as HTMLButtonElement;
        expect(okBtn).toBeTruthy();
        okBtn.click();
        // Overlay removed
        expect(document.querySelector(".summary-col-modal-overlay")).toBeNull();

        const key = getStorageKey((global as any).window.globalData, allKeys);
        const stored = loadColPrefs(key, allKeys);
        expect(stored).toEqual(allKeys);

        // Open again and then Cancel should not change stored value
        showColModal({ allKeys, visibleColumns: ["Speed"], setVisibleColumns, renderTable: reRender });
        const overlay2 = document.querySelector(".summary-col-modal-overlay") as HTMLElement;
        const cancelBtn = overlay2.querySelector(".modal-actions .themed-btn") as HTMLButtonElement; // first is Cancel
        cancelBtn.click();
        const storedAfterCancel = loadColPrefs(key, allKeys);
        expect(storedAfterCancel).toEqual(allKeys); // unchanged
    });

    it("shift-click selects a range and persists immediately via saveColPrefs in handlers", async () => {
        const { showColModal, getStorageKey, loadColPrefs } = await import(HELPERS);

        const allKeys = ["A", "B", "C", "D", "E"];
        let visible: string[] = [];
        const setVisibleColumns = vi.fn((cols: string[]) => {
            visible = [...cols];
        });
        const reRender = vi.fn();

        showColModal({ allKeys, visibleColumns: visible, setVisibleColumns, renderTable: reRender });

        const overlay = document.querySelector(".summary-col-modal-overlay") as HTMLElement;
        const checkboxes = Array.from(overlay.querySelectorAll<HTMLLabelElement>(".col-list label"));
        // First label is the disabled "Type" checkbox, skip it; actual keys begin at index 1
        const keyCheckbox = (idx: number) => checkboxes[idx].querySelector("input") as HTMLInputElement;

        // Click index 2 ("C") to set lastCheckedIndex
        keyCheckbox(3).click(); // labels: 0 Type, 1 A, 2 B, 3 C, 4 D, 5 E
        expect(visible).toEqual(["C"]);

        // Now shift-mousedown on index 5 ("E") to select range C..E
        const e = new MouseEvent("mousedown", { bubbles: true, cancelable: true, shiftKey: true });
        keyCheckbox(5).dispatchEvent(e);
        // After range select, visible should be [C, D, E] sorted by allKeys order
        expect(visible).toEqual(["C", "D", "E"]);
        // Re-render called from handler
        expect(reRender).toHaveBeenCalled();

        // storage updated by handler side-effect
        const key = getStorageKey((global as any).window.globalData, allKeys);
        const stored = loadColPrefs(key, allKeys);
        expect(stored).toEqual(["C", "D", "E"]);
    });
});
