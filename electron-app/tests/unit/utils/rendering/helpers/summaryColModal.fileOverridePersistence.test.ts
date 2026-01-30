import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const MODAL = "../../../../../utils/rendering/helpers/summaryColModal.js";
const HELPERS =
    "../../../../../utils/rendering/helpers/renderSummaryHelpers.js";

describe("summaryColModal - file override persistence", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        localStorage.clear();
        vi.resetModules();
        vi.restoreAllMocks();
        // Provide a stable file path for getStorageKey
        (globalThis.window as any).globalData = {
            cachedFilePath: "C:/tmp/activity.fit",
        };
    });

    afterEach(() => {
        document.body.innerHTML = "";
        localStorage.clear();
        (globalThis.window as any).globalData = undefined;
    });

    it("clears per-file override when reset to default", async () => {
        const {
            getStorageKey,
            getGlobalStorageKey,
            saveColPrefs,
            loadColPrefs,
            orderSummaryColumnsNamedFirst,
        } = await import(HELPERS);
        const { showColModal } = await import(MODAL);

        const allKeys = [
            "Speed",
            "Distance",
            "HeartRate",
        ];

        const fileKey = getStorageKey(
            (globalThis.window as any).globalData,
            allKeys
        );
        const globalKey = getGlobalStorageKey();

        // Global default differs from file override.
        const globalDefault = orderSummaryColumnsNamedFirst(allKeys).filter(
            (k) => ["Speed", "Distance"].includes(k)
        );
        const fileOverride = orderSummaryColumnsNamedFirst(allKeys).filter(
            (k) => ["Speed"].includes(k)
        );

        saveColPrefs(globalKey, globalDefault);
        saveColPrefs(fileKey, fileOverride);

        // Start modal showing the currently active file override selection.
        let visible = [...fileOverride];
        const setVisibleColumns = vi.fn((cols: string[]) => {
            visible = [...cols];
        });
        const renderTable = vi.fn();

        showColModal({
            allKeys,
            data: {},
            renderTable,
            setVisibleColumns,
            visibleColumns: visible,
        });

        const overlay = document.querySelector(
            ".summary-col-modal-overlay"
        ) as HTMLElement;
        expect(overlay).toBeTruthy();

        // Turn off file override by resetting this file back to the baseline (global default when set).
        const resetBtn = Array.from(
            overlay.querySelectorAll<HTMLButtonElement>("button")
        ).find((b) => (b.textContent || "").trim() === "Reset to Default");
        expect(resetBtn).toBeTruthy();
        resetBtn?.click();

        // Sanity: selection now matches global default.
        expect(visible).toEqual(globalDefault);

        // Close modal.
        const closeBtn = Array.from(
            overlay.querySelectorAll<HTMLButtonElement>("button")
        ).find((b) => (b.textContent || "").trim() === "Close");
        expect(closeBtn).toBeTruthy();
        closeBtn?.click();

        // File key should stay cleared, not recreated.
        expect(localStorage.getItem(fileKey)).toBeNull();

        // Global default should still be present.
        expect(loadColPrefs(globalKey)).toEqual(globalDefault);
    });
});
