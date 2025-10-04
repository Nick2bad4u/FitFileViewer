import { copyTableAsCSV } from "../../files/export/copyTableAsCSV.js";
import { createDensityToggle, getDensityPreference } from "../../ui/controls/createDensityToggle.js";
import {
    createIconElement,
    getDataTableIcon,
    getHumanizedLabel,
} from "../../ui/icons/iconMappings.js";
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

    // Apply saved density preference to section
    const densityPref = getDensityPreference("rawDataTableDensity", "spacious");
    section.classList.add(`density-${densityPref}`);
    const header = document.createElement("div");
    header.classList.add("table-header");
    header.setAttribute("role", "button");
    header.setAttribute("tabindex", "0");
    header.setAttribute("aria-expanded", "false");
    const headerTitle = document.createElement("div");
    headerTitle.classList.add("table-header-title");
    const headerIcon = createIconElement(getDataTableIcon(title), 20);
    headerIcon.classList.add("table-header-icon");
    const headerLabel = document.createElement("span");
    headerLabel.classList.add("table-header-label");
    headerLabel.textContent = getHumanizedLabel(title);
    headerTitle.append(headerIcon);
    headerTitle.append(headerLabel);
    const rightContainer = document.createElement("div");
    rightContainer.classList.add("table-header-actions");

    // Add density toggle (only on first table to avoid duplicates)
    if (index === 0) {
        const densityToggle = createDensityToggle({
            onChange: (density) => {
                // Apply to all table sections in this container
                const sections = container.querySelectorAll(".table-section");
                for (const sec of sections) {
                    sec.classList.remove("density-spacious", "density-dense");
                    sec.classList.add(`density-${density}`);
                }
            },
            showLabel: true,
            storageKey: "rawDataTableDensity",
        });
        rightContainer.append(densityToggle);
    }

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.classList.add("copy-btn", "table-copy-btn");
    copyButton.innerHTML =
        '<iconify-icon icon="mdi:content-copy" width="16" height="16" aria-hidden="true"></iconify-icon><span>Copy CSV</span>';
    copyButton.addEventListener("click", (event) => {
        event.stopPropagation();
        copyTableAsCSV(/** @type {any} */(table));
    });
    const toggleIcon = document.createElement("iconify-icon");
    toggleIcon.setAttribute("aria-hidden", "true");
    toggleIcon.setAttribute("width", "20");
    toggleIcon.setAttribute("height", "20");
    toggleIcon.setAttribute("icon", "mdi:chevron-right");
    toggleIcon.classList.add("table-toggle-icon");
    rightContainer.append(copyButton);
    rightContainer.append(toggleIcon);
    header.append(headerTitle);
    header.append(rightContainer);
    const toggleSection = () => {
        const content = document.getElementById(`${tableId}_content`),
            currentDisplay = globalThis.getComputedStyle(/** @type {Element} */(content)).display,
            isVisible = currentDisplay === "block";
        if (content) {
            content.style.display = isVisible ? "none" : "block";
        }
        toggleIcon.setAttribute("icon", isVisible ? "mdi:chevron-right" : "mdi:chevron-down");
        header.setAttribute("aria-expanded", String(!isVisible));
    };
    header.addEventListener("click", toggleSection);
    header.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleSection();
        }
    });
    const content = document.createElement("div");
    content.classList.add("table-content");
    content.id = `${tableId}_content`;
    header.setAttribute("aria-controls", content.id);
    content.style.display = "none";
    const tableElement = document.createElement("table");
    tableElement.id = tableId;
    tableElement.classList.add("display");
    tableElement.innerHTML = /** @type {any} */ (table).toHTML({ limit: Infinity });
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
