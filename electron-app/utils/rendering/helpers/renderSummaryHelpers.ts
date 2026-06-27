import { hasPowerData } from "../../data/processing/estimateCyclingPower.js";
import { patchSummaryFields } from "../../data/processing/patchSummaryFields.js";
import { exportUtils } from "../../files/export/exportUtils.js";
import { getActiveFitFileMetadata } from "../../state/domain/activeFitFileMetadataState.js";
import { resolveArqueroRuntime } from "./arqueroRuntime.js";
import {
    getRenderSummaryRuntime,
    type RenderSummaryRuntime,
} from "./renderSummaryRuntime.js";

/** Generic row shape used by summary and lap table renderers. */
export type SummaryRecord = Record<string, unknown>;

/** Activity data shape consumed by the summary helper renderer. */
export type FitSummaryData = {
    cachedFilePath?: string;
    lapMesgs?: readonly SummaryRecord[];
    recordMesgs?: readonly SummaryRecord[];
    sessionMesgs?: readonly SummaryRecord[];
};

type SummaryStats = SummaryRecord & {
    avg_speed?: number;
    duration?: number;
    end_time?: unknown;
    max_altitude_ft?: number;
    max_speed?: number;
    min_altitude_ft?: number;
    start_time?: unknown;
    total_distance?: unknown;
    total_records?: number;
};

type SummaryContainer = HTMLElement & {
    _summaryFilterValue?: string | undefined;
    _summaryVirtualCleanup?: (() => void) | undefined;
};

function isDateInput(value: unknown): value is Date | number | string {
    return (
        value instanceof Date ||
        typeof value === "number" ||
        typeof value === "string"
    );
}

function toCellText(value: unknown): string {
    return value === null || value === undefined ? "" : String(value);
}

/** Synthetic summary table column key used for row labels. */
export const LABEL_COL = "__row_label__";

const SUMMARY_VIRTUAL_ROW_THRESHOLD = 200;
const SUMMARY_VIRTUAL_ROW_HEIGHT_FALLBACK = 34;
const SUMMARY_VIRTUAL_OVERSCAN = 8;

function renderSummaryRuntime(): RenderSummaryRuntime {
    return getRenderSummaryRuntime();
}

/**
 * Determines whether a Summary column key is numeric-only, such as "0" or "1".
 *
 * This classifies by key name, not by the value type.
 */
export function isNumberedSummaryColumnKey(key: string): boolean {
    return /^\d+$/u.test(key);
}

/**
 * Orders named columns before numbered-only columns while keeping relative
 * order stable.
 */
export function orderSummaryColumnsNamedFirst(
    keys: readonly string[]
): string[] {
    const named: string[] = [];
    const numbered: string[] = [];

    for (const k of keys) {
        (isNumberedSummaryColumnKey(k) ? numbered : named).push(k);
    }

    return [...named, ...numbered];
}

/**
 * Global default key for summary column preferences.
 *
 * If a per-file key has no saved preferences, we fall back to this key. This
 * enables a "remember my columns" experience across all files.
 */
export const SUMMARY_COL_GLOBAL_DEFAULT_KEY = "summaryColSel_global_default";

/** Returns the global summary-column preference storage key. */
export function getGlobalStorageKey(): string {
    return SUMMARY_COL_GLOBAL_DEFAULT_KEY;
}

/** Returns the label for a summary or lap row. */
export function getRowLabel(rowIdx: number, isLap: boolean): string {
    return isLap ? `Lap ${rowIdx + 1}` : "Summary";
}

/**
 * Builds a stable storage key for column visibility preferences.
 *
 * The optional all-keys argument is retained for older callers.
 */
export function getStorageKey(
    data: FitSummaryData | SummaryRecord | null | undefined,
    _allKeys?: readonly string[]
): string {
    let fpath: null | string = null;
    try {
        fpath = getActiveFitFileMetadata({
            sourceData: data && typeof data === "object" ? data : null,
        }).storageIdentity;
    } catch {
        // Ignore
    }
    if (fpath) {
        return `summaryColSel_${encodeURIComponent(String(fpath))}`;
    }
    return "summaryColSel_default";
}

