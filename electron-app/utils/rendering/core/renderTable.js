import { sanitizeHtmlAllowlist } from "../../dom/index.js";
import { copyTableAsCSV } from "../../files/export/copyTableAsCSV.js";

/**
 * Renders a collapsible table section with a header, copy-to-CSV button, and optional DataTables integration.
 *
 * @param {HTMLElement} container - The DOM element to which the table section will be appended.
 * @param {string} title - The title to display in the table header.
 * @param {Object} table - The table object with a `toHTML({ limit })` method for rendering HTML.
 * @param {number} index - A unique index used to generate element IDs for the table and its content.
 *
 * @example
 * renderTable(document.body, 'My Table', myTableObject, 0);
 */
export function renderTable(container, title, table, index) {
    const section = document.createElement("div"),
        tableId = `datatable_${index}`;
    section.classList.add("table-section");
    const header = document.createElement("div");
    header.classList.add("table-header");
    const leftSpan = document.createElement("span");
    leftSpan.textContent = title;
    const rightContainer = document.createElement("div");
    rightContainer.style.display = "flex";
    rightContainer.style.alignItems = "center";
    rightContainer.style.gap = "10px";
    const copyButton = document.createElement("button");
    copyButton.textContent = "Copy as CSV";
    copyButton.classList.add("copy-btn");
    copyButton.addEventListener("click", (event) => {
        event.stopPropagation();
        copyTableAsCSV(/** @type {any} */ (table));
    });
    const icon = document.createElement("span");
    icon.textContent = "➕";
    rightContainer.append(copyButton);
    rightContainer.append(icon);
    header.append(leftSpan);
    header.append(rightContainer);
    header.addEventListener("click", () => {
        const content = document.getElementById(`${tableId}_content`),
            currentDisplay = globalThis.getComputedStyle(/** @type {Element} */ (content)).display,
            isVisible = currentDisplay === "block";
        if (content) {
            content.style.display = isVisible ? "none" : "block";
        }
        icon.textContent = isVisible ? "➕" : "➖";
    });
    const content = document.createElement("div");
    content.classList.add("table-content");
    content.id = `${tableId}_content`;
    content.style.display = "none";
    const tableElement = document.createElement("table");
    tableElement.id = tableId;
    tableElement.classList.add("display");

    // Security: do not inject Arquero's HTML directly.
    // Sanitize to avoid markup/event handler injection from untrusted FIT data.
    const rawTableHtml = String(/** @type {any} */ (table).toHTML({ limit: Infinity }));

    // Arquero may return either:
    // - <thead>...</thead><tbody>...</tbody>
    // - <table>...</table>
    // We create the outer table ourselves, so unwrap if a <table> wrapper exists.
    const unwrapTemplate = document.createElement("template");
    unwrapTemplate.innerHTML = rawTableHtml;
    const wrapperTable = unwrapTemplate.content.querySelector("table");
    const htmlToSanitize = wrapperTable ? wrapperTable.innerHTML : rawTableHtml;

    const safeFragment = sanitizeHtmlAllowlist(htmlToSanitize, {
        allowedAttributes: [
            // Presentation
            "class",
            "id",
            "style",

            // Structural
            "colspan",
            "rowspan",
            "scope",
        ],
        allowedTags: ["CAPTION", "COL", "COLGROUP", "TBODY", "TD", "TFOOT", "TH", "THEAD", "TR"],
        stripUrlInStyle: true,
    });
    tableElement.replaceChildren(safeFragment);
    content.append(tableElement);
    section.append(header);
    section.append(content);
    container.append(section);
    if (/** @type {any} */ (globalThis).jQuery) {
        const jQ = /** @type {any} */ (globalThis).jQuery;
        jQ(document).ready(() => {
            setTimeout(() => {
                try {
                    if (jQ.fn.DataTable) {
                        const tableSelector = `#${tableId}`;
                        // Destroy existing DataTable instance if it exists
                        if (jQ.fn.DataTable.isDataTable(tableSelector)) {
                            console.log(`[DEBUG] Destroying existing DataTable for ${tableSelector}`);
                            jQ(tableSelector).DataTable().destroy();
                        }
                        console.log(`[DEBUG] Initializing DataTable for #${tableId}`);
                        jQ(tableSelector).DataTable({
                            autoWidth: true,
                            lengthMenu: [
                                [10, 25, 50, 100, -1],
                                [10, 25, 50, 100, "All"],
                            ],
                            ordering: true,
                            pageLength: 25,
                            paging: true,
                            searching: true,
                        });
                    } else {
                        console.error("[ERROR] DataTables.js is not loaded");
                    }
                } catch (error) {
                    console.error(`[ERROR] DataTable init failed for #${tableId}`, error);
                }
            }, 100);
        });
    } else {
        console.warn("[WARNING] jQuery is not available. Falling back to native DOM methods.");
        setTimeout(() => {
            const tblElem = document.getElementById(tableId);
            if (tblElem) {
                console.log(`[DEBUG] DataTable initialization skipped for #${tableId}`);
            } else {
                console.error(`[ERROR] Table element not found for #${tableId}`);
            }
        }, 100);
    }
}
