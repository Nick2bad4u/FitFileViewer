import { describe, expect, it, vi } from "vitest";

import { showColModal } from "../../../../../electron-app/utils/rendering/helpers/summaryColModal.js";
import {
    getStorageKey,
    loadColPrefs,
} from "../../../../../electron-app/utils/rendering/helpers/renderSummaryHelpers.js";
import { setGlobalData } from "../../../../../electron-app/utils/state/core/globalDataStore.js";
import { __resetStateManagerForTests } from "../../../../../electron-app/utils/state/core/stateManager.js";

type Cleanup = () => void;

type WindowWithGlobalData = Window & {
    globalData?: { cachedFilePath: string };
};

function setupDomTest(): Cleanup {
    const windowWithGlobalData = globalThis.window as WindowWithGlobalData;
    const hadGlobalData = Object.hasOwn(windowWithGlobalData, "globalData");
    const originalGlobalData = windowWithGlobalData.globalData;
    const originalClipboard = globalThis.navigator.clipboard;
    const writeText = vi
        .fn<(text: string) => Promise<void>>()
        .mockResolvedValue(undefined);

    __resetStateManagerForTests();
    document.body.replaceChildren();
    localStorage.clear();
    setGlobalData({ cachedFilePath: "/tmp/file.fit" }, { source: "test" });
    Object.defineProperty(globalThis.navigator, "clipboard", {
        configurable: true,
        value: { writeText },
    });

    return () => {
        __resetStateManagerForTests();
        document.body.replaceChildren();
        localStorage.clear();
        if (hadGlobalData) {
            Object.defineProperty(windowWithGlobalData, "globalData", {
                configurable: true,
                value: originalGlobalData,
                writable: true,
            });
        } else {
            Reflect.deleteProperty(windowWithGlobalData, "globalData");
        }
        Object.defineProperty(globalThis.navigator, "clipboard", {
            configurable: true,
            value: originalClipboard,
        });
    };
}

function getModalOverlay(): HTMLElement {
    const overlay = document.querySelector(".summary-col-modal-overlay");
    if (!(overlay instanceof HTMLElement)) {
        throw new TypeError("Expected the summary column modal overlay.");
    }
    return overlay;
}

function getInputByLabel(
    container: HTMLElement,
    labelText: string
): HTMLInputElement {
    const label = Array.from(container.querySelectorAll("label")).find(
        (element) => element.textContent?.trim() === labelText
    );
    if (!(label instanceof HTMLLabelElement)) {
        throw new TypeError(`Expected a label named "${labelText}".`);
    }
    const input = label.querySelector("input");
    if (!(input instanceof HTMLInputElement)) {
        throw new TypeError(`Expected "${labelText}" to label an input.`);
    }
    return input;
}

function getButtonByText(
    container: HTMLElement,
    buttonText: string
): HTMLButtonElement {
    const button = Array.from(container.querySelectorAll("button")).find(
        (element) => element.textContent?.trim() === buttonText
    );
    if (!(button instanceof HTMLButtonElement)) {
        throw new TypeError(`Expected a button named "${buttonText}".`);
    }
    return button;
}

function getCheckedColumnLabels(overlay: HTMLElement): string[] {
    return Array.from(
        overlay.querySelectorAll<HTMLLabelElement>(".col-list label")
    )
        .filter((label) => {
            const input = label.querySelector("input");
            return (
                input instanceof HTMLInputElement &&
                !input.disabled &&
                input.checked
            );
        })
        .map((label) => label.textContent?.trim() ?? "");
}

