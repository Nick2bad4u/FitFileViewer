/**
 * Summary column selector modal.
 *
 * Split out of renderSummaryHelpers.js to keep files below the eslint max-lines limit
 * and to keep modal-only UI logic isolated.
 */

import {
    getGlobalStorageKey,
    getStorageKey,
    loadColPrefs,
    orderSummaryColumnsNamedFirst,
    saveColPrefs,
} from "./renderSummaryHelpers.js";

/**
 * @param {{
 *  allKeys: string[];
 *  data: unknown;
 *  renderTable: () => void;
 *  setVisibleColumns: (cols: string[]) => void;
 *  visibleColumns: string[];
 * }} params
 * @returns {void}
 */
export function showColModal({
    allKeys,
    // Kept for API compatibility; modal no longer needs to inspect data contents.
    // eslint-disable-next-line no-unused-vars
    data,
    renderTable: reRenderTable,
    setVisibleColumns,
    visibleColumns: initialVisibleColumns,
}) {
    // Determine display order: show named keys first, numbered-only keys last.
    // (This matches the Summary table column ordering as well.)
    /** @type {string[]} */
    const displayKeys = orderSummaryColumnsNamedFirst(allKeys);

    // Local visibleColumns state
    let visibleColumns = [...initialVisibleColumns];

    // Search/filter
    let filterText = "";
    /** @type {string[]} */
    let displayedKeys = [...displayKeys];

    /** @type {number|null} */
    let lastCheckedIndex = null;

    const overlay = document.createElement("div");
    overlay.className = "summary-col-modal-overlay";
    const modal = document.createElement("div");
    modal.className = "summary-col-modal";

    // Header (title + close)
    const header = document.createElement("div");
    header.className = "summary-col-modal-header";
    const title = document.createElement("h2");
    title.textContent = "Select Summary Columns";

    const closeBtn = document.createElement("button");
    closeBtn.className = "summary-col-modal-close";
    closeBtn.type = "button";
    closeBtn.textContent = "×";
    closeBtn.title = "Close";
    closeBtn.setAttribute("aria-label", "Close column selector");
    closeBtn.addEventListener("click", () => overlay.remove());

    header.append(title, closeBtn);
    modal.append(header);

    const prefsKeyForFile = getStorageKey(/** @type {any} */ (globalThis).globalData || {}, allKeys);
    const prefsKeyGlobal = getGlobalStorageKey();

    const updateVisibleColumns = (cols) => {
        visibleColumns = cols;
        setVisibleColumns(cols);
    };

    const metaBar = document.createElement("div");
    metaBar.className = "summary-col-meta";
    const selectedCount = document.createElement("div");
    selectedCount.className = "summary-col-selected-count";
    const updateSelectedCount = () => {
        selectedCount.textContent = `Selected ${visibleColumns.length} / ${allKeys.length}`;
    };
    updateSelectedCount();

    const searchWrap = document.createElement("div");
    searchWrap.className = "summary-col-search-wrap";
    const searchInput = document.createElement("input");
    searchInput.className = "summary-col-search";
    searchInput.type = "search";
    searchInput.placeholder = "Filter columns…";
    searchInput.autocomplete = "off";
    searchInput.addEventListener("input", () => {
        filterText = searchInput.value.trim().toLowerCase();
        lastCheckedIndex = null;
        updateColList();
    });
    searchWrap.append(searchInput);

    metaBar.append(selectedCount, searchWrap);
    modal.append(metaBar);

    // Default preset actions (global + per-file)
    const presetsBar = document.createElement("div");
    presetsBar.className = "summary-col-presets";

    const badges = document.createElement("div");
    badges.className = "summary-col-badges";

    const tooltip = document.createElement("div");
    tooltip.className = "summary-col-tooltip";
    tooltip.style.display = "none";
    overlay.append(tooltip);

    /**
     * Render a badge that can optionally show a hover tooltip listing columns.
     * @param {{
     *  label: string;
     *  variant: 'ok'|'warn'|'off';
     *  columns: string[]|null;
     * }} params
     */
    const createBadge = ({ label, variant, columns }) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = `summary-col-badge summary-col-badge--${variant}`;
        b.textContent = label;
        b.disabled = !columns || columns.length === 0;
        b.title = columns && columns.length > 0 ? "Click to preview" : "Not set";
        return b;
    };

    /**
     * @param {HTMLElement} anchor
     * @param {string} titleText
     * @param {string[]|null} cols
     */
    const showTooltip = (anchor, titleText, cols) => {
        if (!cols || cols.length === 0) return;

        tooltip.replaceChildren();
        const h = document.createElement("div");
        h.className = "summary-col-tooltip-title";
        h.textContent = `${titleText} (${cols.length})`;
        tooltip.append(h);

        const list = document.createElement("div");
        list.className = "summary-col-tooltip-list";
        for (const c of cols) {
            const item = document.createElement("div");
            item.className = "summary-col-tooltip-item";
            item.textContent = c;
            list.append(item);
        }
        tooltip.append(list);

        const rect = anchor.getBoundingClientRect();
        const top = rect.bottom + 8;
        const left = Math.min(rect.left, Math.max(8, globalThis.innerWidth - 420));
        tooltip.style.top = `${Math.min(top, globalThis.innerHeight - 320)}px`;
        tooltip.style.left = `${left}px`;
        tooltip.style.display = "block";
    };

    const hideTooltip = () => {
        tooltip.style.display = "none";
        tooltip.replaceChildren();
    };

    // Clicking outside modal closes tooltip + modal.
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            hideTooltip();
            overlay.remove();
        }
    });

    // Escape closes modal.
    overlay.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            e.preventDefault();
            overlay.remove();
        }
    });
    overlay.tabIndex = -1;
    queueMicrotask(() => {
        try {
            overlay.focus();
        } catch {
            /* ignore */
        }
    });

    const getGlobalDefaultCols = () => loadColPrefs(prefsKeyGlobal);
    const getFileSavedCols = () => loadColPrefs(prefsKeyForFile);

    /**
     * Normalize a saved column list to the current file's key universe + named-first ordering.
     * @param {string[]|null} cols
     * @returns {string[]}
     */
    const normalizeCols = (cols) => {
        if (!cols || cols.length === 0) return [];
        return orderSummaryColumnsNamedFirst(allKeys).filter((k) => cols.includes(k));
    };

    /**
     * @param {string[]|null} a
     * @param {string[]} b
     * @returns {boolean}
     */
    const sameCols = (a, b) => {
        const aa = normalizeCols(a);
        const bb = normalizeCols(b);
        if (aa.length !== bb.length) return false;
        for (const [i, element] of aa.entries()) {
            if (element !== bb[i]) return false;
        }
        return true;
    };

    /**
     * @param {string[]|null} base
     * @param {string[]} current
     * @returns {{ added: number; removed: number }}
     */
    const diffCounts = (base, current) => {
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
    const statusBar = document.createElement("div");
    statusBar.className = "summary-col-status";
    const statusText = document.createElement("div");
    statusText.className = "summary-col-status-text";
    const statusHint = document.createElement("div");
    statusHint.className = "summary-col-status-hint";
    statusBar.append(statusText, statusHint);
    modal.append(statusBar);

    const updateStatus = () => {
        const globalCols = getGlobalDefaultCols();
        const fileCols = getFileSavedCols();

        const isGlobalActive = globalCols && sameCols(globalCols, visibleColumns);
        const isFileActive = fileCols && sameCols(fileCols, visibleColumns);

        if (isGlobalActive) {
            statusBar.dataset.mode = "global";
            statusText.textContent = "Currently using: Global default";
            statusHint.textContent = "";
            return;
        }
        if (isFileActive) {
            statusBar.dataset.mode = "file";
            statusText.textContent = "Currently using: This file saved";
            statusHint.textContent = "";
            return;
        }

        statusBar.dataset.mode = "custom";
        statusText.textContent = "Currently using: Custom selection";
        if (globalCols) {
            const { added, removed } = diffCounts(globalCols, visibleColumns);
            const parts = [];
            if (added > 0) parts.push(`+${added}`);
            if (removed > 0) parts.push(`-${removed}`);
            statusHint.textContent = parts.length > 0 ? `vs global default: ${parts.join(" ")}` : "";
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
        label: "This file saved",
        variant: getFileSavedCols() ? "warn" : "off",
        columns: getFileSavedCols(),
    });

    const wireBadgeTooltip = (badgeEl, titleText, getCols) => {
        badgeEl.addEventListener("mouseenter", () => showTooltip(badgeEl, titleText, getCols()));
        badgeEl.addEventListener("mouseleave", hideTooltip);
        badgeEl.addEventListener("focus", () => showTooltip(badgeEl, titleText, getCols()));
        badgeEl.addEventListener("blur", hideTooltip);
        badgeEl.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const cols = getCols();
            if (!cols) return;
            if (tooltip.style.display === "block") {
                hideTooltip();
            } else {
                showTooltip(badgeEl, titleText, cols);
            }
        });
    };

    wireBadgeTooltip(globalBadge, "Global default columns", getGlobalDefaultCols);
    wireBadgeTooltip(fileBadge, "Saved columns for this file", getFileSavedCols);

    badges.append(globalBadge, fileBadge);

    const setDefaultBtn = document.createElement("button");
    setDefaultBtn.className = "themed-btn";
    setDefaultBtn.textContent = "Set Global Default";
    setDefaultBtn.title = "Use this column selection as the default for all future files";
    setDefaultBtn.addEventListener("click", () => {
        saveColPrefs(prefsKeyGlobal, visibleColumns);
        // Also refresh current file prefs so the current file behaves consistently.
        saveColPrefs(prefsKeyForFile, visibleColumns);
        globalBadge.className = "summary-col-badge summary-col-badge--ok";
        globalBadge.disabled = false;
        updateSelectedCount();
        updateStatus();
        reRenderTable();
    });

    const useDefaultBtn = document.createElement("button");
    useDefaultBtn.className = "themed-btn";
    useDefaultBtn.textContent = "Use Global Default";
    useDefaultBtn.title = "Replace the current selection with the global default columns";
    useDefaultBtn.addEventListener("click", () => {
        const cols = getGlobalDefaultCols();
        if (!cols || cols.length === 0) return;
        const ordered = orderSummaryColumnsNamedFirst(allKeys).filter((k) => cols.includes(k));
        updateVisibleColumns(ordered);
        updateColList();
        updateSelectedCount();
        updateStatus();
        reRenderTable();
        saveColPrefs(prefsKeyForFile, ordered);
    });

    const clearDefaultBtn = document.createElement("button");
    clearDefaultBtn.className = "themed-btn";
    clearDefaultBtn.textContent = "Clear Default";
    clearDefaultBtn.title = "Remove the global default column selection";
    clearDefaultBtn.addEventListener("click", () => {
        try {
            localStorage.removeItem(prefsKeyGlobal);
        } catch {
            /* ignore */
        }
        globalBadge.className = "summary-col-badge summary-col-badge--off";
        globalBadge.disabled = true;
        hideTooltip();
        updateStatus();
        reRenderTable();
    });

    const actionsLeft = document.createElement("div");
    actionsLeft.className = "summary-col-presets-actions";
    actionsLeft.append(useDefaultBtn, setDefaultBtn, clearDefaultBtn);

    presetsBar.append(badges, actionsLeft);
    modal.append(presetsBar);

    const colList = document.createElement("div");
    colList.className = "col-list";
    modal.append(colList);

    const selectAllBtn = document.createElement("button");
    selectAllBtn.className = "themed-btn";
    selectAllBtn.textContent = "Select All";

    /**
     * Create a mousedown handler for range selection with Shift.
     * @param {number} idx
     * @param {string} key
     */
    function createMouseDownHandler(idx, key) {
        /** @param {MouseEvent} e */
        return (e) => {
            if (e.shiftKey && lastCheckedIndex !== null) {
                e.preventDefault();
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
                newCols = orderSummaryColumnsNamedFirst(allKeys).filter((k) => newCols.includes(k));
                updateVisibleColumns(newCols);
                updateColList();
                updateStatus();
                reRenderTable();
                saveColPrefs(prefsKeyForFile, newCols);
            }
        };
    }

    /**
     * Create a change handler for single checkbox toggle.
     * @param {number} idx
     * @param {string} key
     * @param {HTMLInputElement} loopCheckbox
     */
    function createChangeHandler(idx, key, loopCheckbox) {
        /** @param {Event & { shiftKey?: boolean}} e */
        return (e) => {
            if (e.shiftKey && lastCheckedIndex !== null) {
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
            newCols = orderSummaryColumnsNamedFirst(allKeys).filter((k) => newCols.includes(k));
            updateVisibleColumns(newCols);
            selectAllBtn.textContent = newCols.length === allKeys.length ? "Deselect All" : "Select All";
            updateColList();
            updateStatus();
            reRenderTable();
            saveColPrefs(prefsKeyForFile, newCols);
        };
    }

    /**
     * Refresh checkbox list based on current visibleColumns
     * @returns {void}
     */
    function updateColList() {
        colList.innerHTML = "";

        if (filterText.length > 0) {
            displayedKeys = displayKeys.filter((k) => k.toLowerCase().includes(filterText));
        } else {
            displayedKeys = [...displayKeys];
        }

        // Always show label column as checked and disabled
        const checkbox = document.createElement("input");
        const label = document.createElement("label");
        checkbox.type = "checkbox";
        checkbox.checked = true;
        checkbox.disabled = true;
        label.append(checkbox);
        label.append(document.createTextNode("Type"));
        colList.append(label);

        if (displayedKeys.length === 0) {
            const empty = document.createElement("div");
            empty.className = "summary-col-empty";
            empty.textContent = "No matching columns";
            colList.append(empty);
        }

        for (const [idx, key] of displayedKeys.entries()) {
            const loopCheckbox = document.createElement("input");
            const loopLabel = document.createElement("label");
            loopCheckbox.type = "checkbox";
            loopCheckbox.checked = visibleColumns.includes(key);
            loopCheckbox.tabIndex = 0;
            loopCheckbox.addEventListener("mousedown", createMouseDownHandler(idx, key));
            loopCheckbox.addEventListener("change", createChangeHandler(idx, key, loopCheckbox));
            loopLabel.append(loopCheckbox);
            loopLabel.append(document.createTextNode(key));
            colList.append(loopLabel);
        }

        selectAllBtn.textContent = visibleColumns.length === allKeys.length ? "Deselect All" : "Select All";
        updateSelectedCount();
        updateStatus();

        const fileCols = getFileSavedCols();
        fileBadge.className = `summary-col-badge summary-col-badge--${fileCols ? "warn" : "off"}`;
        fileBadge.disabled = !fileCols || fileCols.length === 0;
    }

    selectAllBtn.textContent = visibleColumns.length === allKeys.length ? "Deselect All" : "Select All";
    selectAllBtn.addEventListener("click", () => {
        const newCols = visibleColumns.length === allKeys.length ? [] : [...orderSummaryColumnsNamedFirst(allKeys)];
        updateVisibleColumns(newCols);
        updateColList();
        updateStatus();
        reRenderTable();
        saveColPrefs(prefsKeyForFile, newCols);
    });

    const selectAllWrap = document.createElement("div");
    selectAllWrap.className = "summary-col-selectall";
    selectAllWrap.append(selectAllBtn);
    modal.append(selectAllWrap);

    updateColList();

    // Actions
    const actions = document.createElement("div");
    actions.className = "modal-actions";
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "themed-btn";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => overlay.remove());
    const okBtn = document.createElement("button");
    okBtn.className = "themed-btn";
    okBtn.textContent = "OK";
    okBtn.addEventListener("click", () => {
        overlay.remove();
        reRenderTable();
        saveColPrefs(prefsKeyForFile, visibleColumns);
    });
    actions.append(cancelBtn);
    actions.append(okBtn);
    modal.append(actions);
    overlay.append(modal);
    document.body.append(overlay);
}
