import { copyTableAsCSV } from "../../files/export/copyTableAsCSV.js";
import { getAppIconSvg } from "../../ui/icons/iconFactory.js";

/**
 * @typedef {Record<string, unknown>} TableRow
 *
 * @typedef {{ rows: TableRow[] }} RenderTableData
 */

/**
 * Renders a collapsible table section with a header, copy-to-CSV button, and
 * optional DataTables integration.
 *
 * IMPORTANT (CSP): This function does NOT rely on Arquero's
 * `toHTML()`/`objects()`. Those paths can use runtime Function generation and
 * are blocked by our CSP (no unsafe-eval).
 *
 * @param {HTMLElement} container - The DOM element to which the table section
 *   will be appended.
 * @param {string} title - The title to display in the table header.
 * @param {RenderTableData} table - Data wrapper containing table rows.
 * @param {number} index - A unique index used to generate element IDs for the
 *   table and its content.
 */
export function renderTable(container, title, table, index) {
    const rows =
        table && typeof table === "object" && Array.isArray(table.rows)
            ? table.rows
            : [];
    const normalized = normalizeRows(rows);
    const columns = getColumns(normalized);

    const section = document.createElement("div");
    const tableId = `datatable_${index}`;
    section.classList.add("table-section");

    const header = document.createElement("div");
    header.classList.add("table-header");

    const leftSpan = document.createElement("span");
    leftSpan.className = "table-header-title";
    decorateSectionHeaderTitle(leftSpan, title);

    const rightContainer = document.createElement("div");
    rightContainer.style.display = "flex";
    rightContainer.style.alignItems = "center";
    rightContainer.style.gap = "10px";

    const copyButton = document.createElement("button");
    copyButton.textContent = "Copy as CSV";
    copyButton.classList.add("copy-btn");
    copyButton.addEventListener("click", (event) => {
        event.stopPropagation();
        // Avoid unhandled promise rejections on clipboard failures.
        Promise.resolve(copyTableAsCSV(normalized)).catch((error) => {
            console.error("[renderTable] Failed to copy CSV:", error);
        });
    });

    const icon = document.createElement("span");
    icon.textContent = "➕";

    rightContainer.append(copyButton);
    rightContainer.append(icon);
    header.append(leftSpan);
    header.append(rightContainer);

    /** @type {ReturnType<typeof setTimeout> | null} */
    let dataTableInitTimer = null;

    const content = document.createElement("div");
    content.classList.add("table-content");
    content.id = `content_${tableId}`;
    content.style.display = "none";

    const tableElement = document.createElement("table");
    tableElement.id = tableId;
    tableElement.classList.add("display");

    // Build thead immediately (stable column order).
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    for (const col of columns) {
        const th = document.createElement("th");
        decorateTableHeaderCell(th, col);
        headRow.append(th);
    }
    thead.append(headRow);
    tableElement.append(thead);
    tableElement.append(document.createElement("tbody"));

    content.append(tableElement);

    /**
     * Initialize DataTables for the table (if jQuery + DataTables is
     * available).
     *
     * IMPORTANT: We only initialize when the section is expanded. DataTables
     * can compute incorrect widths when initialized under display:none.
     *
     * @returns {void}
     */
    const initializeDataTableIfAvailable = () => {
        const jQ = /** @type {any} */ (globalThis).jQuery;
        if (!jQ || !jQ.fn || !jQ.fn.DataTable) return;

        const tableSelector = `#${tableId}`;
        try {
            if (jQ.fn.DataTable.isDataTable(tableSelector)) {
                try {
                    jQ(tableSelector).DataTable().destroy();
                } catch {
                    /* ignore */
                }
            }

            const dt = jQ(tableSelector).DataTable({
                data: normalized,
                columns: columns.map((c) => ({
                    title: c,
                    data: c,
                    defaultContent: "",
                })),
                autoWidth: false,
                scrollX: true,
                scrollCollapse: true,
                deferRender: true,
                lengthMenu: [
                    [
                        10,
                        25,
                        50,
                        100,
                        -1,
                    ],
                    [
                        10,
                        25,
                        50,
                        100,
                        "All",
                    ],
                ],
                ordering: true,
                pageLength: 25,
                paging: true,
                searching: true,
            });

            const raf =
                /** @type {typeof requestAnimationFrame | undefined} */ (
                    globalThis.requestAnimationFrame
                );
            if (typeof raf === "function") {
                raf(() => {
                    try {
                        dt.columns.adjust();
                        decorateTableHeaderCells(tableElement, columns);
                    } catch {
                        /* ignore */
                    }
                });
            } else {
                try {
                    dt.columns.adjust();
                    decorateTableHeaderCells(tableElement, columns);
                } catch {
                    /* ignore */
                }
            }
        } catch (error) {
            console.error(
                `[ERROR] DataTable init failed for #${tableId}`,
                error
            );
        }
    };

    /**
     * Fallback renderer used when jQuery/DataTables is unavailable. Renders
     * only a limited number of rows to avoid freezing the UI.
     *
     * @returns {void}
     */
    const renderFallbackTableBody = () => {
        const tbody = tableElement.querySelector("tbody");
        if (!(tbody instanceof HTMLElement)) return;

        decorateTableHeaderCells(tableElement, columns);

        tbody.replaceChildren();
        const limit = 500;
        const slice = normalized.slice(0, limit);
        for (const row of slice) {
            const tr = document.createElement("tr");
            for (const col of columns) {
                const td = document.createElement("td");
                td.textContent = String(row[col] ?? "");
                tr.append(td);
            }
            tbody.append(tr);
        }
    };

    /**
     * Schedule initialization on the next tick after the content becomes
     * visible.
     *
     * @returns {void}
     */
    const scheduleDataTableInit = () => {
        const jQ = /** @type {any} */ (globalThis).jQuery;
        if (!jQ || !jQ.fn || !jQ.fn.DataTable) return;
        if (dataTableInitTimer) return;

        dataTableInitTimer = setTimeout(() => {
            dataTableInitTimer = null;

            const host = document.getElementById(`content_${tableId}`);
            const isDisplayed =
                host instanceof HTMLElement &&
                typeof globalThis.getComputedStyle === "function" &&
                globalThis.getComputedStyle(host).display !== "none";

            if (!isDisplayed) {
                dataTableInitTimer = setTimeout(() => {
                    dataTableInitTimer = null;
                    initializeDataTableIfAvailable();
                }, 50);
                return;
            }

            initializeDataTableIfAvailable();
        }, 25);
    };

    header.addEventListener("click", () => {
        const isHidden =
            globalThis.getComputedStyle(content).display === "none";
        content.style.display = isHidden ? "block" : "none";
        icon.textContent = isHidden ? "➖" : "➕";

        if (isHidden) {
            const jQ = /** @type {any} */ (globalThis).jQuery;
            if (jQ && jQ.fn && jQ.fn.DataTable) {
                scheduleDataTableInit();
            } else {
                renderFallbackTableBody();
            }
        }
    });

    section.append(header);
    section.append(content);
    container.append(section);
}

