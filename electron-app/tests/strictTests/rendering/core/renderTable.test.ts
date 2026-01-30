import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock copyTableAsCSV to observe calls
vi.mock("../../../../utils/files/export/copyTableAsCSV.js", () => ({
    copyTableAsCSV: vi.fn(),
}));

// Helper to import fresh module per test
async function loadModule() {
    const mod = await import("../../../../utils/rendering/core/renderTable.js");
    return mod;
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
    beforeEach(() => {
        document.body.innerHTML = '<div id="root"></div>';
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
        vi.resetModules();
        vi.clearAllMocks();
    });

    it("renders section, toggles visibility, and copies CSV via helper", async () => {
        const { renderTable } = await loadModule();
        const root = document.getElementById("root")!;
        const tableLike = createTableLike();

        await renderTable(root, "My Title", tableLike, 1);

        const section = root.querySelector(".table-section") as HTMLElement;
        expect(section).toBeTruthy();
        const header = section.querySelector(".table-header") as HTMLElement;
        const icon = header.querySelector("span:last-child") as HTMLSpanElement;
        const content = section.querySelector(".table-content") as HTMLElement;
        expect(content.style.display).toBe("none");

        // Toggle open
        header.click();
        expect(content.style.display).toBe("block");
        expect(icon.textContent).toBe("➖");

        // Copy button
        const copyBtn = header.querySelector(".copy-btn") as HTMLButtonElement;
        expect(copyBtn).toBeTruthy();
        copyBtn.click();
        const { copyTableAsCSV } =
            await import("../../../../utils/files/export/copyTableAsCSV.js");
        expect(copyTableAsCSV).toHaveBeenCalledTimes(1);
    });

    it("falls back gracefully when jQuery is absent", async () => {
        const { renderTable } = await loadModule();
        const root = document.getElementById("root")!;
        await renderTable(root, "No jQ", createTableLike(), 2);

        const table = root.querySelector(
            "table#datatable_2"
        ) as HTMLTableElement;
        expect(table).toBeTruthy();

        // Expand to render fallback body
        (root.querySelector(".table-header") as HTMLElement).click();
        const firstCell = root.querySelector(
            "tbody td"
        ) as HTMLTableCellElement;
        expect(firstCell?.textContent).toBe("1");
    });

    it("sanitizes injected markup from table HTML", async () => {
        const { renderTable } = await loadModule();
        const root = document.getElementById("root")!;

        await renderTable(root, "XSS", createMaliciousTableLike(), 9);

        // Expand to render fallback body
        (root.querySelector(".table-header") as HTMLElement).click();

        const table = root.querySelector(
            "table#datatable_9"
        ) as HTMLTableElement;
        expect(table).toBeTruthy();

        // Ensure potentially executable elements are not present (we only set textContent).
        expect(table.querySelector("img")).toBeNull();
        expect(table.querySelector("a")).toBeNull();
    });

    it("initializes DataTable when jQuery+DataTables present, destroying prior instance", async () => {
        const calls: Array<{
            selector: string;
            opts?: any;
            destroyed?: boolean;
        }> = [];
        // Minimal jQuery/DataTable stub
        const state: Record<string, { initialized: boolean }> = {};
        function jQ(selector: any) {
            const key =
                typeof selector === "string" ? selector : "#datatable_3";
            return {
                ready(cb?: any) {
                    // Immediately invoke as DOM is already ready in jsdom
                    if (typeof cb === "function") cb();
                    return this;
                },
                DataTable(opts?: any) {
                    if (opts) {
                        // init path
                        state[key] = { initialized: true };
                        calls.push({ selector: key, opts });
                        return {
                            destroy() {
                                calls.push({ selector: key, destroyed: true });
                                state[key] = { initialized: false } as any;
                            },
                        } as any;
                    }
                    // getter
                    return {
                        destroy() {
                            calls.push({ selector: key, destroyed: true });
                            state[key] = { initialized: false } as any;
                        },
                    } as any;
                },
            } as any;
        }
        jQ.fn = {
            DataTable: {
                isDataTable(sel: string) {
                    return Boolean(state[sel]?.initialized);
                },
            },
        } as any;

        (window as any).jQuery = jQ;

        const { renderTable } = await loadModule();
        const root = document.getElementById("root")!;

        // First render/initialize
        await renderTable(root, "DT", createTableLike(), 3);
        // Init happens on expand.
        (root.querySelector(".table-header") as HTMLElement).click();
        vi.runOnlyPendingTimers();
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
        vi.runOnlyPendingTimers();
        const destroyed = calls.filter(
            (c) => c.selector === selector && c.destroyed
        ).length;
        expect(destroyed).toBeGreaterThanOrEqual(1);
    });
});
