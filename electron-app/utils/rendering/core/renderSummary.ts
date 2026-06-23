import { addEventListenerWithCleanup } from "../../ui/events/eventListenerManager.js";
import {
    getGlobalStorageKey,
    getStorageKey,
    loadColPrefs,
    orderSummaryColumnsNamedFirst,
    renderTable,
} from "../helpers/renderSummaryHelpers.js";
import { getRenderSummaryRuntime } from "../helpers/renderSummaryRuntime.js";
import { showColModal } from "../helpers/summaryColModal.js";

type SummaryRow = Record<string, unknown>;

const renderSummaryRuntime = getRenderSummaryRuntime();

/** Activity data consumed by the summary renderer. */
export type SummaryRenderData = {
    lapMesgs?: readonly SummaryRow[];
    recordMesgs?: readonly SummaryRow[];
    sessionMesgs?: readonly SummaryRow[];
};

function createSettingsIcon(): SVGSVGElement {
    const icon = renderSummaryRuntime.createSvgElement("svg");
    icon.classList.add("summary-gear-btn__icon");
    icon.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    icon.setAttribute("width", "22");
    icon.setAttribute("height", "22");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "2");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("focusable", "false");

    const circle = renderSummaryRuntime.createSvgElement("circle");
    circle.setAttribute("cx", "12");
    circle.setAttribute("cy", "12");
    circle.setAttribute("r", "3");

    const path = renderSummaryRuntime.createSvgElement("path");
    path.setAttribute(
        "d",
        "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 16 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 8c.14.31.22.65.22 1v.09A1.65 1.65 0 0 0 21 12c0 .35-.08.69-.22 1z"
    );
    icon.append(circle, path);

    return icon;
}

/**
 * Renders a summary of activity data, including main summary and lap summary
 * tables, into the DOM element with id 'content_summary'. Provides "Copy as
 * CSV" buttons for both tables.
 *
 * The summary is generated from either `sessionMesgs` or `recordMesgs` in the
 * input data. If lap data is available (`lapMesgs`), lap rows are appended to
 * the same table.
 *
 * @param data - The activity data object.
 */
export function renderSummary(data: SummaryRenderData): void {
    const container = renderSummaryRuntime.getSummaryContainer();
    if (!container) {
        return;
    } // Guard: container missing
    container.replaceChildren();

    // Build superset of keys from session, lap, record messages for column selection.
    const keySet = new Set<string>();
    if (data && data.sessionMesgs) {
        for (const row of data.sessionMesgs) {
            for (const key of Object.keys(row)) {
                keySet.add(key);
            }
        }
    }
    if (data && data.lapMesgs) {
        for (const row of data.lapMesgs) {
            for (const key of Object.keys(row)) {
                keySet.add(key);
            }
        }
    }
    if (data && data.recordMesgs) {
        for (const row of data.recordMesgs) {
            for (const key of Object.keys(row)) {
                keySet.add(key);
            }
        }
    }
    const allKeys = [...keySet];
    const fileKey = getStorageKey(data, allKeys);
    const perFilePrefs = loadColPrefs(fileKey, allKeys);
    const globalPrefs = loadColPrefs(getGlobalStorageKey(), allKeys);
    // Always render named columns before numbered-only columns.
    const initialPrefs = perFilePrefs ?? globalPrefs ?? [...allKeys];
    // Preferences can come from a different activity, so they may include keys that do not exist
    // in the current file. Filter them out so we don't render empty/blank columns.
    const normalizedPrefs = orderSummaryColumnsNamedFirst(allKeys).filter((k) =>
        initialPrefs.includes(k)
    );
    let visibleColumns = normalizedPrefs;

    const gearBtn = renderSummaryRuntime.createElement("button");
    gearBtn.className = "summary-gear-btn";
    gearBtn.title = "Select columns";
    gearBtn.append(createSettingsIcon());
    addEventListenerWithCleanup(gearBtn, "click", (e) => {
        e.stopPropagation();
        showColModal({
            allKeys,
            data,
            renderTable: () =>
                renderTable({
                    container,
                    data,
                    gearBtn,
                    setVisibleColumns: (cols) => {
                        visibleColumns = cols;
                    },
                    visibleColumns,
                }),
            setVisibleColumns: (cols) => {
                visibleColumns = cols;
            },
            visibleColumns,
        });
    });

    renderTable({
        container,
        data,
        gearBtn,
        setVisibleColumns: (cols) => {
            visibleColumns = cols;
        },
        visibleColumns,
    });
}
