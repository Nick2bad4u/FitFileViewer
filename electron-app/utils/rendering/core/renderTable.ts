import { copyTableAsCSV } from "../../files/export/copyTableAsCSV.js";
import { getRegisteredDataTableRuntime } from "./dataTableRuntime.js";
import {
    type AppIconName,
    createAppIconElement,
} from "../../ui/icons/iconFactory.js";
import { addEventListenerWithCleanup } from "../../ui/events/eventListenerManager.js";
import {
    getRenderTableRuntime,
    type RenderTableTimerHandle,
} from "./renderTableRuntime.js";

/** Row shape accepted by the raw-data table renderer. */
export type RenderTableRow = Record<string, unknown>;

/** Data wrapper consumed by the raw-data table renderer. */
export type RenderTableData = {
    rows: RenderTableRow[];
};

type NormalizedCellValue = boolean | number | string;

type NormalizedTableRow = Record<string, NormalizedCellValue>;

/**
 * Renders a collapsible raw-data table section.
 *
 * The implementation avoids Arquero HTML output because those paths can use
 * runtime Function generation, which is blocked by the app CSP.
 *
 * @param container - DOM element that receives the table section.
 * @param title - Title displayed in the table header.
 * @param table - Data wrapper containing raw table rows.
 * @param index - Stable index used for generated element IDs.
 */
