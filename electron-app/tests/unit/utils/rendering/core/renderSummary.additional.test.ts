import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// From tests/unit/utils/rendering/core -> utils/... requires going up 5 levels
const SUT = "../../../../../utils/rendering/core/renderSummary.js";
const HELPERS =
    "../../../../../utils/rendering/helpers/renderSummaryHelpers.js";
const MODAL = "../../../../../utils/rendering/helpers/summaryColModal.js";

describe("renderSummary - modal and renderTable wiring", () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="content-summary"></div>';
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

        const { renderSummary } = await import(SUT);

        const data = {
            sessionMesgs: [{ x: 1 }],
            lapMesgs: [{ y: 2 }],
            recordMesgs: [{ z: 3 }],
        } as any;

        renderSummary(data);

        // First renderTable call for initial render
        expect(renderTable).toHaveBeenCalled();
        // Access the gear button passed into renderTable and simulate user click
        const firstArgs = renderTable.mock.calls[0][0];
        expect(firstArgs).toBeDefined();
        const gear = firstArgs.gearBtn as HTMLButtonElement;
        expect(gear).toBeTruthy();
        gear.click();
        expect(showColModal).toHaveBeenCalled();
        // renderTable should have been called again from inside showColModal
        expect(renderTable.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
});
