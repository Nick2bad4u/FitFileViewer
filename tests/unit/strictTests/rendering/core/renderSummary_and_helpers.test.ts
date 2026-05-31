import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

import type { SummaryRenderData } from "../../../../../electron-app/utils/rendering/core/renderSummary.js";
import type { FitSummaryData } from "../../../../../electron-app/utils/rendering/helpers/renderSummaryHelpers.js";

async function importHelpers() {
    return await import("../../../../../electron-app/utils/rendering/helpers/renderSummaryHelpers.js");
}
async function importRenderSummary() {
    return await import("../../../../../electron-app/utils/rendering/core/renderSummary.js");
}

type SummaryWindow = Window &
    typeof globalThis & {
        activeFitFileName?: string;
        globalData?: FitSummaryData;
    };

function getSummaryWindow(): SummaryWindow {
    return window as SummaryWindow;
}

function createSummaryContainer(): HTMLElement {
    const container = document.createElement("div");
    container.id = "content-summary";
    document.body.replaceChildren(container);
    return container;
}

function getRequiredElement<T extends Element>(
    root: ParentNode,
    selector: string
): T {
    const element = root.querySelector<T>(selector);
    if (!element) {
        throw new Error(`Expected element for selector: ${selector}`);
    }
    return element;
}

function getTextBySelector(root: ParentNode, selector: string): string[] {
    return [...root.querySelectorAll(selector)].map(
        (element) => element.textContent ?? ""
    );
}

describe("renderSummary helpers + renderSummary", () => {
    beforeEach(() => {
        createSummaryContainer();
        localStorage.clear();
        delete getSummaryWindow().activeFitFileName;
        delete getSummaryWindow().globalData;
    });
    afterEach(() => {
        vi.resetModules();
        delete getSummaryWindow().activeFitFileName;
        delete getSummaryWindow().globalData;
        document.body.replaceChildren();
    });

    it("getStorageKey prefers window.globalData.cachedFilePath then data.cachedFilePath then activeFitFileName", async () => {
        expect.hasAssertions();

        const { getStorageKey } = await importHelpers();
        const summaryWindow = getSummaryWindow();

        expect(getStorageKey({}, [])).toBe("summaryColSel_default");

        summaryWindow.activeFitFileName = "active.fit";
        expect(getStorageKey({ cachedFilePath: "/a/b/c.fit" }, [])).toBe(
            `summaryColSel_${encodeURIComponent("/a/b/c.fit")}`
        );

        summaryWindow.globalData = { cachedFilePath: "C:/tmp/foo.fit" };
        expect(getStorageKey({ cachedFilePath: "/a/b/c.fit" }, [])).toBe(
            `summaryColSel_${encodeURIComponent("C:/tmp/foo.fit")}`
        );

        delete summaryWindow.globalData;
        expect(getStorageKey({}, [])).toBe(
            `summaryColSel_${encodeURIComponent("active.fit")}`
        );
    });

    it("save/load column preferences roundtrip", async () => {
        expect.hasAssertions();

        const { saveColPrefs, loadColPrefs } = await importHelpers();
        const key = "summaryColSel_test";
        const cols = [
            "a",
            "b",
            "c",
        ];
        saveColPrefs(key, cols, undefined);
        expect(loadColPrefs(key, undefined)).toEqual(cols);
        // Invalid stored value returns null
        localStorage.setItem(key, "not-an-array");
        expect(loadColPrefs(key, undefined)).toBeNull();
    });

    it("renderSummary renders header, gear button opens modal, and table rows filter", async () => {
        expect.hasAssertions();

        const { renderSummary } = await importRenderSummary();
        const data: SummaryRenderData = {
            sessionMesgs: [{ total_ascent: 100, total_descent: 80 }],
            lapMesgs: [
                { lap_index: 1, total_time: 10 },
                { lap_index: 2, total_time: 12 },
            ],
        };

        renderSummary(data);
        const container = getRequiredElement<HTMLElement>(
            document,
            "#content-summary"
        );
        const headerTitle = getRequiredElement<HTMLElement>(
            container,
            ".summary-title"
        );
        const gear = getRequiredElement<HTMLButtonElement>(
            container,
            ".summary-gear-btn"
        );
        const select = getRequiredElement<HTMLSelectElement>(
            container,
            ".summary-filter-bar select"
        );

        expect(headerTitle.textContent).toBe("Activity Summary");
        expect(gear.title).toBe("Select columns");
        expect(
            getRequiredElement<SVGSVGElement>(
                gear,
                ".summary-gear-btn__icon"
            ).getAttribute("viewBox")
        ).toBe("0 0 24 24");
        expect([...select.options].map((option) => option.value)).toStrictEqual(
            [
                "All",
                "Summary",
                "Lap 1",
                "Lap 2",
            ]
        );
        expect(getTextBySelector(container, "th")).toStrictEqual([
            "Type",
            "total_ascent",
            "total_descent",
            "lap_index",
            "total_time",
        ]);
        expect(
            getTextBySelector(container, "tbody tr td:first-child")
        ).toStrictEqual([
            "Summary",
            "Lap 1",
            "Lap 2",
        ]);

        gear.click();
        const modal = getRequiredElement<HTMLElement>(
            document,
            ".summary-col-modal-overlay"
        );
        expect([...document.body.children]).toContain(modal);
        expect(
            getRequiredElement<HTMLElement>(
                modal,
                ".summary-col-selected-count"
            ).textContent
        ).toBe("Selected 4 / 4");

        select.value = "Lap 1";
        select.dispatchEvent(new Event("change"));
        expect(
            getTextBySelector(container, "tbody tr td:first-child")
        ).toStrictEqual(["Lap 1"]);
        expect(
            getTextBySelector(container, "tbody tr:first-child td")
        ).toStrictEqual([
            "Lap 1",
            "",
            "",
            "1",
            "10",
        ]);
    });
});