/**
 * Loads persisted visible column preferences.
 *
 * The optional all-keys argument is retained for older callers.
 */
export function loadColPrefs(
    key: string,
    _allKeys?: readonly string[]
): string[] | null {
    try {
        const v = renderSummaryRuntime().getStorageItem(key);
        if (v) {
            const arr = JSON.parse(v);
            if (Array.isArray(arr) && arr.every((x) => typeof x === "string")) {
                return arr;
            }
        }
    } catch {
        /* Intentionally ignore errors */
    }
    return null;
}

/** Renders the summary and lap table into the provided container. */
export function renderTable({
    container,
    data,
    gearBtn,
    setVisibleColumns,
    visibleColumns,
}: {
    container: HTMLElement;
    data: FitSummaryData;
    gearBtn: HTMLElement;
    setVisibleColumns: (cols: string[]) => void;
    visibleColumns: string[];
}): void {
    const summaryContainer = container as SummaryContainer;

    // Clean up any prior virtual scroll listeners from earlier renders.
    const cleanupVirtualizer = summaryContainer._summaryVirtualCleanup;
    if (typeof cleanupVirtualizer === "function") {
        cleanupVirtualizer();
        summaryContainer._summaryVirtualCleanup = undefined;
    }
    const renderController = renderSummaryRuntime().createAbortController();
    let virtualizerCleanup: (() => void) | undefined;
    summaryContainer._summaryVirtualCleanup = () => {
        renderController.abort();
        virtualizerCleanup?.();
    };

    let section = container.querySelector(".summary-section");
    if (!section) {
        section = renderSummaryRuntime().createElement("div");
        section.classList.add("summary-section");
        container.append(section);
    }
    section.replaceChildren();
    // Filter bar with gear button and filter dropdown side by side
    const filterBar = renderSummaryRuntime().createElement("div");
    filterBar.className = "summary-filter-bar";
    // Gear button (column selector)
    filterBar.append(gearBtn);
    // Filter dropdown
    const filterLabel = renderSummaryRuntime().createElement("label");
    filterLabel.textContent = "Show: ";
    const filterSelect = renderSummaryRuntime().createElement("select");

    const addOption = (value: string, label: string): void => {
        const opt = renderSummaryRuntime().createElement("option");
        opt.value = value;
        opt.textContent = label;
        filterSelect.append(opt);
    };

    addOption("All", "All");
    addOption("Summary", "Summary");

    if (data.lapMesgs && data.lapMesgs.length > 0) {
        for (let i = 0; i < data.lapMesgs.length; ++i) {
            const lapIndex = i + 1;
            addOption(`Lap ${lapIndex}`, `Lap ${lapIndex}`);
        }
    }
    const filterValue = summaryContainer._summaryFilterValue ?? "All";
    filterSelect.value = filterValue;
    filterSelect.addEventListener(
        "change",
        () => {
            summaryContainer._summaryFilterValue = filterSelect.value;
            renderTable({
                container,
                data,
                gearBtn,
                setVisibleColumns,
                visibleColumns,
            });
        },
        { signal: renderController.signal }
    );
    // Add scroll wheel support for changing selection
    filterSelect.addEventListener(
        "wheel",
        (e) => {
            e.preventDefault();
            const options = [...filterSelect.options];
            let idx = options.findIndex(
                (opt) => opt.value === filterSelect.value
            );
            if (e.deltaY > 0 && idx < options.length - 1) {
                idx++;
            } else if (e.deltaY < 0 && idx > 0) {
                idx--;
            }
            const opt = options[idx];
            if (opt) {
                filterSelect.value = opt.value;
                summaryContainer._summaryFilterValue = filterSelect.value;
                renderTable({
                    container,
                    data,
                    gearBtn,
                    setVisibleColumns,
                    visibleColumns,
                });
            }
        },
        { passive: false, signal: renderController.signal }
    );
    filterLabel.append(filterSelect);
    filterBar.append(filterLabel);
    section.append(filterBar);

    const headerBar = renderSummaryRuntime().createElement("div");
    headerBar.className = "header-bar";
    const title = renderSummaryRuntime().createElement("h3");
    title.textContent = "Activity Summary";
    title.classList.add("summary-title");
    headerBar.append(title);
    const copyBtn = renderSummaryRuntime().createElement("button");
    copyBtn.textContent = "Copy as CSV";
    copyBtn.className = "copy-btn";
    copyBtn.addEventListener(
        "click",
        () => {
            try {
                const rows: string[] = [];
                const orderedVisible =
                        orderSummaryColumnsNamedFirst(visibleColumns),
                    sortedVisible = [LABEL_COL, ...orderedVisible];
                rows.push(
                    sortedVisible
                        .map((k) => (k === LABEL_COL ? "Type" : k))
                        .join(",")
                );
                // Summary row
                if (filterValue === "All" || filterValue === "Summary") {
                    const summaryRows = getSummaryRows(data),
                        summary =
                            summaryRows && summaryRows[0] ? summaryRows[0] : {};
                    rows.push(
                        sortedVisible
                            .map((k) =>
                                k === LABEL_COL
                                    ? "Summary"
                                    : summary && summary[k] !== undefined
                                      ? toCellText(summary[k])
                                      : ""
                            )
                            .join(",")
                    );
                }
                // Lap rows
                if (
                    data.lapMesgs &&
                    data.lapMesgs.length > 0 &&
                    (filterValue === "All" || filterValue.startsWith("Lap"))
                ) {
                    const patchedLaps = data.lapMesgs.map((lap) => {
                        const patched = { ...lap };
                        patchSummaryFields(patched);
                        return patched;
                    });
                    for (const [i, lap] of patchedLaps.entries()) {
                        if (
                            filterValue === "All" ||
                            filterValue === `Lap ${i + 1}`
                        ) {
                            rows.push(
                                sortedVisible
                                    .map((k) =>
                                        k === LABEL_COL
                                            ? `Lap ${i + 1}`
                                            : toCellText(lap[k])
                                    )
                                    .join(",")
                            );
                        }
                    }
                }
                const csvText = rows.join("\n");
                // Prefer the Electron clipboard bridge to avoid permission denials in file:// contexts.
                Promise.resolve(exportUtils.copyTextToClipboard(csvText)).catch(
                    (error) => {
                        console.warn(
                            "[renderSummary] Failed to copy summary CSV:",
                            error
                        );
                    }
                );
            } catch {
                /* Ignore copy errors */
            }
        },
        { signal: renderController.signal }
    );
    headerBar.append(copyBtn);
    section.append(headerBar);

    const table = renderSummaryRuntime().createElement("table");
    table.classList.add("display");
    const headerRow = renderSummaryRuntime().createElement("tr"),
        orderedVisible = orderSummaryColumnsNamedFirst(visibleColumns),
        sortedVisible = [LABEL_COL, ...orderedVisible],
        thead = renderSummaryRuntime().createElement("thead");
    let virtualizerInit: (() => void) | null = null;
    for (const key of sortedVisible) {
        const th = renderSummaryRuntime().createElement("th");
        th.textContent = key === LABEL_COL ? "Type" : key;
        headerRow.append(th);
    }
    thead.append(headerRow);
    const summaryBody = renderSummaryRuntime().createElement("tbody");
    summaryBody.className = "summary-summary-body";
    const lapBody = renderSummaryRuntime().createElement("tbody");
    lapBody.className = "summary-lap-body";
    // Summary row
    if (filterValue === "All" || filterValue === "Summary") {
        const summaryRows = getSummaryRows(data),
            summaryRec = summaryRows[0] || {},
            summaryRow = renderSummaryRuntime().createElement("tr");
        for (const [idx, key] of sortedVisible.entries()) {
            const td = renderSummaryRuntime().createElement("td");
            td.textContent =
                key === LABEL_COL
                    ? "Summary"
                    : summaryRec[key] === undefined
                      ? ""
                      : toCellText(summaryRec[key]);
            if (idx === 0) {
                td.classList.add("summary-row");
            }
            summaryRow.append(td);
        }
        summaryBody.append(summaryRow);
    }
    // Lap rows
    if (
        data.lapMesgs &&
        data.lapMesgs.length > 0 &&
        (filterValue === "All" || filterValue.startsWith("Lap"))
    ) {
        const { lapMesgs } = data;
        const lapCache = new Map<number, SummaryRecord>();
        const lapFilterIndexRaw = filterValue.startsWith("Lap")
            ? Number.parseInt(filterValue.replace("Lap ", ""), 10)
            : Number.NaN;
        const lapFilterIndex = Number.isFinite(lapFilterIndexRaw)
            ? lapFilterIndexRaw - 1
            : null;
        const shouldVirtualize =
            filterValue === "All" &&
            lapMesgs.length > SUMMARY_VIRTUAL_ROW_THRESHOLD;

        if (shouldVirtualize) {
            virtualizerInit = () => {
                virtualizerCleanup = setupVirtualizedLapRows({
                    lapBody,
                    lapCache,
                    lapMesgs,
                    scrollContainer: container,
                    sortedVisible,
                });
            };
        } else if (lapFilterIndex === null) {
            for (let i = 0; i < lapMesgs.length; i += 1) {
                const lap = getPatchedLapRow(lapMesgs, i, lapCache);
                lapBody.append(createLapRowElement(i, lap, sortedVisible));
            }
        } else if (lapFilterIndex >= 0 && lapFilterIndex < lapMesgs.length) {
            const lap = getPatchedLapRow(lapMesgs, lapFilterIndex, lapCache);
            lapBody.append(
                createLapRowElement(lapFilterIndex, lap, sortedVisible)
            );
        }
    }
    table.append(thead);
    table.append(summaryBody);
    if (lapBody.childElementCount > 0 || virtualizerInit) {
        table.append(lapBody);
    }
    section.append(table);

    if (typeof virtualizerInit === "function") {
        const frameHandle = renderSummaryRuntime().requestAnimationFrame(() =>
            virtualizerInit?.()
        );
        if (frameHandle === null) {
            virtualizerInit();
        }
    }
}

