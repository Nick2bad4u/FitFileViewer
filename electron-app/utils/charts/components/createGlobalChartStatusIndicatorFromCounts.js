import {
    getChartContentContainer,
    getChartControlsToggle,
    getChartSettingsWrapper,
} from "../dom/chartDomUtils.js";
const globalIndicatorCleanupCallbacks = new WeakMap();
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
function createCategoryRow(icon, label, counts) {
    const row = document.createElement("div");
    row.style.color = "var(--color-fg)";
    row.textContent = `${icon} ${label}: ${counts.visible}/${counts.available}`;
    return row;
}
function appendStatusText(statusText, counts, valueColor) {
    if (counts.available === 0) {
        statusText.textContent = "No chart data available in this FIT file";
        statusText.style.color = "var(--color-fg-muted)";
        return;
    }
    const countSpan = document.createElement("span");
    countSpan.style.color = valueColor;
    countSpan.textContent = String(counts.visible);
    statusText.append(
        document.createTextNode("Showing "),
        countSpan,
        document.createTextNode(` of ${counts.available} available charts`)
    );
    statusText.style.color = "var(--color-fg)";
}
function createQuickAction(counts, hasHiddenCharts, isAllVisible) {
    const quickAction = document.createElement("button");
    quickAction.style.cssText = `
        padding: 4px 8px;
        border: 1px solid var(--color-border);
        border-radius: 6px;
        background: var(--color-btn-bg);
        color: var(--color-fg-alt);
        font-size: 12px;
        cursor: pointer;
        transition: var(--transition-smooth);
    `;
    quickAction.dataset["actionable"] = hasHiddenCharts ? "true" : "false";
    if (hasHiddenCharts) {
        quickAction.textContent = "⚙️ Show Settings";
        quickAction.title = "Open chart settings to enable more charts";
        return quickAction;
    }
    if (isAllVisible && counts.available > 0) {
        quickAction.textContent = "✨ Charts Ready";
        quickAction.title = "All available charts are visible";
    } else {
        quickAction.textContent = "📂 Load FIT";
        quickAction.title = "Load a FIT file to see charts";
    }
    quickAction.style.opacity = "0.7";
    quickAction.style.cursor = "default";
    return quickAction;
}
function createBreakdown(counts, hasHiddenCharts) {
    const globalBreakdown = document.createElement("div");
    globalBreakdown.className = "status-breakdown global-breakdown";
    globalBreakdown.style.cssText = `
        position: absolute;
        top: 100%;
        left: 50%;
        right: 0;
        background: var(--color-modal-bg);
        border: 1px solid var(--color-border);
        border-radius: 8px;
        padding: 12px;
        margin-top: 4px;
        box-shadow: var(--color-box-shadow);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 999999;
        backdrop-filter: var(--backdrop-blur);
        pointer-events: none;
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
    grid.append(
        createCategoryRow("📊", "Metrics", counts.categories.metrics),
        createCategoryRow("📈", "Analysis", counts.categories.analysis),
        createCategoryRow("🎯", "Zones", counts.categories.zones),
        createCategoryRow("🗺️", "GPS", counts.categories.gps)
    );
    globalBreakdown.append(title, grid);
    if (hasHiddenCharts) {
        const hint = document.createElement("div");
        hint.textContent = "💡 Use settings panel below to enable more charts";
        hint.style.cssText = `
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid var(--color-border);
            font-size: 11px;
            color: var(--color-warning);
        `;
        globalBreakdown.append(hint);
    }
    return globalBreakdown;
}
function scheduleFieldSectionScroll(fieldsSection, pendingTimers) {
    const timerRef = {};
    let didRun = false;
    timerRef.id = setTimeout(() => {
        didRun = true;
        if (timerRef.id !== undefined) {
            pendingTimers.delete(timerRef.id);
        }
        fieldsSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    }, 100);
    if (!didRun) {
        pendingTimers.add(timerRef.id);
    }
}
/**
 * Clean up event listeners and delayed work for a global status indicator.
 *
 * @param indicator - Indicator returned from
 *   createGlobalChartStatusIndicatorFromCounts.
 */
export function cleanupGlobalChartStatusIndicatorFromCounts(indicator) {
    globalIndicatorCleanupCallbacks.get(indicator)?.();
    globalIndicatorCleanupCallbacks.delete(indicator);
}
/**
 * Creates a global chart status indicator element from precomputed chart
 * counts.
 *
 * @param counts - Precomputed chart visibility and availability counts.
 *
 * @returns The global chart status indicator element, or null when chart
 *   content is unavailable.
 */
export function createGlobalChartStatusIndicatorFromCounts(counts) {
    try {
        const chartTabContent = getChartContentContainer(document);
        if (!chartTabContent) {
            console.warn("[ChartStatus] Chart tab content not found");
            return null;
        }
        const globalIndicator = document.createElement("div");
        globalIndicator.id = "global-chart-status";
        globalIndicator.className = "global-chart-status";
        globalIndicator.style.cssText = `
            position: sticky;
            top: 0;
            z-index: 100;
            background: var(--color-bg-alt);
            border-bottom: 1px solid var(--color-border);
            padding: 8px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            backdrop-filter: var(--backdrop-blur);
            margin-bottom: 16px;
            border-radius: 8px 8px 0 0;
            box-shadow: 0 2px 4px var(--color-shadow);
        `;
        const hasHiddenCharts = counts.available > counts.visible;
        const isAllVisible =
            counts.available > 0 && counts.visible === counts.available;
        const presentation = getStatusPresentation(
            counts,
            hasHiddenCharts,
            isAllVisible
        );
        const statusInfo = document.createElement("div");
        statusInfo.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
        `;
        const statusIcon = document.createElement("span");
        statusIcon.style.fontSize = "18px";
        statusIcon.textContent = presentation.icon;
        statusIcon.title = presentation.title;
        const statusText = document.createElement("span");
        statusText.style.cssText = `
            font-weight: 600;
            font-size: 14px;
        `;
        appendStatusText(statusText, counts, presentation.valueColor);
        const quickAction = createQuickAction(
            counts,
            hasHiddenCharts,
            isAllVisible
        );
        const globalBreakdown = createBreakdown(counts, hasHiddenCharts);
        const controller = new AbortController();
        const { signal } = controller;
        const pendingTimers = new Set();
        globalIndicatorCleanupCallbacks.set(globalIndicator, () => {
            controller.abort();
            for (const timer of pendingTimers) {
                clearTimeout(timer);
            }
            pendingTimers.clear();
        });
        if (hasHiddenCharts) {
            quickAction.addEventListener(
                "click",
                () => {
                    const toggleButton = getChartControlsToggle(document);
                    const wrapper = getChartSettingsWrapper(document);
                    if (
                        !(wrapper instanceof HTMLElement) ||
                        !(toggleButton instanceof HTMLElement)
                    ) {
                        return;
                    }
                    wrapper.style.display = "block";
                    toggleButton.textContent = "▼ Hide Controls";
                    toggleButton.setAttribute("aria-expanded", "true");
                    const fieldsSection =
                        document.querySelector(".fields-section");
                    if (fieldsSection instanceof HTMLElement) {
                        scheduleFieldSectionScroll(
                            fieldsSection,
                            pendingTimers
                        );
                    }
                },
                { signal }
            );
            quickAction.addEventListener(
                "mouseenter",
                () => {
                    quickAction.style.background = "var(--color-accent-hover)";
                    quickAction.style.transform = "translateY(-1px)";
                },
                { signal }
            );
            quickAction.addEventListener(
                "mouseleave",
                () => {
                    quickAction.style.background = "var(--color-btn-bg)";
                    quickAction.style.transform = "translateY(0)";
                },
                { signal }
            );
        }
        const showBreakdown = () => {
            globalIndicator.style.background = "var(--color-glass-border)";
            globalIndicator.style.transform = "translateY(-1px)";
            globalBreakdown.style.opacity = "1";
            globalBreakdown.style.visibility = "visible";
        };
        const hideBreakdown = () => {
            globalIndicator.style.background = "var(--color-bg-alt)";
            globalIndicator.style.transform = "translateY(0)";
            globalBreakdown.style.opacity = "0";
            globalBreakdown.style.visibility = "hidden";
        };
        quickAction.addEventListener("mouseenter", showBreakdown, { signal });
        quickAction.addEventListener("mouseleave", hideBreakdown, { signal });
        globalIndicator.style.cursor = "default";
        statusInfo.append(statusIcon, statusText);
        globalIndicator.append(statusInfo, quickAction, globalBreakdown);
        return globalIndicator;
    } catch (error) {
        console.error(
            "[ChartStatus] Error creating global chart status indicator from counts:",
            error
        );
        return null;
    }
}
