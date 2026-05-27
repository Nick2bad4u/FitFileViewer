// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

import { showColModal } from "../../../../electron-app/utils/rendering/helpers/summaryColModal.js";

type SummaryWindow = Window &
    typeof globalThis & {
        globalData?: {
            cachedFilePath?: string;
        };
    };

function getSummaryWindow(): SummaryWindow {
    return window as SummaryWindow;
}

function resetSummaryModalFixture(): void {
    document.body.replaceChildren();
    localStorage.clear();
    delete getSummaryWindow().globalData;
}

function getRequiredElement<TElement extends Element>(
    selector: string
): TElement {
    const element = document.querySelector<TElement>(selector);
    if (!element) {
        throw new TypeError(`Missing element for ${selector}`);
    }

    return element;
}

function getButtonByText(text: string): HTMLButtonElement {
    const button = [
        ...document.querySelectorAll<HTMLButtonElement>("button"),
    ].find((candidate) => candidate.textContent === text);
    if (!button) {
        throw new TypeError(`Missing button with text ${text}`);
    }

    return button;
}

function getCheckboxByLabelText(text: string): HTMLInputElement {
    const label = [...document.querySelectorAll("label")].find(
        (candidate) => candidate.textContent === text
    );
    const checkbox = label?.querySelector<HTMLInputElement>(
        'input[type="checkbox"]'
    );
    if (!checkbox) {
        throw new TypeError(`Missing checkbox with label ${text}`);
    }

    return checkbox;
}

describe("summaryColModal", () => {
    it("updates file and global column preferences from modal controls", () => {
        expect.assertions(14);

        resetSummaryModalFixture();

        try {
            getSummaryWindow().globalData = {
                cachedFilePath: "C:\\Activities\\ride.fit",
            };
            const fileStorageKey = `summaryColSel_${encodeURIComponent(
                "C:\\Activities\\ride.fit"
            )}`;
            const renderTable = vi.fn<() => void>();
            const setVisibleColumns = vi.fn<(cols: string[]) => void>();

            showColModal({
                allKeys: [
                    "2",
                    "speed",
                    "distance",
                ],
                renderTable,
                setVisibleColumns,
                visibleColumns: ["speed"],
            });

            const overlay = getRequiredElement<HTMLElement>(
                ".summary-col-modal-overlay"
            );
            const selectedCount = getRequiredElement<HTMLElement>(
                ".summary-col-selected-count"
            );
            const labels = [
                ...document.querySelectorAll<HTMLLabelElement>(
                    ".col-list label"
                ),
            ].map((label) => label.textContent);

            expect([...document.body.children]).toContain(overlay);
            expect(selectedCount.textContent).toBe("Selected 1 / 3");
            expect(labels).toStrictEqual([
                "Type",
                "speed",
                "distance",
                "2",
            ]);

            const distanceCheckbox = getCheckboxByLabelText("distance");
            distanceCheckbox.checked = true;
            distanceCheckbox.dispatchEvent(
                new Event("change", { bubbles: true })
            );

            expect(setVisibleColumns).toHaveBeenLastCalledWith([
                "speed",
                "distance",
            ]);
            expect(renderTable).toHaveBeenCalledOnce();
            expect(localStorage.getItem(fileStorageKey)).toBe(
                JSON.stringify(["speed", "distance"])
            );
            expect(selectedCount.textContent).toBe("Selected 2 / 3");

            getButtonByText("Make Global Default").click();

            expect(localStorage.getItem("summaryColSel_global_default")).toBe(
                JSON.stringify(["speed", "distance"])
            );
            expect(localStorage.getItem(fileStorageKey)).toBeNull();
            expect(renderTable).toHaveBeenCalledTimes(2);

            const search = getRequiredElement<HTMLInputElement>(
                ".summary-col-search"
            );
            search.value = "missing";
            search.dispatchEvent(new Event("input", { bubbles: true }));

            expect(
                getRequiredElement<HTMLElement>(".summary-col-empty")
                    .textContent
            ).toBe("No matching columns");

            getButtonByText("Close").click();

            expect([...document.body.children]).not.toContain(overlay);
            expect(
                overlay.dispatchEvent(
                    new KeyboardEvent("keydown", { key: "Escape" })
                )
            ).toBe(true);
            expect(
                document.querySelector(".summary-col-modal-overlay")
            ).toBeNull();
        } finally {
            resetSummaryModalFixture();
        }
    });
});