/** Returns a patched lap row and caches the transformed entry. */
function getPatchedLapRow(
    lapMesgs: readonly SummaryRecord[],
    idx: number,
    cache: Map<number, SummaryRecord>
): SummaryRecord {
    const cached = cache.get(idx);
    if (cached) {
        return cached;
    }
    const raw = lapMesgs[idx] || {};
    const patched = { ...raw };
    patchSummaryFields(patched);
    cache.set(idx, patched);
    return patched;
}

/** Creates a lap row element for the summary table. */
function createLapRowElement(
    lapIndex: number,
    lap: SummaryRecord,
    sortedVisible: readonly string[]
): HTMLTableRowElement {
    const lapRow = renderSummaryRuntime().createElement("tr");
    for (const key of sortedVisible) {
        const td = renderSummaryRuntime().createElement("td");
        if (key === LABEL_COL) {
            td.textContent = `Lap ${lapIndex + 1}`;
        } else if (key === "timestamp" && lap["startTime"]) {
            td.textContent = toCellText(lap["startTime"]);
        } else {
            td.textContent = lap[key] === undefined ? "" : String(lap[key]);
        }
        lapRow.append(td);
    }
    return lapRow;
}

/**
 * Creates a spacer row used to represent off-screen rows in a virtualized
 * tbody.
 */