/**
 * @param {HTMLElement} container
 * @param {import("../../ui/icons/iconFactory.js").AppIconName} iconName
 * @param {string} text
 * @param {string} iconClass
 * @param {string} textClass
 */
function applyIconLabel(container, iconName, text, iconClass, textClass) {
    const icon = document.createElement("span");
    icon.className = iconClass;
    icon.innerHTML = getAppIconSvg(iconName, {
        className: `${iconClass}-svg`,
        size: 13,
        strokeWidth: 2,
    });

    const label = document.createElement("span");
    label.className = textClass;
    label.textContent = text;

    container.replaceChildren(icon, label);
}

/**
 * @param {HTMLElement} container
 * @param {string} title
 */
function decorateSectionHeaderTitle(container, title) {
    const icon = document.createElement("i");
    icon.className = "table-header-title__icon";
    icon.innerHTML = getAppIconSvg(resolveTableSectionIconName(title), {
        className: "table-header-title__icon-svg",
        size: 13,
        strokeWidth: 2,
    });

    const label = document.createElement("strong");
    label.className = "table-header-title__text";
    label.textContent = title;

    container.replaceChildren(icon, label);
}

/**
 * @param {HTMLTableElement} tableElement
 * @param {string[]} columns
 */
function decorateTableHeaderCells(tableElement, columns) {
    const headerCells = tableElement.querySelectorAll("thead th");
    for (const [index, cell] of headerCells.entries()) {
        if (!(cell instanceof HTMLTableCellElement)) {
            continue;
        }
        decorateTableHeaderCell(cell, columns[index] ?? cell.textContent ?? "");
    }
}

