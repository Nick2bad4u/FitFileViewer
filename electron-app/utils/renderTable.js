import { copyTableAsCSV } from "./copyTableAsCSV.js";
/* global $ */
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
    const tableId = "datatable_" + index;
    const section = document.createElement("div");
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
    copyButton.onclick = (event) => {
        event.stopPropagation();
        copyTableAsCSV(table, title);
    };
    const icon = document.createElement("span");
    icon.textContent = "➕";
    rightContainer.appendChild(copyButton);
    rightContainer.appendChild(icon);
    header.appendChild(leftSpan);
    header.appendChild(rightContainer);
    header.onclick = () => {
        const content = document.getElementById(tableId + "_content");
        const currentDisplay = window.getComputedStyle(content).display;
        const isVisible = currentDisplay === "block";
        content.style.display = isVisible ? "none" : "block";
        icon.textContent = isVisible ? "➕" : "➖";
    };
    const content = document.createElement("div");
    content.classList.add("table-content");
    content.id = tableId + "_content";
    content.style.display = "none";
    const tableElement = document.createElement("table");
    tableElement.id = tableId;
    tableElement.classList.add("display");
    tableElement.innerHTML = table.toHTML({ limit: Infinity });
    content.appendChild(tableElement);
    section.appendChild(header);
    section.appendChild(content);
    container.appendChild(section);
    if (window.jQuery) {
        $(document).ready(function () {
            setTimeout(() => {
                try {
                    if ($.fn.DataTable) {
                        const tableSelector = "#" + tableId;
                        // Destroy existing DataTable instance if it exists
                        if ($.fn.DataTable.isDataTable(tableSelector)) {
                            console.log(`[DEBUG] Destroying existing DataTable for ${tableSelector}`);
                            $(tableSelector).DataTable().destroy();
                        }
                        console.log(`[DEBUG] Initializing DataTable for #${tableId}`);
                        $(tableSelector).DataTable({
                            paging: true,
                            lengthMenu: [
                                [10, 25, 50, 100, -1],
                                [10, 25, 50, 100, "All"],
                            ],
                            pageLength: 25,
                            searching: true,
                            ordering: true,
                            autoWidth: true,
                        });
                    } else {
                        console.error("[ERROR] DataTables.js is not loaded");
                    }
                } catch (e) {
                    console.error(`[ERROR] DataTable init failed for #${tableId}`, e);
                }
            }, 100);
        });
    } else {
        console.warn("[WARNING] jQuery is not available. Falling back to native DOM methods.");
        setTimeout(() => {
            const tableElement = document.getElementById(tableId);
            if (tableElement) {
                console.log(`[DEBUG] DataTable initialization skipped for #${tableId}`);
            } else {
                console.error(`[ERROR] Table element not found for #${tableId}`);
            }
        }, 100);
    }
}
