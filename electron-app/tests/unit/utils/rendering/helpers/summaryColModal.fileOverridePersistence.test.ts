import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

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
        } = await import(
            "../../../../../utils/rendering/helpers/renderSummaryHelpers.js"
        );
        const { showColModal } = await import(
            "../../../../../utils/rendering/helpers/summaryColModal.js"
        );

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
        );
        expect(overlay).toBeInstanceOf(HTMLElement);
        if (!(overlay instanceof HTMLElement)) {
            throw new Error("Expected summary column modal overlay to render");
        }

        const buttons = Array.from(
            overlay.querySelectorAll<HTMLButtonElement>("button")
        );
        expect(buttons.map((b) => (b.textContent || "").trim())).toEqual([
            "×",
            "Global default",
            "This file override",
            "Reset to Default",
            "Make Global Default",
            "Clear Global Default",
            "Select All",
            "Close",
        ]);

        // Turn off file override by resetting this file back to the baseline (global default when set).
        const resetBtn = buttons.find(
            (b) => (b.textContent || "").trim() === "Reset to Default"
        );
        expect(resetBtn).toBeInstanceOf(HTMLButtonElement);
        if (!(resetBtn instanceof HTMLButtonElement)) {
            throw new Error("Expected reset button to render");
        }
        resetBtn.click();

        // Sanity: selection now matches global default.
        expect(visible).toEqual(globalDefault);

        // Close modal.
        const closeBtn = buttons.find(
            (b) => (b.textContent || "").trim() === "Close"
        );
        expect(closeBtn).toBeInstanceOf(HTMLButtonElement);
        if (!(closeBtn instanceof HTMLButtonElement)) {
            throw new Error("Expected close button to render");
        }
        closeBtn.click();

        // File key should stay cleared, not recreated.
        expect(localStorage.getItem(fileKey)).toBeNull();

        // Global default should still be present.
        expect(loadColPrefs(globalKey)).toEqual(globalDefault);
    });
});