/**
 * @param {HTMLTableCellElement} cell
 * @param {string} label
 */
function decorateTableHeaderCell(cell, label) {
    applyIconLabel(
        cell,
        resolveTableColumnIconName(label),
        label,
        "table-column-title__icon",
        "table-column-title__text"
    );
}

/**
 * @param {string} title
 *
 * @returns {import("../../ui/icons/iconFactory.js").AppIconName}
 */
function resolveTableSectionIconName(title) {
    const normalized = title.toLowerCase();
    if (normalized.includes("session")) return "activity";
    if (normalized.includes("lap")) return "route";
    if (normalized.includes("record")) return "table";
    if (normalized.includes("event")) return "target";
    if (normalized.includes("device")) return "database";
    return "database";
}

/**
 * @param {string} label
 *
 * @returns {import("../../ui/icons/iconFactory.js").AppIconName}
 */
function resolveTableColumnIconName(label) {
    const normalized = label.toLowerCase();
    if (/timestamp|time|date/u.test(normalized)) return "timer";
    if (/lat|lon|position|location|coord|gps/u.test(normalized)) return "map";
    if (/distance|dist|length|altitude|elevation|grade/u.test(normalized))
        return "ruler";
    if (/speed|pace|velocity/u.test(normalized)) return "gauge";
    if (/cadence|rpm|stroke|turn/u.test(normalized)) return "activity";
    if (/heart|hr|pulse/u.test(normalized)) return "activity";
    if (/power|watt|calorie|energy/u.test(normalized)) return "activity";
    if (/lap|segment|route/u.test(normalized)) return "route";
    if (/id|index|num|count/u.test(normalized)) return "hash";
    return "table";
}

/**
 * Compute stable column order.
 *
 * @param {TableRow[]} rows
 *
 * @returns {string[]}
 */
function getColumns(rows) {
    /** @type {string[]} */
    const namedCols = [];
    /** @type {string[]} */
    const numberedCols = [];
    /** @type {Set<string>} */
    const seen = new Set();

    /**
     * @param {string} key
     *
     * @returns {boolean}
     */
    const isNumberedKey = (key) => /^\d+$/u.test(key);

    /**
     * @param {string} key
     */
    const pushKey = (key) => {
        if (seen.has(key)) {
            return;
        }
        seen.add(key);
        if (isNumberedKey(key)) {
            numberedCols.push(key);
        } else {
            namedCols.push(key);
        }
    };

    const first = rows.length > 0 ? rows[0] : null;
    if (first) {
        for (const k of Object.keys(first)) {
            pushKey(k);
        }
    }

    for (const row of rows) {
        for (const k of Object.keys(row)) {
            pushKey(k);
        }
    }

    return namedCols.concat(numberedCols);
}

/**
 * Convert non-primitive cell values to strings so DataTables renders them
 * sensibly.
 *
 * @param {unknown} value
 *
 * @returns {string | number | boolean}
 */
function normalizeCellValue(value) {
    if (value === null || value === undefined) {
        return "";
    }
    if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        return value;
    }
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

/**
 * @param {TableRow[]} rows
 *
 * @returns {TableRow[]}
 */
function normalizeRows(rows) {
    return rows.map((row) => {
        /** @type {TableRow} */
        const out = {};
        for (const [k, v] of Object.entries(row)) {
            out[k] = normalizeCellValue(v);
        }
        return out;
    });
}
