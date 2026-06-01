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

type RenderTableArgs = {
    container: HTMLElement | null;
    data: unknown;
    gearBtn: HTMLButtonElement;
    setVisibleColumns: (columns: string[]) => void;
    visibleColumns: string[];
};

type ShowColModalArgs = {
    allKeys: string[];
    data: unknown;
    renderTable: () => void;
    setVisibleColumns: (columns: string[]) => void;
    visibleColumns: string[];
};

describe("renderSummary - modal and renderTable wiring", () => {
    beforeEach(() => {
        createSummaryContainer();
        vi.resetModules();
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("invokes renderTable and exercises showColModal callbacks", async () => {
        expect.assertions(6);

        const renderTable = vi.fn<(args: RenderTableArgs) => void>();
        const loadColPrefs = vi.fn<(key: string, all: string[]) => string[]>(
            (_key, all) => all
        );
        const getStorageKey = vi.fn<() => string>(
            () => "summaryColSel_testkey"
        );
        const getGlobalStorageKey = vi.fn<() => string>(
            () => "summaryColSel_global_default"
        );
        const orderSummaryColumnsNamedFirst = vi.fn<
            (columns: string[]) => string[]
        >((cols) => cols);

        // Intercept showColModal to immediately call the provided renderTable closure and setVisibleColumns
        const showColModal = vi.fn<(opts: ShowColModalArgs) => void>((opts) => {
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
        expect(renderTable).toHaveBeenCalledOnce();
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
        expect.assertions(3);

        document.body.replaceChildren();
        const renderTable = vi.fn<(args: RenderTableArgs) => void>();
        vi.doMock(HELPERS, () => ({
            getGlobalStorageKey: vi.fn<() => string>(),
            getStorageKey: vi.fn<() => string>(),
            loadColPrefs: vi.fn<(key: string, all: string[]) => string[]>(),
            orderSummaryColumnsNamedFirst:
                vi.fn<(columns: string[]) => string[]>(),
            renderTable,
        }));
        vi.doMock(MODAL, () => ({
            showColModal: vi.fn<(opts: ShowColModalArgs) => void>(),
        }));

        const { renderSummary } = await importRenderSummaryModule();

        expect(() => renderSummary({ sessionMesgs: [{ x: 1 }] })).not.toThrow();
        expect(renderTable).not.toHaveBeenCalled();
        expect(document.body.childElementCount).toBe(0);
    });
});
