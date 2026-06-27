import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    clearArqueroRuntimeForTests,
    setArqueroRuntime,
} from "../../../../../electron-app/utils/rendering/helpers/arqueroRuntime.js";
import { renderTable } from "../../../../../electron-app/utils/rendering/helpers/renderSummaryHelpers.js";

function getRequiredElement<T extends Element>(
    container: ParentNode,
    selector: string
): T {
    const element = container.querySelector<T>(selector);
    if (!element) {
        throw new Error(`Missing expected element: ${selector}`);
    }
    return element;
}

function getCellTexts(row: HTMLTableRowElement): string[] {
    return Array.from(row.querySelectorAll("td"), (td) => td.textContent ?? "");
}

describe("renderTable behavior", () => {
    beforeEach(() => {
        const host = document.createElement("div");
        host.id = "host";
        document.body.replaceChildren(host);
        vi.resetModules();
        vi.restoreAllMocks();
        clearArqueroRuntimeForTests();
        setArqueroRuntime({
            from(arr: any[]) {
                const data = [...arr];
                return {
                    numRows: () => data.length,
                    get: (col: string, idx = 0) => data[idx]?.[col],
                    columnNames: () =>
                        data.length ? Object.keys(data[0]) : [],
                    array: (col: string) =>
                        data.map((r) => r[col]).filter((v) => v !== undefined),
                };
            },
        });
        // Stub clipboard
        (global.navigator as any).clipboard = {
            writeText: vi.fn<(data: string) => Promise<void>>(),
        };
    });

    it("renders headers, summary row from sessionMesgs, and lap rows with timestamp/startTime override", async () => {
        expect.assertions(8);

        const container = getRequiredElement<HTMLElement>(document, "#host");
        const gearBtn = document.createElement("button");
        const data = {
            sessionMesgs: [
                {
                    total_ascent: 100, // ensures _ft field is added by patchSummaryFields
                    total_descent: 50,
                    avg_speed: 2.5,
                },
            ],
            lapMesgs: [
                {
                    timestamp: "2020-01-01T00:00:00Z",
                    startTime: "T0",
                    other: 1,
                },
                {
                    timestamp: "2020-01-01T00:10:00Z",
                    startTime: "T10",
                    other: 2,
                },
            ],
            recordMesgs: [
                {
                    timestamp: "2020-01-01T00:00:00Z",
                    distance: 0,
                    speed: 1,
                    altitude: 10,
                },
            ],
        } as any;
        const visibleColumns = [
            "total_ascent_ft",
            "total_descent_ft",
            "avg_speed",
            "other",
            "timestamp",
        ];
        const setVisibleColumns = vi.fn<(columns: string[]) => void>();

        renderTable({
            container,
            data,
            gearBtn,
            setVisibleColumns,
            visibleColumns,
        });
        const section = getRequiredElement<HTMLElement>(
            container,
            ".summary-section"
        );
        expect(section.classList.contains("summary-section")).toBe(true);
        // Header should include Type + visible columns
        const headers = Array.from(
            section.querySelectorAll("thead th"),
            (th) => th.textContent
        );
        expect(headers).toEqual(["Type", ...visibleColumns]);
        expect(headers).not.toContain("hidden_field");

        const summaryRow = getRequiredElement<HTMLTableRowElement>(
            section,
            ".summary-summary-body tr"
        );
        expect(getCellTexts(summaryRow)[0]).toBe("Summary");

        // Lap rows exist and have label and timestamp override by startTime
        const lapRows = section.querySelectorAll<HTMLTableRowElement>(
            ".summary-lap-body tr"
        );
        expect(lapRows).toHaveLength(data.lapMesgs.length);
        const lap1Cells = getCellTexts(lapRows[0]);
        expect(lap1Cells[0]).toBe("Lap 1");
        // timestamp column should show startTime per implementation
        const tsIdx = headers.indexOf("timestamp");
        expect(tsIdx).toBeGreaterThanOrEqual(0);
        expect(lap1Cells[tsIdx]).toBe("T0");
    });

    it("filter selection persists on container and wheel changes selection triggering re-render", async () => {
        expect.assertions(3);

        const container = document.querySelector("#host") as any;
        const gearBtn = document.createElement("button");
        const data = {
            lapMesgs: [
                {},
                {},
                {},
            ],
        } as any;
        const visibleColumns: string[] = [];
        const setVisibleColumns = vi.fn<(columns: string[]) => void>();

        renderTable({
            container,
            data,
            gearBtn,
            setVisibleColumns,
            visibleColumns,
        });
        const select = container.querySelector(
            ".summary-filter-bar select"
        ) as HTMLSelectElement;
        expect(select.value).toBe("All");
        // Change to Lap 2 via wheel event
        const evt = new WheelEvent("wheel", {
            deltaY: 1,
            bubbles: true,
            cancelable: true,
        });
        select.dispatchEvent(evt);
        // After re-render, a new select exists; its value should match cached _summaryFilterValue and not be "All"
        const newSelect = container.querySelector(
            ".summary-filter-bar select"
        ) as HTMLSelectElement;
        expect(newSelect.value).toBe(container._summaryFilterValue);
        expect(newSelect.value).toMatch(/^(Summary|Lap [1-3])$/);
    });

    it("copy as CSV writes expected header and at least one row", async () => {
        expect.assertions(6);

        const container = document.querySelector("#host") as HTMLElement;
        const gearBtn = document.createElement("button");
        const data = {
            sessionMesgs: [
                { total_ascent: 10, total_descent: 5, avg_speed: 2 },
            ],
            lapMesgs: [{ other: 1 }],
        } as any;
        const visibleColumns = [
            "avg_speed",
            "total_ascent_ft",
            "total_descent_ft",
        ];
        const setVisibleColumns = vi.fn<(columns: string[]) => void>();
        renderTable({
            container,
            data,
            gearBtn,
            setVisibleColumns,
            visibleColumns,
        });
        const copyBtn = container.querySelector(
            ".copy-btn"
        ) as HTMLButtonElement;
        expect(copyBtn).toBeInstanceOf(HTMLButtonElement);
        expect(copyBtn.textContent).toBe("Copy as CSV");
        copyBtn.click();
        const written = vi.mocked((navigator as any).clipboard.writeText);
        expect(written).toHaveBeenCalledWith(expect.any(String));
        const csv = written.mock.calls[0][0] as string;
        const [header, firstLine] = csv.split("\n");
        expect(header.split(",")).toEqual(["Type", ...visibleColumns]);
        // First line is for Summary
        const firstLineCells = firstLine.split(",");
        expect(firstLineCells).toHaveLength(1 + visibleColumns.length);
        expect(firstLineCells[0]).toBe("Summary");
    });
});
