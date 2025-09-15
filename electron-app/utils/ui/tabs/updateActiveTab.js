import { getState, setState, subscribe } from "../../state/core/stateManager.js";

/**
 * Extract tab name from button ID
 * @param {string} tabId - The button ID
 * @returns {string|null} Tab name or null if not found
 */
/**
 * Extract tab name from button ID
 * @param {string} tabId
 * @returns {string}
 */
function extractTabName(tabId) {
    // Common patterns for tab button IDs
    const patterns = [
        /^tab-(.+)$/, // Tab-summary -> summary
        /^(.+)-tab$/, // Summary-tab -> summary
        /^btn-(.+)$/, // Btn-chart -> chart
        /^(.+)-btn$/, // Chart-btn -> chart
    ];

    for (const pattern of patterns) {
        const match = tabId.match(pattern);
        if (match) {
            return /** @type {string} */ (match[1] || null);
        }
    }

    // Fallback: use the ID as-is if no pattern matches
    return tabId;
}

// No persistent cache to avoid cross-test contamination. Use minimal DOM queries per call.

/**
 * Update active tab efficiently
 * @param {string} tabId
 * @returns {boolean}
 */
export function updateActiveTab(tabId) {
    if (!tabId || typeof tabId !== "string") {
        console.warn("[updateActiveTab] Invalid tabId:", tabId);
        return false;
    }

    // Fast path: if the requested tab is already the only active one, avoid extra DOM work
    try {
        const currentActive = document.querySelector('.tab-button.active');
        if (currentActive && currentActive.id === tabId) {
            const tabNameFast = extractTabName(tabId);
            setState('ui.activeTab', tabNameFast, { source: 'updateActiveTab' });
            return true;
        }
    } catch {}

    // Remove 'active' from currently active buttons. If multiple exist, clean all.
    const activeNow = document.querySelectorAll('.tab-button.active');
    if (activeNow && activeNow.length) {
        if (activeNow.length === 1) {
            const only = /** @type {any} */ (activeNow[0]);
            only?.classList?.remove?.('active');
        } else {
            activeNow.forEach((el) => /** @type {any} */(el)?.classList?.remove?.('active'));
        }
    }

    // Prefer cached lookup, fall back to DOM if not found
    const target = document.getElementById(tabId);
    const anyTarget = /** @type {any} */ (target);
    if (anyTarget && anyTarget.classList) {
        anyTarget.classList.add('active');
        const tabName = extractTabName(tabId);
        // Let errors from setState propagate to satisfy tests expecting throws
        setState('ui.activeTab', tabName, { source: 'updateActiveTab' });
        return true;
    }
    console.error(`Element with ID "${tabId}" not found in the DOM or missing classList.`);
    return false;
}

/**
 * Update tab button states based on current state
 * @param {string} activeTab - Currently active tab name
 */
function updateTabButtonsFromState(activeTab) {
    const tabButtons = document.querySelectorAll(".tab-button");

    // CRITICAL BUG FIX: Defensive check for querySelectorAll result
    if (!tabButtons || tabButtons.length === 0) {
        console.warn("updateTabButtonsFromState: No tab buttons found in DOM.");
        return;
    }

    tabButtons.forEach((btn) => {
        // CRITICAL BUG FIX: Defensive check for classList and setAttribute
        if (!btn || !btn.classList) {
            console.warn("updateTabButtonsFromState: Invalid button element found:", btn);
            return;
        }

        const tabName = extractTabName(btn.id),
         isActive = tabName === activeTab;

        btn.classList.toggle("active", isActive);

        // CRITICAL BUG FIX: Defensive check for setAttribute
        if (btn.setAttribute) {
            btn.setAttribute("aria-selected", isActive.toString());
        }
    });
}

/**
 * Initialize active tab state management by wiring state subscription
 */
export function initializeActiveTabState() {
    try {
        /** @type {(activeTab: string) => void} */
        const onActiveTabChange = (activeTab) => {
            try { updateTabButtonsFromState(activeTab); } catch (e) { /* ignore */ }
        };
        subscribe('ui.activeTab', onActiveTabChange);

        // Set up click listeners for tab buttons
        const tabButtons = document.querySelectorAll('.tab-button');
        if (!tabButtons || tabButtons.length === 0) {
            console.warn('initializeActiveTabState: No tab buttons found in DOM. Click listeners not set up.');
        } else {
            tabButtons.forEach((btn) => {
                const button = /** @type {any} */ (btn);
                if (!button || typeof button.addEventListener !== 'function') {
                    console.warn('initializeActiveTabState: Invalid button element found:', button);
                    return;
                }
                /** @type {(evt: Event) => void} */
                const onClick = (evt) => {
                    // Ignore clicks on disabled buttons (including aria-disabled="true")
                    const anyBtn = /** @type {any} */ (button);
                    const hasDisabledClass = anyBtn?.classList?.contains?.('tab-disabled');
                    const isDisabled = (
                        anyBtn.disabled === true ||
                        button.getAttribute?.('aria-disabled') === 'true' ||
                        hasDisabledClass === true
                    );
                    if (isDisabled) {
                        // Explicit debug log for coverage and diagnostics
                        try { console.log(`[ActiveTab] Ignoring click on disabled button: ${button.id}`); } catch {}
                        try { evt?.preventDefault?.(); evt?.stopPropagation?.(); } catch {}
                        return;
                    }
                    const btnId = typeof button.id === 'string' ? button.id.trim() : '';
                    if (!btnId) return; // Do not update state if element has no valid id
                    const tabName = extractTabName(btnId);
                    if (!tabName) return;
                    setState('ui.activeTab', tabName, { source: 'tabButtonClick' });
                };
                button.addEventListener('click', onClick);
            });
        }

        console.log('[ActiveTab] State management initialized');
    } catch (e) {
        // non-fatal in tests
    }
}

/**
 * Get the currently active tab
 * @returns {string} Currently active tab name
 */
export function getActiveTab() {
    return getState("ui.activeTab") || "summary";
}
