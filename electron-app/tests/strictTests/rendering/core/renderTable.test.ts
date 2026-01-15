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
        toHTML: ({ limit }: { limit: number }) => {
            expect(limit).toBe(Infinity);
            return "<thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody>";
        },
    } as any;
}

function createMaliciousTableLike() {
    return {
        toHTML: ({ limit }: { limit: number }) => {
            expect(limit).toBe(Infinity);
            // Attempt DOM injection in a cell.
            return (
                "<thead><tr><th>A</th><th>B</th></tr></thead>" +
                "<tbody><tr><td><img src=x onerror=alert(1)></td><td><a href=javascript:alert(2)>x</a></td></tr></tbody>"
            );
        },
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
        const { copyTableAsCSV } = await import("../../../../utils/files/export/copyTableAsCSV.js");
        expect(copyTableAsCSV).toHaveBeenCalledTimes(1);
    });

    it("falls back gracefully when jQuery is absent", async () => {
        const { renderTable } = await loadModule();
        const root = document.getElementById("root")!;
        await renderTable(root, "No jQ", createTableLike(), 2);

        // A delayed check logs and looks up the table by id
        vi.advanceTimersByTime(120);
        const table = root.querySelector("table#datatable_2") as HTMLTableElement;
        expect(table).toBeTruthy();
    });

    it("sanitizes injected markup from table HTML", async () => {
        const { renderTable } = await loadModule();
        const root = document.getElementById("root")!;

        await renderTable(root, "XSS", createMaliciousTableLike(), 9);

        const table = root.querySelector("table#datatable_9") as HTMLTableElement;
        expect(table).toBeTruthy();

        // Ensure potentially executable elements are not present.
        expect(table.querySelector("img")).toBeNull();
        expect(table.querySelector("a")).toBeNull();
    });

    it("initializes DataTable when jQuery+DataTables present, destroying prior instance", async () => {
        const calls: Array<{ selector: string; opts?: any; destroyed?: boolean }> = [];
        // Minimal jQuery/DataTable stub
        const state: Record<string, { initialized: boolean }> = {};
        function jQ(selector: any) {
            const key = typeof selector === "string" ? selector : "#datatable_3";
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
        // Fast-forward async ready + init
        vi.advanceTimersByTime(120);
        const selector = "#datatable_3";
        expect(calls.some((c) => c.selector === selector && c.opts)).toBe(true);

        // Simulate re-render that should destroy then init
        state[selector] = { initialized: true };
        await renderTable(root, "DT", createTableLike(), 3);
        vi.advanceTimersByTime(120);
        const destroyed = calls.filter((c) => c.selector === selector && c.destroyed).length;
        expect(destroyed).toBeGreaterThanOrEqual(1);
    });
});
