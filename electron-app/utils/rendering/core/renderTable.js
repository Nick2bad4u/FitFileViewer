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

    /** @type {ReturnType<typeof setTimeout> | null} */
    let dataTableInitTimer = null;

    /**
     * Initialize DataTables for the table (if jQuery + DataTables is available).
     *
     * IMPORTANT: We only initialize when the section is expanded.
     * DataTables can compute incorrect widths when initialized under display:none,
     * and initializing every table up-front is expensive.
     *
     * @returns {void}
     */
    const initializeDataTableIfAvailable = () => {
        const jQ = /** @type {any} */ (globalThis).jQuery;
        if (!jQ || !jQ.fn || !jQ.fn.DataTable) return;

        const tableSelector = `#${tableId}`;
        try {
            // Destroy existing DataTable instance if it exists (keeps legacy behavior).
            if (jQ.fn.DataTable.isDataTable(tableSelector)) {
                try {
                    jQ(tableSelector).DataTable().destroy();
                } catch {
                    /* ignore */
                }
            }

            const dt = jQ(tableSelector).DataTable({
                // Raw tables can have dozens/hundreds of columns. Disable auto width calculation and
                // enable horizontal scrolling for reliable layout in Electron.
                autoWidth: false,
                scrollX: true,
                scrollCollapse: true,
                deferRender: true,
                lengthMenu: [
                    [10, 25, 50, 100, -1],
                    [10, 25, 50, 100, "All"],
                ],
                ordering: true,
                pageLength: 25,
                paging: true,
                searching: true,
            });

            // DataTables can still miscompute widths if initialization occurs close to a visibility
            // toggle. Force a post-layout adjust to avoid collapsed columns that visually look like
            // "everything in one cell".
            const raf = /** @type {typeof requestAnimationFrame | undefined} */ (globalThis.requestAnimationFrame);
            if (typeof raf === "function") {
                raf(() => {
                    try {
                        dt.columns.adjust();
                    } catch {
                        /* ignore */
                    }
                });
            } else {
                try {
                    dt.columns.adjust();
                } catch {
                    /* ignore */
                }
            }
        } catch (error) {
            console.error(`[ERROR] DataTable init failed for #${tableId}`, error);
        }
    };

    /**
     * Schedule initialization on the next tick after the content becomes visible.
     * @returns {void}
     */
    const scheduleDataTableInit = () => {
        const jQ = /** @type {any} */ (globalThis).jQuery;
        if (!jQ || !jQ.fn || !jQ.fn.DataTable) return;
        if (dataTableInitTimer) return;

        // Delay long enough for the layout engine to apply `display:block` and compute widths.
        // setTimeout(0) is sometimes too early in Electron/Chromium when toggling a large DOM subtree.
        dataTableInitTimer = setTimeout(() => {
            dataTableInitTimer = null;

            const host = document.getElementById(`content_${tableId}`);
            const isDisplayed =
                host instanceof HTMLElement &&
                typeof globalThis.getComputedStyle === "function" &&
                globalThis.getComputedStyle(host).display !== "none";

            // If still hidden, retry once; otherwise initialize now.
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

    const content = document.createElement("div");
    content.classList.add("table-content");
    content.id = `content_${tableId}`;
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

    header.addEventListener("click", () => {
        const isHidden = globalThis.getComputedStyle(content).display === "none";
        content.style.display = isHidden ? "block" : "none";
        icon.textContent = isHidden ? "➖" : "➕";

        if (isHidden) {
            scheduleDataTableInit();
        }
    });
    section.append(header);
    section.append(content);
    container.append(section);
}