describe("showColModal interactions", () => {
    it("toggles Select All / Deselect All and persists immediately (auto-save)", () => {
        expect.assertions(22);

        const cleanup = setupDomTest();
        try {
            const opener = document.createElement("button");
            opener.type = "button";
            opener.textContent = "Open column selector";
            document.body.append(opener);
            opener.focus();

            const allKeys = [
                "Speed",
                "Distance",
                "HeartRate",
            ];
            let visible: string[] = ["Speed"];
            const setVisibleColumns = vi.fn<(cols: string[]) => void>(
                (cols) => {
                    visible = [...cols];
                }
            );
            const reRender = vi.fn<() => void>();

            showColModal({
                allKeys,
                renderTable: reRender,
                setVisibleColumns,
                visibleColumns: visible,
            });

            const overlay = getModalOverlay();

            expect(
                overlay.classList.contains("summary-col-modal-overlay")
            ).toBe(true);
            const modal = overlay.querySelector(".summary-col-modal");
            expect(modal).toBeInstanceOf(HTMLElement);
            expect(modal?.getAttribute("role")).toBe("dialog");
            expect(modal?.getAttribute("aria-modal")).toBe("true");
            expect(modal?.getAttribute("aria-labelledby")).toBe(
                "summary-col-modal-title"
            );
            expect(document.activeElement).toBe(
                overlay.querySelector(".summary-col-search")
            );

            const selectAllButton = getButtonByText(overlay, "Select All");

            expect(selectAllButton.textContent).toBe("Select All");

            expect(getCheckedColumnLabels(overlay)).toStrictEqual(["Speed"]);

            selectAllButton.click();

            expect(selectAllButton.textContent).toBe("Deselect All");

            expect(setVisibleColumns).toHaveBeenLastCalledWith(allKeys);

            expect(visible).toStrictEqual(allKeys);

            expect(reRender).toHaveBeenCalledOnce();

            expect(getCheckedColumnLabels(overlay)).toStrictEqual(allKeys);

            const key = getStorageKey(
                { cachedFilePath: "/tmp/file.fit" },
                allKeys
            );
            const storedAfterSelectAll = loadColPrefs(key, allKeys);

            expect(storedAfterSelectAll).toBeNull();

            const distanceInput = getInputByLabel(overlay, "Distance");

            expect(distanceInput).toMatchObject({ checked: true });

            distanceInput.click();

            expect(selectAllButton.textContent?.trim()).toBe("Select All");

            expect(visible).toStrictEqual(["Speed", "HeartRate"]);

            expect(reRender).toHaveBeenCalledTimes(2);

            expect(getCheckedColumnLabels(overlay)).toStrictEqual([
                "Speed",
                "HeartRate",
            ]);

            const storedAfterUncheck = loadColPrefs(key, allKeys);

            expect(storedAfterUncheck).toStrictEqual(["Speed", "HeartRate"]);

            const closeButton = getButtonByText(overlay, "Close");
            closeButton.click();

            expect(
                document.querySelector(".summary-col-modal-overlay")
            ).toBeNull();
            expect(document.activeElement).toBe(opener);
        } finally {
            cleanup();
        }
    });

    it("wraps keyboard focus inside the modal", () => {
        expect.assertions(3);

        const cleanup = setupDomTest();
        try {
            showColModal({
                allKeys: ["A", "B"],
                renderTable: vi.fn<() => void>(),
                setVisibleColumns: vi.fn<(cols: string[]) => void>(),
                visibleColumns: ["A"],
            });

            const overlay = getModalOverlay();
            const searchInput = overlay.querySelector(".summary-col-search");
            const headerCloseButton = overlay.querySelector(
                ".summary-col-modal-close"
            );
            const footerCloseButton = getButtonByText(overlay, "Close");

            footerCloseButton.focus();
            const tabEvent = new KeyboardEvent("keydown", {
                bubbles: true,
                cancelable: true,
                key: "Tab",
            });
            document.dispatchEvent(tabEvent);

            expect(searchInput).toBeInstanceOf(HTMLInputElement);
            expect(tabEvent.defaultPrevented).toBe(true);
            expect(document.activeElement).toBe(headerCloseButton);
        } finally {
            cleanup();
        }
    });

    it("shift-click selects a range and persists immediately via saveColPrefs in handlers", () => {
        expect.assertions(9);

        const cleanup = setupDomTest();
        try {
            const allKeys = [
                "A",
                "B",
                "C",
                "D",
                "E",
            ];
            let visible: string[] = [];
            const setVisibleColumns = vi.fn<(cols: string[]) => void>(
                (cols) => {
                    visible = [...cols];
                }
            );
            const reRender = vi.fn<() => void>();

            showColModal({
                allKeys,
                renderTable: reRender,
                setVisibleColumns,
                visibleColumns: visible,
            });

            const overlay = getModalOverlay();
            const columnC = getInputByLabel(overlay, "C");
            columnC.click();

            expect(setVisibleColumns).toHaveBeenLastCalledWith(["C"]);

            expect(visible).toStrictEqual(["C"]);

            expect(reRender).toHaveBeenCalledOnce();

            expect(getCheckedColumnLabels(overlay)).toStrictEqual(["C"]);

            const columnE = getInputByLabel(overlay, "E");
            const shiftMouseDown = new MouseEvent("mousedown", {
                bubbles: true,
                cancelable: true,
                shiftKey: true,
            });
            columnE.dispatchEvent(shiftMouseDown);

            expect(setVisibleColumns).toHaveBeenLastCalledWith([
                "C",
                "D",
                "E",
            ]);

            expect(visible).toStrictEqual([
                "C",
                "D",
                "E",
            ]);

            expect(reRender).toHaveBeenCalledTimes(2);

            expect(getCheckedColumnLabels(overlay)).toStrictEqual([
                "C",
                "D",
                "E",
            ]);

            const key = getStorageKey(
                { cachedFilePath: "/tmp/file.fit" },
                allKeys
            );
            const stored = loadColPrefs(key, allKeys);

            expect(stored).toStrictEqual([
                "C",
                "D",
                "E",
            ]);
        } finally {
            cleanup();
        }
    });
});
