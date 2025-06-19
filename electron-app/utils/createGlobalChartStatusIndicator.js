import { getChartCounts } from "./getChartCounts.js";

/**
 * Creates a persistent global chart status indicator that's always visible
 * at the top of the chart tab, regardless of settings panel visibility
 */

export function createGlobalChartStatusIndicator() {
    try {
        const chartTabContent = document.getElementById("content-chartjs");
        if (!chartTabContent) {
            console.warn("[ChartStatus] Chart tab content not found");
            return;
        }

        // Check if global indicator already exists
        let globalIndicator = document.getElementById("global-chart-status");
        if (globalIndicator) {
            return globalIndicator;
        }

        const counts = getChartCounts();

        globalIndicator = document.createElement("div");
        globalIndicator.id = "global-chart-status";
        globalIndicator.className = "global-chart-status";

        // Calculate status
        const isAllVisible = counts.visible === counts.available;
        const hasHiddenCharts = counts.available > counts.visible;

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
                // Show the settings panel
                const wrapper = document.getElementById("chartjs-settings-wrapper");
                const toggleBtn = document.getElementById("chart-controls-toggle");
                if (wrapper && toggleBtn) {
                    wrapper.style.display = "block";
                    toggleBtn.textContent = "▼ Hide Controls";
                    toggleBtn.setAttribute("aria-expanded", "true");

                    // Scroll to field toggles
                    const fieldsSection = document.querySelector(".fields-section");
                    if (fieldsSection) {
                        setTimeout(function () {
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
        statusInfo.appendChild(statusIcon);
        statusInfo.appendChild(statusText);
        globalIndicator.appendChild(statusInfo);
        globalIndicator.appendChild(quickAction);

        // Insert at the top of the chart tab content
        const chartContainer = document.getElementById("chartjs-chart-container");
        if (chartContainer) {
            chartTabContent.insertBefore(globalIndicator, chartContainer);
        } else {
            chartTabContent.appendChild(globalIndicator);
        }

        return globalIndicator;
    } catch (error) {
        console.error("[ChartStatus] Error creating global chart status indicator:", error);
        return null;
    }
}
