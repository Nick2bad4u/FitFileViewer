const BREAKDOWN_ID = "chart-status-indicator-breakdown";
const indicatorCleanupCallbacks = new WeakMap();
function getStatusPresentation(counts, hasHiddenCharts, isAllVisible) {
    if (isAllVisible) {
        return {
            icon: "✅",
            title: "All available charts are visible",
            valueColor: "var(--color-success)",
        };
    }
    if (hasHiddenCharts) {
        return {
            icon: "⚠️",
            title: "Some charts are hidden",
            valueColor: "var(--color-warning)",
        };
    }
    return counts.available === 0
        ? {
            icon: "❌",
            title: "No charts are available",
            valueColor: "var(--color-error)",
        }
        : {
            icon: "❌",
            title: "No charts are visible",
            valueColor: "var(--color-error)",
        };
}
function createStyledSpan(text, color) {
    const span = document.createElement("span");
    span.textContent = text;
    span.style.color = color;
    return span;
}
function appendStatusText(statusText, counts, valueColor) {
    if (counts.available === 0) {
        statusText.textContent = "No charts available";
        statusText.style.color = "var(--color-fg-muted)";
        return;
    }
    statusText.append(createStyledSpan(String(counts.visible), valueColor), createStyledSpan(" / ", "var(--color-fg-muted)"), createStyledSpan(String(counts.available), "var(--color-fg)"), createStyledSpan(" charts visible", "var(--color-fg-muted)"));
}
function createCategoryRow(icon, label, counts) {
    const row = document.createElement("div");
    row.style.color = "var(--color-fg)";
    row.textContent = `${icon} ${label}: ${counts.visible}/${counts.available}`;
    return row;
}
function createBreakdown(counts, hasHiddenCharts) {
    const breakdown = document.createElement("div");
    breakdown.className = "status-breakdown";
    breakdown.id = BREAKDOWN_ID;
    breakdown.style.cssText = `
        position: fixed;
        background: var(--color-modal-bg);
        border: 1px solid var(--color-border);
        border-radius: 8px;
        padding: 12px;
        box-shadow: var(--color-box-shadow);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 999999;
        backdrop-filter: var(--backdrop-blur);
        pointer-events: none;
        max-width: 250px;
    `;
    const title = document.createElement("div");
    title.textContent = "Chart Categories";
    title.style.cssText = `
        font-size: 12px;
        color: var(--color-fg-alt);
        font-weight: 600;
        margin-bottom: 8px;
    `;
    const grid = document.createElement("div");
    grid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        font-size: 11px;
    `;
    grid.append(createCategoryRow("📊", "Metrics", counts.categories.metrics), createCategoryRow("📈", "Analysis", counts.categories.analysis), createCategoryRow("🎯", "Zones", counts.categories.zones), createCategoryRow("🗺️", "GPS", counts.categories.gps));
    breakdown.append(title, grid);
    if (hasHiddenCharts) {
        const hint = document.createElement("div");
        hint.textContent = '💡 Enable more charts in "Visible Metrics" below';
        hint.style.cssText = `
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid var(--color-border);
            font-size: 11px;
            color: var(--color-warning);
        `;
        breakdown.append(hint);
    }
    return breakdown;
}
function removeExistingBreakdown() {
    document.getElementById(BREAKDOWN_ID)?.remove();
}
function positionBreakdown(breakdown, event) {
    const padding = 12;
    const offsetX = 12;
    const offsetY = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let x = event.clientX + offsetX;
    let y = event.clientY + offsetY;
    const width = breakdown.offsetWidth;
    const height = breakdown.offsetHeight;
    if (x + width + padding > viewportWidth) {
        x = Math.max(padding, viewportWidth - width - padding);
    }
    if (y + height + padding > viewportHeight) {
        y = Math.max(padding, event.clientY - height - offsetY);
    }
    breakdown.style.left = `${x}px`;
    breakdown.style.top = `${y}px`;
}
/**
 * Clean up event listeners and detached tooltip state for a generated chart status indicator.
 *
 * @param indicator - Indicator element returned from createChartStatusIndicatorFromCounts.
 */
export function cleanupChartStatusIndicatorFromCounts(indicator) {
    indicatorCleanupCallbacks.get(indicator)?.();
    indicatorCleanupCallbacks.delete(indicator);
}
/**
 * Creates a chart status indicator element from precomputed chart counts.
 *
 * @param counts - Precomputed chart visibility and availability counts.
 * @returns The chart status indicator element.
 */
export function createChartStatusIndicatorFromCounts(counts) {
    try {
        const indicator = document.createElement("div");
        indicator.className = "chart-status-indicator";
        indicator.id = "chart-status-indicator";
        indicator.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px 16px;
            background: var(--color-glass);
            border-radius: 12px;
            border: 1px solid var(--color-border);
            backdrop-filter: var(--backdrop-blur);
            transition: var(--transition-smooth);
            min-width: 200px;
        `;
        const hasHiddenCharts = counts.available > counts.visible;
        const isAllVisible = counts.available > 0 && counts.visible === counts.available;
        const presentation = getStatusPresentation(counts, hasHiddenCharts, isAllVisible);
        const statusIcon = document.createElement("span");
        statusIcon.className = "status-icon";
        statusIcon.textContent = presentation.icon;
        statusIcon.title = presentation.title;
        statusIcon.style.fontSize = "16px";
        const statusText = document.createElement("span");
        statusText.className = "status-text";
        statusText.style.cssText = `
            color: var(--color-fg);
            font-weight: 600;
            font-size: 14px;
        `;
        appendStatusText(statusText, counts, presentation.valueColor);
        removeExistingBreakdown();
        const breakdown = createBreakdown(counts, hasHiddenCharts);
        indicator.style.position = "relative";
        indicator.style.cursor = "pointer";
        const controller = new AbortController();
        const { signal } = controller;
        const highlightTimers = new Set();
        const cleanup = () => {
            controller.abort();
            for (const timer of highlightTimers) {
                clearTimeout(timer);
            }
            highlightTimers.clear();
            breakdown.remove();
        };
        indicatorCleanupCallbacks.set(indicator, cleanup);
        indicator.addEventListener("mouseenter", (event) => {
            indicator.style.background = "var(--color-glass-border)";
            indicator.style.transform = "translateY(-1px)";
            positionBreakdown(breakdown, event);
            breakdown.style.opacity = "1";
            breakdown.style.visibility = "visible";
        }, { signal });
        indicator.addEventListener("mouseleave", () => {
            indicator.style.background = "var(--color-glass)";
            indicator.style.transform = "translateY(0)";
            breakdown.style.opacity = "0";
            breakdown.style.visibility = "hidden";
        }, { signal });
        indicator.addEventListener("mousemove", (event) => {
            if (breakdown.style.visibility === "visible") {
                positionBreakdown(breakdown, event);
            }
        }, { signal });
        indicator.addEventListener("click", () => {
            const fieldsSection = document.querySelector(".fields-section");
            if (!(fieldsSection instanceof HTMLElement)) {
                return;
            }
            fieldsSection.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
            fieldsSection.style.outline = "2px solid var(--color-accent)";
            fieldsSection.style.outlineOffset = "4px";
            const timerRef = {};
            let didRun = false;
            timerRef.id = setTimeout(() => {
                didRun = true;
                if (timerRef.id !== undefined) {
                    highlightTimers.delete(timerRef.id);
                }
                fieldsSection.style.outline = "none";
                fieldsSection.style.outlineOffset = "0";
            }, 2000);
            if (!didRun) {
                highlightTimers.add(timerRef.id);
            }
        }, { signal });
        indicator.append(statusIcon, statusText);
        document.body.append(breakdown);
        return indicator;
    }
    catch (error) {
        console.error("[ChartStatus] Error creating chart status indicator from counts:", error);
        const fallback = document.createElement("div");
        fallback.className = "chart-status-indicator";
        fallback.id = "chart-status-indicator";
        fallback.textContent = "Chart status unavailable";
        return fallback;
    }
}
