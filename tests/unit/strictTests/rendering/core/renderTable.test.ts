import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock copyTableAsCSV to observe calls
vi.mock(
    import("../../../../../electron-app/utils/files/export/copyTableAsCSV.js"),
    () => ({
        copyTableAsCSV: vi.fn<(table: unknown) => Promise<void>>(),
    })
);

const dataTableModuleMock = vi.hoisted(() => ({
    DataTable: vi.fn<DataTableConstructor>(),
}));

type DataTableConstructor = {
    (
        selector: string,
        opts?: {
            columns?: unknown[];
            data?: unknown[];
        }
    ): DataTableInstance;
    isDataTable?: (selector: string) => boolean;
};

type DataTableInstance = {
    columns?: {
        adjust: () => void;
    };
    destroy: () => void;
};

// Helper to import fresh module per test
async function loadModule() {
    return import("../../../../../electron-app/utils/rendering/core/renderTable.js");
}

function createTableLike() {
    return {
        rows: [{ A: 1, B: 2 }],
    } as any;
}

function createMaliciousTableLike() {
    return {
        rows: [
            {
                A: "<img src=x onerror=alert(1)>",
                B: "<a href=javascript:alert(2)>x</a>",
            },
        ],
    } as any;
}

describe("renderTable", () => {
    beforeEach(async () => {
        const root = document.createElement("div");
        root.id = "root";
        document.body.replaceChildren(root);
        dataTableModuleMock.DataTable.mockReset();
        dataTableModuleMock.DataTable.isDataTable = vi.fn<
            (selector: string) => boolean
        >(() => false);
        dataTableModuleMock.DataTable.mockImplementation(
            function DataTableMock() {
                return {
                    columns: {
                        adjust: vi.fn<() => void>(),
                    },
                    destroy: vi.fn<() => void>(),
                };
            }
        );
        const { setDataTableRuntime } =
            await import("../../../../../electron-app/utils/rendering/core/dataTableRuntime.js");
        setDataTableRuntime(dataTableModuleMock.DataTable);
        vi.useFakeTimers();
    });
    afterEach(async () => {
        const { clearDataTableRuntimeForTests } =
            await import("../../../../../electron-app/utils/rendering/core/dataTableRuntime.js");
        clearDataTableRuntimeForTests();
        vi.useRealTimers();
        vi.resetModules();
        vi.clearAllMocks();
    });

    it("renders section, toggles visibility, and copies CSV via helper", async () => {
        expect.assertions(9);

        const { renderTable } = await loadModule();
        const root = document.getElementById("root")!;
        const tableLike = createTableLike();

        await renderTable(root, "My Title", tableLike, 1);

        const section = root.querySelector(".table-section") as HTMLElement;
        expect(section).toBeInstanceOf(HTMLElement);
        const header = section.querySelector(".table-header") as HTMLElement;
        const icon = header.querySelector("span:last-child") as HTMLSpanElement;
        const content = section.querySelector(".table-content") as HTMLElement;
        expect(header).toBeInstanceOf(HTMLElement);
        expect(icon).toBeInstanceOf(HTMLSpanElement);
        expect(content).toBeInstanceOf(HTMLElement);
        expect(content.style.display).toBe("none");

        // Toggle open
        header.click();
        expect(content.style.display).toBe("block");
        expect(icon.textContent).toBe("➖");

        // Copy button
        const copyBtn = header.querySelector(".copy-btn") as HTMLButtonElement;
        expect(copyBtn).toBeInstanceOf(HTMLButtonElement);
        copyBtn.click();
        const { copyTableAsCSV } =
            await import("../../../../../electron-app/utils/files/export/copyTableAsCSV.js");
        expect(copyTableAsCSV).toHaveBeenCalledOnce();
    });

    it("renders a fallback body before DataTables enhancement runs", async () => {
        expect.assertions(2);

        const { renderTable } = await loadModule();
        const root = document.getElementById("root")!;
        await renderTable(root, "No jQ", createTableLike(), 2);

        const table = root.querySelector(
            "table#datatable_2"
        ) as HTMLTableElement;
        expect(table).toBeInstanceOf(HTMLTableElement);

        // Expand to render fallback body
        (root.querySelector(".table-header") as HTMLElement).click();
        const firstCell = root.querySelector(
            "tbody td"
        ) as HTMLTableCellElement;
        expect(firstCell?.textContent).toBe("1");
    });

    it("skips DataTables enhancement for malformed constructor markers", async () => {
        expect.assertions(2);

        (
            dataTableModuleMock.DataTable as { isDataTable?: unknown }
        ).isDataTable = "not a static marker";

        const { renderTable } = await loadModule();
        const root = document.getElementById("root")!;

        await renderTable(root, "Malformed DT", createTableLike(), 4);
        (root.querySelector(".table-header") as HTMLElement).click();
        vi.runAllTimers();

        expect(dataTableModuleMock.DataTable).not.toHaveBeenCalled();
        expect(root.querySelector("table#datatable_4")).toBeInstanceOf(
            HTMLTableElement
        );
    });

    it("sanitizes injected markup from table HTML", async () => {
        expect.assertions(3);

        const { renderTable } = await loadModule();
        const root = document.getElementById("root")!;

        await renderTable(root, "XSS", createMaliciousTableLike(), 9);

        // Expand to render fallback body
        (root.querySelector(".table-header") as HTMLElement).click();

        const table = root.querySelector(
            "table#datatable_9"
        ) as HTMLTableElement;
        expect(table).toBeInstanceOf(HTMLTableElement);

        // Ensure potentially executable elements are not present (we only set textContent).
        expect(table.querySelector("img")).toBeNull();
        expect(table.querySelector("a")).toBeNull();
    });

    it("initializes DataTable from the runtime adapter and destroys prior instance", async () => {
        expect.assertions(2);

        const calls: Array<{
            selector: string;
            opts?: any;
            destroyed?: boolean;
        }> = [];
        const state: Record<string, { initialized: boolean }> = {};
        dataTableModuleMock.DataTable.isDataTable = vi.fn<
            (selector: string) => boolean
        >((selector) => Boolean(state[selector]?.initialized));
        dataTableModuleMock.DataTable.mockImplementation(
            function DataTableMock(selector, opts) {
                if (opts) {
                    state[selector] = { initialized: true };
                    calls.push({ selector, opts });
                }

                return {
                    columns: {
                        adjust: vi.fn<() => void>(),
                    },
                    destroy() {
                        calls.push({ selector, destroyed: true });
                        state[selector] = { initialized: false };
                    },
                };
            }
        );

        const { renderTable } = await loadModule();
        const root = document.getElementById("root")!;

        // First render/initialize
        await renderTable(root, "DT", createTableLike(), 3);
        // Init happens on expand.
        (root.querySelector(".table-header") as HTMLElement).click();
        vi.runAllTimers();
        const selector = "#datatable_3";
        expect(calls.some((c) => c.selector === selector && c.opts)).toBe(true);

        // Simulate re-render that should destroy then init
        state[selector] = { initialized: true };
        await renderTable(root, "DT", createTableLike(), 3);
        // Expand the second rendered section to trigger init/destroy logic.
        const headers = Array.from(
            root.querySelectorAll(".table-header")
        ) as HTMLElement[];
        headers[headers.length - 1].click();
        vi.runAllTimers();
        const destroyed = calls.filter(
            (c) => c.selector === selector && c.destroyed
        ).length;
        expect(destroyed).toBeGreaterThanOrEqual(1);
    });
});