export function renderTable(
    container: HTMLElement,
    title: string,
    table: RenderTableData,
    index: number
): void {
    const rows = Array.isArray(table.rows) ? table.rows : [];
    const normalized = normalizeRows(rows);
    const columns = getColumns(normalized);
    const runtime = getRenderTableRuntime();

    const section = runtime.createElement("div");
    const tableId = `datatable_${index}`;
    section.classList.add("table-section");

    const header = runtime.createElement("div");
    header.classList.add("table-header");

    const leftSpan = runtime.createElement("span");
    leftSpan.className = "table-header-title";
    decorateSectionHeaderTitle(leftSpan, title, runtime);

    const rightContainer = runtime.createElement("div");
    rightContainer.style.display = "flex";
    rightContainer.style.alignItems = "center";
    rightContainer.style.gap = "10px";

    const copyButton = runtime.createElement("button");
    copyButton.textContent = "Copy as CSV";
    copyButton.classList.add("copy-btn");
    addEventListenerWithCleanup(copyButton, "click", (event) => {
        event.stopPropagation();
        Promise.resolve(copyTableAsCSV(normalized)).catch((error: unknown) => {
            console.error("[renderTable] Failed to copy CSV:", error);
        });
    });

    const icon = runtime.createElement("span");
    icon.textContent = "➕";

    rightContainer.append(copyButton);
    rightContainer.append(icon);
    header.append(leftSpan);
    header.append(rightContainer);

    let dataTableInitTimer: null | RenderTableTimerHandle = null;

    const content = runtime.createElement("div");
    content.classList.add("table-content");
    content.id = `content_${tableId}`;
    content.style.display = "none";

    const tableElement = runtime.createElement("table");
    tableElement.id = tableId;
    tableElement.classList.add("display");

    const thead = runtime.createElement("thead");
    const headRow = runtime.createElement("tr");
    for (const column of columns) {
        const th = runtime.createElement("th");
        decorateTableHeaderCell(th, column, runtime);
        headRow.append(th);
    }
    thead.append(headRow);
    tableElement.append(thead);
    tableElement.append(runtime.createElement("tbody"));

    content.append(tableElement);

    const initializeDataTableIfAvailable = (): void => {
        const tableSelector = `#${tableId}`;
        try {
            const DataTableCtor = getRegisteredDataTableRuntime();
            if (!DataTableCtor) {
                return;
            }

            if (DataTableCtor.isDataTable(tableSelector)) {
                try {
                    new DataTableCtor(tableSelector).destroy();
                } catch {
                    /* ignore */
                }
            }

            const dt = new DataTableCtor(tableSelector, {
                autoWidth: false,
                columns: columns.map((column) => ({
                    data: column,
                    defaultContent: "",
                    title: column,
                })),
                data: normalized,
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
                scrollCollapse: true,
                scrollX: true,
                searching: true,
            });

            const animationFrameHandle = runtime.requestAnimationFrame(() => {
                try {
                    dt.columns.adjust();
                    decorateTableHeaderCells(tableElement, columns, runtime);
                } catch {
                    /* ignore */
                }
            });
            if (animationFrameHandle === undefined) {
                try {
                    dt.columns.adjust();
                    decorateTableHeaderCells(tableElement, columns, runtime);
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

    const renderFallbackTableBody = (): void => {
        const tbody = tableElement.querySelector("tbody");
        if (!runtime.isHTMLElement(tbody)) {
            return;
        }

        decorateTableHeaderCells(tableElement, columns, runtime);

        tbody.replaceChildren();
        const limit = 500;
        const slice = normalized.slice(0, limit);
        for (const row of slice) {
            const tr = runtime.createElement("tr");
            for (const column of columns) {
                const td = runtime.createElement("td");
                td.textContent = String(row[column] ?? "");
                tr.append(td);
            }
            tbody.append(tr);
        }
    };

    const scheduleDataTableInit = (): void => {
        if (dataTableInitTimer !== null) {
            return;
        }

        dataTableInitTimer = runtime.setTimeout(() => {
            dataTableInitTimer = null;

            const host = runtime.getElementById(`content_${tableId}`);
            const isDisplayed =
                host !== null &&
                runtime.getComputedStyle(host)?.display !== "none";

            if (!isDisplayed) {
                dataTableInitTimer = runtime.setTimeout(() => {
                    dataTableInitTimer = null;
                    initializeDataTableIfAvailable();
                }, 50);
                return;
            }

            initializeDataTableIfAvailable();
        }, 25);
    };

    addEventListenerWithCleanup(header, "click", () => {
        const isHidden = runtime.getComputedStyle(content)?.display === "none";
        content.style.display = isHidden ? "block" : "none";
        icon.textContent = isHidden ? "➖" : "➕";

        if (isHidden) {
            renderFallbackTableBody();
            scheduleDataTableInit();
        }
    });

    section.append(header);
    section.append(content);
    container.append(section);
}

function applyIconLabel(
    container: HTMLElement,
    iconName: AppIconName,
    text: string,
    iconClass: string,
    textClass: string,
    runtime = getRenderTableRuntime()
): void {
    const icon = runtime.createElement("span");
    icon.className = iconClass;
    icon.append(
        createAppIconElement(iconName, {
            className: `${iconClass}-svg`,
            size: 13,
            strokeWidth: 2,
        })
    );

    const label = runtime.createElement("span");
    label.className = textClass;
    label.textContent = text;

    container.replaceChildren(icon, label);
}

function decorateSectionHeaderTitle(
    container: HTMLElement,
    title: string,
    runtime = getRenderTableRuntime()
): void {
    const icon = runtime.createElement("i");
    icon.className = "table-header-title__icon";
    icon.append(
        createAppIconElement(resolveTableSectionIconName(title), {
            className: "table-header-title__icon-svg",
            size: 13,
            strokeWidth: 2,
        })
    );

    const label = runtime.createElement("strong");
    label.className = "table-header-title__text";
    label.textContent = title;

    container.replaceChildren(icon, label);
}

function decorateTableHeaderCells(
    tableElement: HTMLTableElement,
    columns: readonly string[],
    runtime = getRenderTableRuntime()
): void {
    const headerCells = tableElement.querySelectorAll("thead th");
    for (const [index, cell] of headerCells.entries()) {
        if (!runtime.isTableCellElement(cell)) {
            continue;
        }
        decorateTableHeaderCell(
            cell,
            columns[index] ?? cell.textContent ?? "",
            runtime
        );
    }
}

function decorateTableHeaderCell(
    cell: HTMLTableCellElement,
    label: string,
    runtime = getRenderTableRuntime()
): void {
    applyIconLabel(
        cell,
        resolveTableColumnIconName(label),
        label,
        "table-column-title__icon",
        "table-column-title__text",
        runtime
    );
}

function resolveTableSectionIconName(title: string): AppIconName {
    const normalized = title.toLowerCase();
    if (normalized.includes("session")) {
        return "activity";
    }
    if (normalized.includes("lap")) {
        return "route";
    }
    if (normalized.includes("record")) {
        return "table";
    }
    if (normalized.includes("event")) {
        return "target";
    }
    if (normalized.includes("device")) {
        return "database";
    }
    return "database";
}

function resolveTableColumnIconName(label: string): AppIconName {
    const normalized = label.toLowerCase();
    if (/timestamp|time|date/u.test(normalized)) {
        return "timer";
    }
    if (/coord|gps|lat|location|lon|position/u.test(normalized)) {
        return "map";
    }
    if (/distance|dist|length|altitude|elevation|grade/u.test(normalized)) {
        return "ruler";
    }
    if (/pace|speed|velocity/u.test(normalized)) {
        return "gauge";
    }
    if (/cadence|rpm|stroke|turn/u.test(normalized)) {
        return "activity";
    }
    if (/heart|hr|pulse/u.test(normalized)) {
        return "activity";
    }
    if (/calorie|energy|power|watt/u.test(normalized)) {
        return "activity";
    }
    if (/lap|route|segment/u.test(normalized)) {
        return "route";
    }
    if (/count|id|index|num/u.test(normalized)) {
        return "hash";
    }
    return "table";
}

function getColumns(rows: readonly NormalizedTableRow[]): string[] {
    const namedCols: string[] = [];
    const numberedCols: string[] = [];
    const seen = new Set<string>();

    const isNumberedKey = (key: string): boolean => /^\d+$/u.test(key);

    const pushKey = (key: string): void => {
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

    const [first] = rows;
    if (first) {
        for (const key of Object.keys(first)) {
            pushKey(key);
        }
    }

    for (const row of rows) {
        for (const key of Object.keys(row)) {
            pushKey(key);
        }
    }

    return namedCols.concat(numberedCols);
}

function normalizeCellValue(value: unknown): NormalizedCellValue {
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

function normalizeRows(rows: readonly RenderTableRow[]): NormalizedTableRow[] {
    return rows.map((row) => {
        const out: NormalizedTableRow = {};
        for (const [key, value] of Object.entries(row)) {
            out[key] = normalizeCellValue(value);
        }
        return out;
    });
}
