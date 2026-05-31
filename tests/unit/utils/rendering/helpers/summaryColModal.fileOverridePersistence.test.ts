import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type TestWindowGlobal = Window &
    typeof globalThis & {
        globalData?: {
            cachedFilePath: string;
        };
    };

function requireElement<T extends Element>(
    element: Element | null,
    constructor: new (...args: any[]) => T,
    message: string
): T {
    expect(element).toBeInstanceOf(constructor);
    if (!(element instanceof constructor)) {
        throw new Error(message);
    }

    return element;
}

function findButton(
    buttons: HTMLButtonElement[],
    label: string
): HTMLButtonElement {
    const button = buttons.find((b) => (b.textContent || "").trim() === label);
    return requireElement(
        button ?? null,
        HTMLButtonElement,
        `Expected ${label} button to render`
    );
}

describe("summaryColModal - file override persistence", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        localStorage.clear();
        vi.resetModules();
        vi.restoreAllMocks();
        // Provide a stable file path for getStorageKey
        (globalThis.window as TestWindowGlobal).globalData = {
            cachedFilePath: "C:/tmp/activity.fit",
        };
    });

    afterEach(() => {
        document.body.innerHTML = "";
        localStorage.clear();
        (globalThis.window as TestWindowGlobal).globalData = undefined;
    });

    it("clears per-file override when reset to default", async () => {
        expect.hasAssertions();

        const {
            getStorageKey,
            getGlobalStorageKey,
            saveColPrefs,
            loadColPrefs,
            orderSummaryColumnsNamedFirst,
        } =
            await import("../../../../../electron-app/utils/rendering/helpers/renderSummaryHelpers.js");
        const { showColModal } =
            await import("../../../../../electron-app/utils/rendering/helpers/summaryColModal.js");

        const allKeys = [
            "Speed",
            "Distance",
            "HeartRate",
        ];

        const fileKey = getStorageKey(
            (globalThis.window as TestWindowGlobal).globalData,
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
        const setVisibleColumns = vi.fn<(cols: string[]) => void>((cols) => {
            visible = [...cols];
        });
        const renderTable = vi.fn<() => void>();

        showColModal({
            allKeys,
            data: {},
            renderTable,
            setVisibleColumns,
            visibleColumns: visible,
        });

        const overlay = requireElement(
            document.querySelector(".summary-col-modal-overlay"),
            HTMLElement,
            "Expected summary column modal overlay to render"
        );

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
        const resetBtn = findButton(buttons, "Reset to Default");
        resetBtn.click();

        // Sanity: selection now matches global default.
        expect(visible).toEqual(globalDefault);

        // Close modal.
        const closeBtn = findButton(buttons, "Close");
        closeBtn.click();

        // File key should stay cleared, not recreated.
        expect(localStorage.getItem(fileKey)).toBeNull();

        // Global default should still be present.
        expect(loadColPrefs(globalKey)).toEqual(globalDefault);
    });
});
