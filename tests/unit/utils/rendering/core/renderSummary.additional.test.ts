import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// From tests/unit/utils/rendering/core -> utils/... requires going up 5 levels
const HELPERS =
    "../../../../../electron-app/utils/rendering/helpers/renderSummaryHelpers.js";
const MODAL =
    "../../../../../electron-app/utils/rendering/helpers/summaryColModal.js";

async function importRenderSummaryModule() {
    return import("../../../../../electron-app/utils/rendering/core/renderSummary.js");
}

function createSummaryContainer(): HTMLDivElement {
    const container = document.createElement("div");
    container.id = "content-summary";
    document.body.replaceChildren(container);
    return container;
}

describe("renderSummary - modal and renderTable wiring", () => {
    beforeEach(() => {
        createSummaryContainer();
        vi.resetModules();
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("invokes renderTable and exercises showColModal callbacks", async () => {
        const renderTable = vi.fn();
        const loadColPrefs = vi.fn((_key: string, all: string[]) => all);
        const getStorageKey = vi.fn(() => "summaryColSel_testkey");
        const getGlobalStorageKey = vi.fn(() => "summaryColSel_global_default");
        const orderSummaryColumnsNamedFirst = vi.fn((cols: string[]) => cols);

        // Intercept showColModal to immediately call the provided renderTable closure and setVisibleColumns
        const showColModal = vi.fn((opts: any) => {
            // Call internal renderTable closure
            opts.renderTable();
            // Exercise setVisibleColumns
            opts.setVisibleColumns(["a", "b"]);
        });

        vi.doMock(HELPERS, () => ({
            renderTable,
            loadColPrefs,
            getGlobalStorageKey,
            getStorageKey,
            orderSummaryColumnsNamedFirst,
        }));

        vi.doMock(MODAL, () => ({
            showColModal,
        }));

        const { renderSummary } = await importRenderSummaryModule();

        const data = {
            sessionMesgs: [{ x: 1 }],
            lapMesgs: [{ y: 2 }],
            recordMesgs: [{ z: 3 }],
        } as any;

        renderSummary(data);

        // First renderTable call for initial render
        expect(renderTable).toHaveBeenCalledTimes(1);
        // Access the gear button passed into renderTable and simulate user click
        const firstArgs = renderTable.mock.calls[0][0];
        expect(firstArgs).toEqual({
            container: document.getElementById("content-summary"),
            data,
            gearBtn: expect.any(HTMLButtonElement),
            setVisibleColumns: expect.any(Function),
            visibleColumns: [
                "x",
                "y",
                "z",
            ],
        });
        const gear = firstArgs.gearBtn as HTMLButtonElement;
        expect(gear.className).toBe("summary-gear-btn");
        expect(gear.title).toBe("Select columns");
        gear.click();
        expect(showColModal).toHaveBeenCalledWith({
            allKeys: [
                "x",
                "y",
                "z",
            ],
            data,
            renderTable: expect.any(Function),
            setVisibleColumns: expect.any(Function),
            visibleColumns: [
                "x",
                "y",
                "z",
            ],
        });
        // renderTable should have been called again from inside showColModal
        expect(renderTable).toHaveBeenCalledTimes(2);
    });

    it("returns without rendering when the summary container is missing", async () => {
        document.body.replaceChildren();
        const renderTable = vi.fn();
        vi.doMock(HELPERS, () => ({
            getGlobalStorageKey: vi.fn(),
            getStorageKey: vi.fn(),
            loadColPrefs: vi.fn(),
            orderSummaryColumnsNamedFirst: vi.fn(),
            renderTable,
        }));
        vi.doMock(MODAL, () => ({
            showColModal: vi.fn(),
        }));

        const { renderSummary } = await importRenderSummaryModule();

        expect(() => renderSummary({ sessionMesgs: [{ x: 1 }] })).not.toThrow();
        expect(renderTable).not.toHaveBeenCalled();
        expect(document.body.childElementCount).toBe(0);
    });
});
