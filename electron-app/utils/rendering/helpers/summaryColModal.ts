/**
 * Summary column selector modal.
 *
 * Split out of renderSummaryHelpers.js to keep files below the eslint max-lines
 * limit and to keep modal-only UI logic isolated.
 */

import {
    getGlobalStorageKey,
    getStorageKey,
    type FitSummaryData,
    loadColPrefs,
    orderSummaryColumnsNamedFirst,
    removeColPrefs,
    saveColPrefs,
} from "./renderSummaryHelpers.js";
import { getSummaryColModalRuntime } from "./summaryColModalRuntime.js";
import { createModalFocusTrap } from "../../ui/modals/modalFocusTrap.js";

type SummaryColModalParams = {
    allKeys: string[];
    data?: FitSummaryData;
    renderTable: () => void;
    setVisibleColumns: (cols: string[]) => void;
    visibleColumns: string[];
};

type BadgeVariant = "off" | "ok" | "warn";

type BadgeOptions = {
    columns: string[] | null;
    label: string;
    variant: BadgeVariant;
};

/**
 * Show the Summary table column selector modal.
 */
export function showColModal({
    allKeys,
    data,
    renderTable: reRenderTable,
    setVisibleColumns,
    visibleColumns: initialVisibleColumns,
}: SummaryColModalParams): void {
    // Determine display order: show named keys first, numbered-only keys last.
    // (This matches the Summary table column ordering as well.)
    const displayKeys = orderSummaryColumnsNamedFirst(allKeys);

    // Local visibleColumns state
    let visibleColumns = [...initialVisibleColumns];

    // Search/filter
    let filterText = "";
    let displayedKeys = [...displayKeys];

    let lastCheckedIndex: null | number = null;
    const runtime = getSummaryColModalRuntime();
    const modalController = runtime.createAbortController();
    const { signal } = modalController;
    let focusTrapCleanup: (() => void) | undefined;
    const previouslyFocusedElement = runtime.getActiveElement();

    const overlay = runtime.createElement("div");
    overlay.className = "summary-col-modal-overlay";
    const modal = runtime.createElement("div");
    modal.className = "summary-col-modal";
    modal.setAttribute("aria-labelledby", "summary-col-modal-title");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("role", "dialog");

    // Header (title + close)
    const header = runtime.createElement("div");
    header.className = "summary-col-modal-header";
    const title = runtime.createElement("h2");
    title.id = "summary-col-modal-title";
    title.textContent = "Select Summary Columns";

    const closeBtn = runtime.createElement("button");
    closeBtn.className = "summary-col-modal-close";
    closeBtn.type = "button";
    closeBtn.textContent = "×";
    closeBtn.title = "Close";
    closeBtn.setAttribute("aria-label", "Close column selector");
    const closeOverlay = (): void => {
        modalController.abort();
        overlay.remove();
        focusTrapCleanup?.();
        try {
            previouslyFocusedElement?.focus();
        } catch {
            /* ignore */
        }
    };
    closeBtn.addEventListener("click", closeOverlay, { signal });

    header.append(title, closeBtn);
    modal.append(header);

    const prefsKeyForFile = getStorageKey(data, allKeys);
    const prefsKeyGlobal = getGlobalStorageKey();

    const updateVisibleColumns = (cols: string[]): void => {
        visibleColumns = cols;
        setVisibleColumns(cols);
    };

    const metaBar = runtime.createElement("div");
    metaBar.className = "summary-col-meta";
    const selectedCount = runtime.createElement("div");
    selectedCount.className = "summary-col-selected-count";
    const updateSelectedCount = (): void => {
        selectedCount.textContent = `Selected ${visibleColumns.length} / ${allKeys.length}`;
    };
    updateSelectedCount();

    const searchWrap = runtime.createElement("div");
    searchWrap.className = "summary-col-search-wrap";
    const searchInput = runtime.createElement("input");
    searchInput.className = "summary-col-search";
    searchInput.type = "search";
    searchInput.placeholder = "Filter columns…";
    searchInput.autocomplete = "off";
    searchInput.addEventListener(
        "input",
        () => {
            filterText = searchInput.value.trim().toLowerCase();
            lastCheckedIndex = null;
            updateColList();
        },
        { signal }
    );
    searchWrap.append(searchInput);

    metaBar.append(selectedCount, searchWrap);
    modal.append(metaBar);

    // Default preset actions (global + per-file)
    const presetsBar = runtime.createElement("div");
    presetsBar.className = "summary-col-presets";

    const badges = runtime.createElement("div");
    badges.className = "summary-col-badges";

    const tooltip = runtime.createElement("div");
    tooltip.className = "summary-col-tooltip";
    tooltip.style.display = "none";
    overlay.append(tooltip);

    const createBadge = ({
        label,
        variant,
        columns,
    }: BadgeOptions): HTMLButtonElement => {
        const b = runtime.createElement("button");
        b.type = "button";
        b.className = `summary-col-badge summary-col-badge--${variant}`;
        b.textContent = label;
        b.disabled = !columns || columns.length === 0;
        b.title =
            columns && columns.length > 0 ? "Click to preview" : "Not set";
        return b;
    };

    const showTooltip = (
        anchor: HTMLElement,
        titleText: string,
        cols: string[] | null
    ): void => {
        if (!cols || cols.length === 0) return;

        tooltip.replaceChildren();
        const h = runtime.createElement("div");
        h.className = "summary-col-tooltip-title";
        h.textContent = `${titleText} (${cols.length})`;
        tooltip.append(h);

        const list = runtime.createElement("div");
        list.className = "summary-col-tooltip-list";
        for (const c of cols) {
            const item = runtime.createElement("div");
            item.className = "summary-col-tooltip-item";
            item.textContent = c;
            list.append(item);
        }
        tooltip.append(list);

        const rect = anchor.getBoundingClientRect();
        const top = rect.bottom + 8;
        const { height: viewportHeight, width: viewportWidth } =
            runtime.getViewport();
        const left = Math.min(rect.left, Math.max(8, viewportWidth - 420));
        tooltip.style.top = `${Math.min(top, viewportHeight - 320)}px`;
        tooltip.style.left = `${left}px`;
        tooltip.style.display = "block";
    };

    const hideTooltip = (): void => {
        tooltip.style.display = "none";
        tooltip.replaceChildren();
    };

    // Clicking outside modal closes tooltip + modal.
    overlay.addEventListener(
        "click",
        (e) => {
            if (e.target === overlay) {
                hideTooltip();
                closeOverlay();
            }
        },
        { signal }
    );

    // Escape closes modal.
    overlay.addEventListener(
        "keydown",
        (e) => {
            if (runtime.isKeyboardEvent(e) && e.key === "Escape") {
                e.preventDefault();
                closeOverlay();
            }
        },
        { signal }
    );
    const getGlobalDefaultCols = (): string[] | null =>
        loadColPrefs(prefsKeyGlobal);
    const getFileSavedCols = (): string[] | null =>
        loadColPrefs(prefsKeyForFile);

    const normalizeCols = (cols: string[] | null): string[] => {
        if (!cols || cols.length === 0) return [];
        return orderSummaryColumnsNamedFirst(allKeys).filter((k) =>
            cols.includes(k)
        );
    };

    const sameCols = (a: string[] | null, b: string[] | null): boolean => {
        const aa = normalizeCols(a);
        const bb = normalizeCols(b);
        if (aa.length !== bb.length) return false;
        for (const [i, element] of aa.entries()) {
            if (element !== bb[i]) return false;
        }
        return true;
    };

    /**
     * Returns the "baseline" selection used when no per-file override exists.
     * Baseline = global default (if set), otherwise built-in default (all keys,
     * named-first).
     */
    const getBaselineCols = (): string[] => {
        const globalCols = getGlobalDefaultCols();
        const baselineRaw =
            globalCols && globalCols.length > 0
                ? globalCols
                : orderSummaryColumnsNamedFirst(allKeys);
        return orderSummaryColumnsNamedFirst(allKeys).filter((k) =>
            baselineRaw.includes(k)
        );
    };

    /**
     * Persist the current selection for the current file.
     *
     * Important UX detail: If the current selection matches the baseline
     * (global default when set, otherwise the built-in default), we remove the
     * per-file key instead of saving it. This ensures that "switching off" a
     * file override actually stays off across tab switches and app restarts.
     */
    const persistFileSelection = (cols: string[]): void => {
        const baseline = getBaselineCols();

        // If selection matches baseline, clear per-file key to avoid a "phantom" override.
        if (sameCols(baseline, cols)) {
            removeColPrefs(prefsKeyForFile);
            return;
        }

        saveColPrefs(prefsKeyForFile, cols);
    };

    const diffCounts = (
        base: string[] | null,
        current: string[]
    ): { added: number; removed: number } => {
        const baseSet = new Set(normalizeCols(base));
        const currentSet = new Set(normalizeCols(current));
        let added = 0;
        let removed = 0;
        for (const k of currentSet) {
            if (!baseSet.has(k)) added++;
        }
        for (const k of baseSet) {
            if (!currentSet.has(k)) removed++;
        }
        return { added, removed };
    };

    // Status line (helps users understand if they're on defaults or a custom selection)
    const statusBar = runtime.createElement("div");
    statusBar.className = "summary-col-status";
    const statusText = runtime.createElement("div");
    statusText.className = "summary-col-status-text";
    const statusHint = runtime.createElement("div");
    statusHint.className = "summary-col-status-hint";
    statusBar.append(statusText, statusHint);
    modal.append(statusBar);

    const updateStatus = () => {
        const globalCols = normalizeCols(getGlobalDefaultCols());
        const baseline = getBaselineCols();
        const fileCols = normalizeCols(getFileSavedCols());

        const hasGlobalDefault = globalCols.length > 0;
        const fileOverrideActive =
            fileCols.length > 0 && !sameCols(fileCols, baseline);

        const isDefaultSelection = sameCols(baseline, visibleColumns);
        const isSavedFileSelection =
            fileOverrideActive && sameCols(fileCols, visibleColumns);

        if (isDefaultSelection) {
            statusBar.dataset["mode"] = hasGlobalDefault ? "global" : "custom";
            statusText.textContent = hasGlobalDefault
                ? "This file is using: Default (Global)"
                : "This file is using: Default";
            statusHint.textContent = fileOverrideActive
                ? "(a file override existed and was cleared)"
                : "";
            return;
        }

        statusBar.dataset["mode"] = "file";
        statusText.textContent = isSavedFileSelection
            ? "This file is using: Saved selection"
            : "This file is using: Custom selection";

        if (hasGlobalDefault) {
            const { added, removed } = diffCounts(globalCols, visibleColumns);
            const parts: string[] = [];
            if (added > 0) parts.push(`+${added}`);
            if (removed > 0) parts.push(`-${removed}`);
            statusHint.textContent =
                parts.length > 0 ? `vs global default: ${parts.join(" ")}` : "";
        } else {
            statusHint.textContent = "";
        }
    };

    updateStatus();

    const globalBadge = createBadge({
        label: "Global default",
        variant: getGlobalDefaultCols() ? "ok" : "off",
        columns: getGlobalDefaultCols(),
    });
    const fileBadge = createBadge({
        label: "This file override",
        variant: getFileSavedCols() ? "warn" : "off",
        columns: getFileSavedCols(),
    });

    const wireBadgeTooltip = (
        badgeEl: HTMLButtonElement,
        titleText: string,
        getCols: () => string[] | null
    ): void => {
        badgeEl.addEventListener(
            "mouseenter",
            () => showTooltip(badgeEl, titleText, getCols()),
            { signal }
        );
        badgeEl.addEventListener("mouseleave", hideTooltip, { signal });
        badgeEl.addEventListener(
            "focus",
            () => showTooltip(badgeEl, titleText, getCols()),
            { signal }
        );
        badgeEl.addEventListener("blur", hideTooltip, { signal });
        badgeEl.addEventListener(
            "click",
            (e) => {
                e.preventDefault();
                e.stopPropagation();
                const cols = getCols();
                if (!cols) return;
                if (tooltip.style.display === "block") {
                    hideTooltip();
                } else {
                    showTooltip(badgeEl, titleText, cols);
                }
            },
            { signal }
        );
    };

    wireBadgeTooltip(
        globalBadge,
        "Global default columns",
        getGlobalDefaultCols
    );
    wireBadgeTooltip(
        fileBadge,
        "Saved override columns for this file",
        getFileSavedCols
    );

    badges.append(globalBadge, fileBadge);

    // Help text + simplified actions
    const help = runtime.createElement("div");
    help.className = "summary-col-presets-help";
    help.append(
        runtime.createTextNode(
            "How this works: your Global default is used for files with no saved selection. Any changes you make here are saved for this file automatically."
        )
    );

    const actionsWrap = runtime.createElement("div");
    actionsWrap.className = "summary-col-presets-actions-wrap";

    const resetBtn = runtime.createElement("button");
    resetBtn.className = "themed-btn";
    resetBtn.textContent = "Reset to Default";
    resetBtn.title =
        "Stop overriding this file and go back to the default column selection";
    resetBtn.addEventListener(
        "click",
        () => {
            hideTooltip();
            const ordered = getBaselineCols();
            updateVisibleColumns(ordered);
            updateColList();
            updateSelectedCount();
            persistFileSelection(ordered);
            updateStatus();
            reRenderTable();
        },
        { signal }
    );

    const makeGlobalDefaultBtn = runtime.createElement("button");
    makeGlobalDefaultBtn.className = "themed-btn";
    makeGlobalDefaultBtn.textContent = "Make Global Default";
    makeGlobalDefaultBtn.title =
        "Use this selection as the default for future files";
    makeGlobalDefaultBtn.addEventListener(
        "click",
        () => {
            saveColPrefs(prefsKeyGlobal, visibleColumns);
            // Now that the global default matches the selection, clear redundant per-file override.
            persistFileSelection(visibleColumns);
            globalBadge.className = "summary-col-badge summary-col-badge--ok";
            globalBadge.disabled = false;
            hideTooltip();
            updateStatus();
            reRenderTable();
        },
        { signal }
    );

    const clearGlobalDefaultBtn = runtime.createElement("button");
    clearGlobalDefaultBtn.className = "themed-btn";
    clearGlobalDefaultBtn.textContent = "Clear Global Default";
    clearGlobalDefaultBtn.title = "Remove the saved global default";
    clearGlobalDefaultBtn.addEventListener(
        "click",
        () => {
            removeColPrefs(prefsKeyGlobal);
            globalBadge.className = "summary-col-badge summary-col-badge--off";
            globalBadge.disabled = true;
            hideTooltip();
            // Clearing global default can change the baseline; ensure file override state is normalized.
            persistFileSelection(visibleColumns);
            updateStatus();
            reRenderTable();
        },
        { signal }
    );

    actionsWrap.append(resetBtn, makeGlobalDefaultBtn, clearGlobalDefaultBtn);

    presetsBar.append(badges, help, actionsWrap);
    modal.append(presetsBar);

    const colList = runtime.createElement("div");
    colList.className = "col-list";
    modal.append(colList);

    const selectAllBtn = runtime.createElement("button");
    selectAllBtn.className = "themed-btn summary-col-selectall-btn";
    selectAllBtn.textContent = "Select All";

    function createMouseDownHandler(idx: number, key: string): EventListener {
        return (event: Event): void => {
            if (!runtime.isMouseEvent(event)) {
                return;
            }
            if (event.shiftKey && lastCheckedIndex !== null) {
                event.preventDefault();
                const end = Math.max(lastCheckedIndex, idx);
                const start = Math.min(lastCheckedIndex, idx);
                const shouldCheck = !visibleColumns.includes(key);
                let newCols = [...visibleColumns];
                for (let i = start; i <= end; ++i) {
                    const k = displayedKeys[i];
                    if (typeof k !== "string") {
                        continue;
                    }
                    if (shouldCheck && !newCols.includes(k)) {
                        newCols.push(k);
                    }
                    if (!shouldCheck && newCols.includes(k)) {
                        newCols = newCols.filter((x) => x !== k);
                    }
                }
                newCols = orderSummaryColumnsNamedFirst(allKeys).filter((k) =>
                    newCols.includes(k)
                );
                updateVisibleColumns(newCols);
                updateColList();
                updateStatus();
                reRenderTable();
                persistFileSelection(newCols);
            }
        };
    }

    function createChangeHandler(
        idx: number,
        key: string,
        loopCheckbox: HTMLInputElement
    ): EventListener {
        return (event: Event): void => {
            if (
                runtime.isMouseEvent(event) &&
                event.shiftKey &&
                lastCheckedIndex !== null
            ) {
                return; // handled in mousedown
            }
            lastCheckedIndex = idx;
            let newCols = [...visibleColumns];
            if (loopCheckbox.checked) {
                if (!newCols.includes(key)) {
                    newCols.push(key);
                }
            } else {
                newCols = newCols.filter((k) => k !== key);
            }
            newCols = allKeys.filter((k) => newCols.includes(k));
            newCols = orderSummaryColumnsNamedFirst(allKeys).filter((k) =>
                newCols.includes(k)
            );
            updateVisibleColumns(newCols);
            selectAllBtn.textContent =
                newCols.length === allKeys.length
                    ? "Deselect All"
                    : "Select All";
            updateColList();
            updateStatus();
            reRenderTable();
            persistFileSelection(newCols);
        };
    }

    /**
     * Refresh checkbox list based on current visibleColumns
     */
    function updateColList() {
        colList.replaceChildren();

        displayedKeys =
            filterText.length > 0
                ? displayKeys.filter((k) =>
                      k.toLowerCase().includes(filterText)
                  )
                : [...displayKeys];

        // Always show label column as checked and disabled
        const checkbox = runtime.createElement("input");
        const label = runtime.createElement("label");
        checkbox.type = "checkbox";
        checkbox.checked = true;
        checkbox.disabled = true;
        label.append(checkbox);
        label.append(runtime.createTextNode("Type"));
        colList.append(label);

        if (displayedKeys.length === 0) {
            const empty = runtime.createElement("div");
            empty.className = "summary-col-empty";
            empty.textContent = "No matching columns";
            colList.append(empty);
        }

        for (const [idx, key] of displayedKeys.entries()) {
            const loopCheckbox = runtime.createElement("input");
            const loopLabel = runtime.createElement("label");
            loopCheckbox.type = "checkbox";
            loopCheckbox.checked = visibleColumns.includes(key);
            loopCheckbox.tabIndex = 0;
            loopCheckbox.addEventListener(
                "mousedown",
                createMouseDownHandler(idx, key),
                { signal }
            );
            loopCheckbox.addEventListener(
                "change",
                createChangeHandler(idx, key, loopCheckbox),
                { signal }
            );
            loopLabel.append(loopCheckbox);
            loopLabel.append(runtime.createTextNode(key));
            colList.append(loopLabel);
        }

        selectAllBtn.textContent =
            visibleColumns.length === allKeys.length
                ? "Deselect All"
                : "Select All";
        updateSelectedCount();
        updateStatus();

        const fileCols = getFileSavedCols();
        fileBadge.className = `summary-col-badge summary-col-badge--${fileCols ? "warn" : "off"}`;
        fileBadge.disabled = !fileCols || fileCols.length === 0;
    }

    selectAllBtn.textContent =
        visibleColumns.length === allKeys.length
            ? "Deselect All"
            : "Select All";
    selectAllBtn.addEventListener(
        "click",
        () => {
            const newCols =
                visibleColumns.length === allKeys.length
                    ? []
                    : [...orderSummaryColumnsNamedFirst(allKeys)];
            updateVisibleColumns(newCols);
            updateColList();
            updateStatus();
            reRenderTable();
            persistFileSelection(newCols);
        },
        { signal }
    );

    const selectAllWrap = runtime.createElement("div");
    selectAllWrap.className = "summary-col-selectall";
    selectAllWrap.append(selectAllBtn);
    modal.append(selectAllWrap);

    updateColList();

    // Actions
    const actions = runtime.createElement("div");
    actions.className = "modal-actions";
    const closeActionBtn = runtime.createElement("button");
    closeActionBtn.className = "themed-btn";
    closeActionBtn.textContent = "Close";
    closeActionBtn.title = "Changes are saved automatically";
    closeActionBtn.addEventListener("click", closeOverlay, { signal });
    actions.append(closeActionBtn);
    modal.append(actions);
    overlay.append(modal);
    runtime.appendToBody(overlay);
    focusTrapCleanup = createModalFocusTrap(modal, searchInput);
}
