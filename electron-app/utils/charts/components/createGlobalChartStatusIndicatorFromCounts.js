/**
 * Creates global chart status indicator from pre-calculated counts
 * @param {import('../core/getChartCounts.js').ChartCounts} counts - Pre-calculated chart counts
 */
export function createGlobalChartStatusIndicatorFromCounts(counts) {
    try {
        const chartTabContent = document.querySelector("#content-chartjs");
        if (!chartTabContent) {
            console.warn("[ChartStatus] Chart tab content not found");
            return null;
        }

        const globalIndicator = document.createElement("div");
        globalIndicator.id = "global-chart-status";
        globalIndicator.className = "global-chart-status";

        // Calculate status
        const hasHiddenCharts = counts.available > counts.visible,
            isAllVisible = counts.visible === counts.available;

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

        // Left side - status info
        const statusInfo = document.createElement("div");
        statusInfo.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
        `;

        // Status icon
        const statusIcon = document.createElement("span");
        statusIcon.style.fontSize = "18px";
        if (isAllVisible) {
            statusIcon.textContent = "✅";
            statusIcon.title = "All available charts are visible";
        } else if (hasHiddenCharts) {
            statusIcon.textContent = "⚠️";
            statusIcon.title = "Some charts are hidden";
        } else {
            statusIcon.textContent = "❌";
            statusIcon.title = "No charts are visible";
        }

        // Status text
        const statusText = document.createElement("span");
        statusText.style.cssText = `
            font-weight: 600;
            font-size: 14px;
        `;

        if (counts.available === 0) {
            statusText.textContent = "No chart data available in this FIT file";
            statusText.style.color = "var(--color-fg-muted)";
        } else {
            statusText.innerHTML = `
                Showing
                <span style="color: ${isAllVisible ? "var(--color-success)" : hasHiddenCharts ? "var(--color-warning)" : "var(--color-error)"};">
                    ${counts.visible}
                </span>
                of ${counts.available} available charts
            `;
            statusText.style.color = "var(--color-fg)";
        }

        // Right side - quick action
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

        if (hasHiddenCharts) {
            quickAction.textContent = "⚙️ Show Settings";
            quickAction.title = "Open chart settings to enable more charts";
            quickAction.addEventListener("click", () => {
                const toggleBtn = document.querySelector("#chart-controls-toggle"),
                    wrapper = document.querySelector("#chartjs-settings-wrapper");
                if (wrapper instanceof HTMLElement && toggleBtn instanceof HTMLElement) {
                    wrapper.style.display = "block";
                    toggleBtn.textContent = "▼ Hide Controls";
                    toggleBtn.setAttribute("aria-expanded", "true");
                    const fieldsSection = document.querySelector(".fields-section");
                    if (fieldsSection instanceof HTMLElement) {
                        setTimeout(() => {
                            fieldsSection.scrollIntoView({ behavior: "smooth", block: "start" });
                        }, 100);
                    }
                }
            });
        } else if (isAllVisible && counts.available > 0) {
            quickAction.textContent = "✨ All Set";
            quickAction.title = "All available charts are visible";
            quickAction.style.opacity = "0.7";
            quickAction.style.cursor = "default";
        } else {
            quickAction.textContent = "📂 Load FIT";
            quickAction.title = "Load a FIT file to see charts";
            quickAction.style.opacity = "0.7";
            quickAction.style.cursor = "default";
        }

        // Hover effects for actionable button
        if (hasHiddenCharts) {
            quickAction.addEventListener("mouseenter", () => {
                quickAction.style.background = "var(--color-accent-hover)";
                quickAction.style.transform = "translateY(-1px)";
            });

            quickAction.addEventListener("mouseleave", () => {
                quickAction.style.background = "var(--color-btn-bg)";
                quickAction.style.transform = "translateY(0)";
            });
        }
        statusInfo.append(statusIcon);
        statusInfo.append(statusText);
        globalIndicator.append(statusInfo);
        globalIndicator.append(quickAction);

        // Add detailed breakdown tooltip for global indicator too
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
        `;

        globalBreakdown.innerHTML = `
            <div style="font-size: 12px; color: var(--color-fg-alt); font-weight: 600; margin-bottom: 8px;">
                Chart Categories
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 11px;">
                <div style="color: var(--color-fg);">
                    📊 Metrics: ${counts.categories.metrics.visible}/${counts.categories.metrics.available}
                </div>
                <div style="color: var(--color-fg);">
                    📈 Analysis: ${counts.categories.analysis.visible}/${counts.categories.analysis.available}
                </div>
                <div style="color: var(--color-fg);">
                    🎯 Zones: ${counts.categories.zones.visible}/${counts.categories.zones.available}
                </div>
                <div style="color: var(--color-fg);">
                    🗺️ GPS: ${counts.categories.gps.visible}/${counts.categories.gps.available}
                </div>
            </div>
            ${hasHiddenCharts
                ? `
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--color-border); font-size: 11px; color: var(--color-warning);">
                    💡 Use settings panel below to enable more charts
                </div>
            `
                : ""
            }
        `;

        // Make global indicator interactive with hover
        globalIndicator.style.position = "relative";
        globalIndicator.style.cursor = "pointer";

        globalIndicator.addEventListener("mouseenter", () => {
            globalIndicator.style.background = "var(--color-glass-border)";
            globalIndicator.style.transform = "translateY(-1px)";
            globalBreakdown.style.opacity = "1";
            globalBreakdown.style.visibility = "visible";
        });

        globalIndicator.addEventListener("mouseleave", () => {
            globalIndicator.style.background = "var(--color-bg-alt)";
            globalIndicator.style.transform = "translateY(0)";
            globalBreakdown.style.opacity = "0";
            globalBreakdown.style.visibility = "hidden";
        });

        globalIndicator.append(globalBreakdown);

        return globalIndicator;
    } catch (error) {
        console.error("[ChartStatus] Error creating global chart status indicator from counts:", error);
        return null;
    }
}