function createSpacerRow(colSpan: number): {
    cell: HTMLTableCellElement;
    row: HTMLTableRowElement;
} {
    const row = renderSummaryRuntime().createElement("tr");
    row.className = "summary-virtual-spacer";
    const cell = renderSummaryRuntime().createElement("td");
    cell.colSpan = colSpan;
    cell.style.padding = "0";
    cell.style.border = "none";
    cell.style.height = "0px";
    cell.style.lineHeight = "0";
    row.append(cell);
    return { row, cell };
}

/** Initializes a virtualized lap tbody to keep DOM size small for large files. */
function setupVirtualizedLapRows({
    lapBody,
    lapCache,
    lapMesgs,
    scrollContainer,
    sortedVisible,
}: {
    lapBody: HTMLTableSectionElement;
    lapCache: Map<number, SummaryRecord>;
    lapMesgs: readonly SummaryRecord[];
    scrollContainer: HTMLElement;
    sortedVisible: readonly string[];
}): () => void {
    const lapCount = lapMesgs.length;
    const colSpan = sortedVisible.length;
    const { row: topSpacer, cell: topCell } = createSpacerRow(colSpan);
    const { row: bottomSpacer, cell: bottomCell } = createSpacerRow(colSpan);
    const controller = renderSummaryRuntime().createAbortController();
    let rowHeight = SUMMARY_VIRTUAL_ROW_HEIGHT_FALLBACK;
    let lastStart = -1;
    let lastEnd = -1;
    let rafHandle: null | number = null;

    const measureRow = createLapRowElement(
        0,
        getPatchedLapRow(lapMesgs, 0, lapCache),
        sortedVisible
    );
    measureRow.style.visibility = "hidden";
    lapBody.append(measureRow);
    rowHeight = Math.max(
        SUMMARY_VIRTUAL_ROW_HEIGHT_FALLBACK,
        Math.round(measureRow.getBoundingClientRect().height)
    );
    measureRow.remove();

    const renderWindow = (start: number, end: number): void => {
        if (start === lastStart && end === lastEnd) {
            return;
        }
        lastStart = start;
        lastEnd = end;

        const fragment = renderSummaryRuntime().createDocumentFragment();
        topCell.style.height = `${start * rowHeight}px`;
        bottomCell.style.height = `${(lapCount - end) * rowHeight}px`;
        fragment.append(topSpacer);

        for (let i = start; i < end; i += 1) {
            const lap = getPatchedLapRow(lapMesgs, i, lapCache);
            fragment.append(createLapRowElement(i, lap, sortedVisible));
        }

        fragment.append(bottomSpacer);
        lapBody.replaceChildren(fragment);
    };

    const updateVirtualRows = () => {
        if (lapCount === 0) {
            return;
        }
        const containerRect = scrollContainer.getBoundingClientRect();
        const bodyRect = lapBody.getBoundingClientRect();
        const { scrollTop } = scrollContainer;
        const viewportHeight = scrollContainer.clientHeight;
        const bodyTop = bodyRect.top - containerRect.top + scrollTop;
        const relativeScroll = Math.max(0, scrollTop - bodyTop);

        const start = Math.max(
            0,
            Math.floor(relativeScroll / rowHeight) - SUMMARY_VIRTUAL_OVERSCAN
        );
        const end = Math.min(
            lapCount,
            Math.ceil((relativeScroll + viewportHeight) / rowHeight) +
                SUMMARY_VIRTUAL_OVERSCAN
        );
        renderWindow(start, end);
    };

    const scheduleUpdate = () => {
        if (rafHandle !== null) {
            return;
        }
        rafHandle = renderSummaryRuntime().requestAnimationFrame(() => {
            rafHandle = null;
            updateVirtualRows();
        });
        if (rafHandle === null) {
            updateVirtualRows();
        }
    };

    const onScroll = () => scheduleUpdate();
    const onResize = () => updateVirtualRows();

    scrollContainer.addEventListener("scroll", onScroll, {
        passive: true,
        signal: controller.signal,
    });
    renderSummaryRuntime().addResizeListener(onResize, {
        signal: controller.signal,
    });

    updateVirtualRows();

    return () => {
        controller.abort();
        if (rafHandle !== null) {
            renderSummaryRuntime().cancelAnimationFrame(rafHandle);
            rafHandle = null;
        }
    };
}

