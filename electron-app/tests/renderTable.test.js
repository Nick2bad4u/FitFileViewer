import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderTable } from "../utils/renderTable";

describe("renderTable", () => {
    let container;
    let table;
    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
        table = { toHTML: vi.fn(() => "<tr><td>1</td></tr>") };
        window.copyTableAsCSV = vi.fn();
        window.jQuery = undefined;
    });
    afterEach(() => {
        document.body.removeChild(container);
        delete window.copyTableAsCSV;
        delete window.jQuery;
    });
    it("should render a table section with header and content", () => {
        renderTable(container, "Test Table", table, 0);
        expect(container.querySelector(".table-header")).not.toBeNull();
        expect(container.querySelector("table")).not.toBeNull();
        expect(container.querySelector(".table-content").style.display).toBe("none");
    });
    it("should toggle content display when header is clicked", () => {
        renderTable(container, "Test Table", table, 1);
        const header = container.querySelector(".table-header");
        const content = container.querySelector(".table-content");
        header.click();
        expect(content.style.display).toBe("block");
        header.click();
        expect(content.style.display).toBe("none");
    });
    it("should call copyTableAsCSV when copy button is clicked", () => {
        renderTable(container, "Test Table", table, 2);
        const btn = container.querySelector(".copy-btn");
        btn.click();
        expect(window.copyTableAsCSV).toHaveBeenCalledWith(table, "Test Table");
    });
});
