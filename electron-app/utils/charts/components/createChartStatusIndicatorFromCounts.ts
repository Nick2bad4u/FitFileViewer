import type {
    ChartCategoryCounts,
    ChartCounts,
} from "../core/getChartCounts.js";
import {
    type ChartStatusIndicatorRuntime,
    type ChartStatusIndicatorTimerHandle,
    getChartStatusIndicatorRuntime,
} from "./chartStatusIndicatorRuntime.js";

const BREAKDOWN_ID = "chart-status-indicator-breakdown";
const indicatorCleanupCallbacks = new WeakMap<HTMLElement, () => void>();

interface StatusPresentation {
    readonly icon: string;
    readonly title: string;
    readonly valueColor: string;
}

function getStatusPresentation(
    counts: ChartCounts,
    hasHiddenCharts: boolean,
    isAllVisible: boolean
): StatusPresentation {
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

function createStyledSpan(
    text: string,
    color: string,
    runtime: ChartStatusIndicatorRuntime
): HTMLSpanElement {
    const span = runtime.createElement("span");
    span.textContent = text;
    span.style.color = color;
    return span;
}

function appendStatusText(
    statusText: HTMLSpanElement,
    counts: ChartCounts,
    valueColor: string,
    runtime: ChartStatusIndicatorRuntime
): void {
    if (counts.available === 0) {
        statusText.textContent = "No charts available";
        statusText.style.color = "var(--color-fg-muted)";
        return;
    }

    statusText.append(
        createStyledSpan(String(counts.visible), valueColor, runtime),
        createStyledSpan(" / ", "var(--color-fg-muted)", runtime),
        createStyledSpan(String(counts.available), "var(--color-fg)", runtime),
        createStyledSpan(" charts visible", "var(--color-fg-muted)", runtime)
    );
}

function createCategoryRow(
    icon: string,
    label: string,
    counts: ChartCategoryCounts,
    runtime: ChartStatusIndicatorRuntime
): HTMLDivElement {
    const row = runtime.createElement("div");
    row.style.color = "var(--color-fg)";
    row.textContent = `${icon} ${label}: ${counts.visible}/${counts.available}`;
    return row;
}

function createBreakdown(
    counts: ChartCounts,
    hasHiddenCharts: boolean,
    runtime: ChartStatusIndicatorRuntime
): HTMLDivElement {
    const breakdown = runtime.createElement("div");
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

    const title = runtime.createElement("div");
    title.textContent = "Chart Categories";
    title.style.cssText = `
        font-size: 12px;
        color: var(--color-fg-alt);
        font-weight: 600;
        margin-bottom: 8px;
    `;

    const grid = runtime.createElement("div");
    grid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        font-size: 11px;
    `;
    grid.append(
        createCategoryRow("📊", "Metrics", counts.categories.metrics, runtime),
        createCategoryRow(
            "📈",
            "Analysis",
            counts.categories.analysis,
            runtime
        ),
        createCategoryRow("🎯", "Zones", counts.categories.zones, runtime),
        createCategoryRow("🗺️", "GPS", counts.categories.gps, runtime)
    );

    breakdown.append(title, grid);

    if (hasHiddenCharts) {
        const hint = runtime.createElement("div");
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

function removeExistingBreakdown(runtime: ChartStatusIndicatorRuntime): void {
    runtime.querySelector(`#${BREAKDOWN_ID}`)?.remove();
}

function positionBreakdown(
    breakdown: HTMLElement,
    event: MouseEvent,
    runtime: ChartStatusIndicatorRuntime
): void {
    const padding = 12;
    const offsetX = 12;
    const offsetY = 16;
    const { height: viewportHeight, width: viewportWidth } =
        runtime.getViewport();

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
 * Clean up event listeners and detached tooltip state for a generated chart
 * status indicator.
 *
 * @param indicator - Indicator element returned from
 *   createChartStatusIndicatorFromCounts.
 */
export function cleanupChartStatusIndicatorFromCounts(
    indicator: HTMLElement
): void {
    indicatorCleanupCallbacks.get(indicator)?.();
    indicatorCleanupCallbacks.delete(indicator);
}

/**
 * Creates a chart status indicator element from precomputed chart counts.
 *
 * @param counts - Precomputed chart visibility and availability counts.
 *
 * @returns The chart status indicator element.
 */
export function createChartStatusIndicatorFromCounts(
    counts: ChartCounts
): HTMLElement | null {
    try {
        const runtime = getChartStatusIndicatorRuntime();
        const indicator = runtime.createElement("div");
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
        const isAllVisible =
            counts.available > 0 && counts.visible === counts.available;
        const presentation = getStatusPresentation(
            counts,
            hasHiddenCharts,
            isAllVisible
        );

        const statusIcon = runtime.createElement("span");
        statusIcon.className = "status-icon";
        statusIcon.textContent = presentation.icon;
        statusIcon.title = presentation.title;
        statusIcon.style.fontSize = "16px";

        const statusText = runtime.createElement("span");
        statusText.className = "status-text";
        statusText.style.cssText = `
            color: var(--color-fg);
            font-weight: 600;
            font-size: 14px;
        `;
        appendStatusText(statusText, counts, presentation.valueColor, runtime);

        removeExistingBreakdown(runtime);
        const breakdown = createBreakdown(counts, hasHiddenCharts, runtime);

        indicator.style.position = "relative";
        indicator.style.cursor = "pointer";

        const controller = runtime.createAbortController();
        const { signal } = controller;
        const highlightTimers = new Set<ChartStatusIndicatorTimerHandle>();

        const cleanup = (): void => {
            controller.abort();
            for (const timer of highlightTimers) {
                runtime.clearTimeout(timer);
            }
            highlightTimers.clear();
            breakdown.remove();
        };
        indicatorCleanupCallbacks.set(indicator, cleanup);

        indicator.addEventListener(
            "mouseenter",
            (event) => {
                indicator.style.background = "var(--color-glass-border)";
                indicator.style.transform = "translateY(-1px)";
                positionBreakdown(breakdown, event, runtime);
                breakdown.style.opacity = "1";
                breakdown.style.visibility = "visible";
            },
            { signal }
        );

        indicator.addEventListener(
            "mouseleave",
            () => {
                indicator.style.background = "var(--color-glass)";
                indicator.style.transform = "translateY(0)";
                breakdown.style.opacity = "0";
                breakdown.style.visibility = "hidden";
            },
            { signal }
        );

        indicator.addEventListener(
            "mousemove",
            (event) => {
                if (breakdown.style.visibility === "visible") {
                    positionBreakdown(breakdown, event, runtime);
                }
            },
            { signal }
        );

        indicator.addEventListener(
            "click",
            () => {
                const fieldsSection = runtime.querySelector(".fields-section");
                if (!fieldsSection) {
                    return;
                }

                fieldsSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
                fieldsSection.style.outline = "2px solid var(--color-accent)";
                fieldsSection.style.outlineOffset = "4px";

                const timerRef: { id?: ChartStatusIndicatorTimerHandle } = {};
                const runState = { didRun: false };
                timerRef.id = runtime.setTimeout(() => {
                    runState.didRun = true;
                    if (timerRef.id !== undefined) {
                        highlightTimers.delete(timerRef.id);
                    }
                    fieldsSection.style.outline = "none";
                    fieldsSection.style.outlineOffset = "0";
                }, 2000);

                if (!runState.didRun) {
                    highlightTimers.add(timerRef.id);
                }
            },
            { signal }
        );

        indicator.append(statusIcon, statusText);
        runtime.getBody().append(breakdown);

        return indicator;
    } catch (error) {
        console.error(
            "[ChartStatus] Error creating chart status indicator from counts:",
            error
        );

        const fallback = getChartStatusIndicatorRuntime().createElement("div");
        fallback.className = "chart-status-indicator";
        fallback.id = "chart-status-indicator";
        fallback.textContent = "Chart status unavailable";
        return fallback;
    }
}