/**
 * Persists visible column preferences.
 *
 * The optional all-keys argument is retained for older callers.
 */
export function saveColPrefs(
    key: string,
    visibleColumns: readonly string[],
    _allKeys?: readonly string[]
): void {
    try {
        renderSummaryRuntime().setStorageItem(
            key,
            JSON.stringify(visibleColumns)
        );
    } catch {
        /* Intentionally ignore errors */
    }
}

/** Removes persisted visible column preferences. */
export function removeColPrefs(key: string): void {
    try {
        renderSummaryRuntime().removeStorageItem(key);
    } catch {
        /* Intentionally ignore errors */
    }
}

/**
 * Computes the single summary row from session messages or derived record
 * stats.
 */
function getSummaryRows(data: FitSummaryData): SummaryRecord[] {
    if (data?.sessionMesgs && data.sessionMesgs.length > 0) {
        const raw = { ...data.sessionMesgs[0] };
        patchSummaryFields(raw);

        // If this activity has estimated power (and no real power), surface basic stats.
        // This lets the Summary tab reflect the Estimated Power feature without altering FIT semantics.
        try {
            const recs = Array.isArray(data.recordMesgs)
                ? data.recordMesgs
                : [];
            if (recs.length > 0 && !hasPowerData(recs)) {
                const values: number[] = [];
                for (const r of recs) {
                    const v = Number(r["estimatedPower"]);
                    if (Number.isFinite(v) && v > 0) {
                        values.push(v);
                    }
                }
                if (values.length > 0) {
                    const total = values.reduce((a, b) => a + b, 0);
                    raw["avg_estimated_power"] = Math.round(
                        total / values.length
                    );
                    raw["max_estimated_power"] = Math.round(
                        Math.max(...values)
                    );
                }
            }
        } catch {
            /* ignore */
        }
        const totalAscent = Number(raw["total_ascent"]);
        if (Number.isFinite(totalAscent)) {
            raw["total_ascent_ft"] =
                `${(totalAscent * 3.280_84).toFixed(0)} ft`;
        }
        const totalDescent = Number(raw["total_descent"]);
        if (Number.isFinite(totalDescent)) {
            raw["total_descent_ft"] =
                `${(totalDescent * 3.280_84).toFixed(0)} ft`;
        }
        return [raw];
    }
    const arquero = resolveArqueroRuntime();
    if (data?.recordMesgs && data.recordMesgs.length > 0 && arquero) {
        try {
            const table = arquero.from(data.recordMesgs);
            const stats: SummaryStats = {
                end_time: table.get("timestamp", table.numRows() - 1),
                start_time: table.get("timestamp", 0),
                total_records: table.numRows(),
            };
            if (table.columnNames().includes("distance")) {
                stats.total_distance = table.get(
                    "distance",
                    table.numRows() - 1
                );
            }
            if (table.columnNames().includes("timestamp")) {
                const endTimestamp = table.get(
                    "timestamp",
                    table.numRows() - 1
                );
                const startTimestamp = table.get("timestamp", 0);
                if (isDateInput(endTimestamp) && isDateInput(startTimestamp)) {
                    const endTs = new Date(endTimestamp).getTime(),
                        startTs = new Date(startTimestamp).getTime();
                    if (Number.isFinite(startTs) && Number.isFinite(endTs)) {
                        const sec = Math.round((endTs - startTs) / 1000);
                        stats.duration = sec;
                    }
                }
            }
            if (table.columnNames().includes("speed")) {
                const speeds = Array.from(table.array("speed")).filter(
                    (value): value is number =>
                        typeof value === "number" && Number.isFinite(value)
                );
                if (speeds.length > 0) {
                    const total = speeds.reduce((a, b) => a + b, 0);
                    stats.avg_speed = total / speeds.length;
                    stats.max_speed = Math.max(...speeds);
                }
            }
            if (table.columnNames().includes("altitude")) {
                const alts = Array.from(table.array("altitude")).filter(
                    (value): value is number =>
                        typeof value === "number" && Number.isFinite(value)
                );
                if (alts.length > 0) {
                    stats.min_altitude_ft = Math.min(...alts);
                    stats.max_altitude_ft = Math.max(...alts);
                }
            }
            patchSummaryFields(stats);
            return [stats];
        } catch {
            // Ignore stats errors
        }
    }
    return [{}];
}
