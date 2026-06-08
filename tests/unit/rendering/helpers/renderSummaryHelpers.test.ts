// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import {
    getGlobalStorageKey,
    getRowLabel,
    getStorageKey,
    isNumberedSummaryColumnKey,
    loadColPrefs,
    orderSummaryColumnsNamedFirst,
    renderTable,
    saveColPrefs,
} from "../../../../electron-app/utils/rendering/helpers/renderSummaryHelpers.js";
import { setGlobalData } from "../../../../electron-app/utils/state/core/globalDataStore.js";
import { __resetStateManagerForTests } from "../../../../electron-app/utils/state/core/stateManager.js";

type SummaryWindow = Window &
    typeof globalThis & {
        activeFitFileName?: string;
    };

function getSummaryWindow(): SummaryWindow {
    return window as SummaryWindow;
}

function resetSummaryFixture(): void {
    __resetStateManagerForTests();
    document.body.replaceChildren();
    localStorage.clear();
    delete getSummaryWindow().activeFitFileName;
    Reflect.deleteProperty(globalThis, "globalData");
}

describe("renderSummaryHelpers", () => {
    it("orders named columns before numeric-only columns", () => {
        expect.assertions(3);

        expect(
            ["12", "speed"].map((key) => isNumberedSummaryColumnKey(key))
        ).toStrictEqual([true, false]);

        expect(
            orderSummaryColumnsNamedFirst([
                "2",
                "speed",
                "1",
                "distance",
            ])
        ).toStrictEqual([
            "speed",
            "distance",
            "2",
            "1",
        ]);

        expect(getRowLabel(2, true)).toBe("Lap 3");
    });

    it("persists and validates column preferences", () => {
        expect.assertions(4);

        resetSummaryFixture();

        try {
            const filePath = "C:\\Activities\\ride.fit";
            setGlobalData({ cachedFilePath: filePath }, { source: "test" });

            const fileKey = getStorageKey({}, ["speed"]);

            expect(fileKey).toBe(
                `summaryColSel_${encodeURIComponent(filePath)}`
            );

            expect(getGlobalStorageKey()).toBe("summaryColSel_global_default");

            saveColPrefs(fileKey, ["speed", "distance"]);

            expect(loadColPrefs(fileKey)).toStrictEqual(["speed", "distance"]);

            localStorage.setItem(fileKey, JSON.stringify(["speed", 123]));

            expect(loadColPrefs(fileKey)).toBeNull();
        } finally {
            resetSummaryFixture();
        }
    });

    it("renders summary and lap rows for selected columns", () => {
        expect.assertions(4);

        resetSummaryFixture();

        try {
            const container = document.createElement("section");
            const gearBtn = document.createElement("button");
            const setVisibleColumns = (): void => {};

            renderTable({
                container,
                data: {
                    lapMesgs: [
                        {
                            speed: "11 mph",
                            startTime: "2026-05-21T12:05:00Z",
                        },
                    ],
                    sessionMesgs: [
                        {
                            distance: "2.5 mi",
                            speed: "10 mph",
                        },
                    ],
                },
                gearBtn,
                setVisibleColumns,
                visibleColumns: ["speed", "timestamp"],
            });

            const headings = [
                ...container.querySelectorAll<HTMLTableCellElement>("th"),
            ].map((cell) => cell.textContent);
            const rows = [
                ...container.querySelectorAll<HTMLTableRowElement>("tbody tr"),
            ].map((row) =>
                [...row.querySelectorAll("td")].map((cell) => cell.textContent)
            );

            expect(
                container.querySelector(".summary-filter-bar")
                    ?.firstElementChild
            ).toBe(gearBtn);

            expect(headings).toStrictEqual([
                "Type",
                "speed",
                "timestamp",
            ]);

            expect(rows[0]).toStrictEqual([
                "Summary",
                "10 mph",
                "",
            ]);

            expect(rows[1]).toStrictEqual([
                "Lap 1",
                "11 mph",
                "2026-05-21T12:05:00Z",
            ]);
        } finally {
            resetSummaryFixture();
        }
    });
});
