/**
 * Creates chart status indicator from pre-calculated counts
 * @param {import('../core/getChartCounts.js').ChartCounts} counts - Pre-calculated chart counts
 */
export function createChartStatusIndicatorFromCounts(counts) {
    try {
        const indicator = document.createElement("div");
        indicator.className = "chart-status-indicator";
        indicator.id = "chart-status-indicator";

        // Calculate status
        const isAllVisible = counts.visible === counts.available,
            hasHiddenCharts = counts.available > counts.visible;

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

        // Status icon based on visibility
        const statusIcon = document.createElement("span");
        statusIcon.className = "status-icon";
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

        statusIcon.style.cssText = `
            font-size: 16px;
        `;

        // Main status text
        const statusText = document.createElement("span");
        statusText.className = "status-text";
        statusText.style.cssText = `
            color: var(--color-fg);
            font-weight: 600;
            font-size: 14px;
        `;

        if (counts.available === 0) {
            statusText.textContent = "No charts available";
            statusText.style.color = "var(--color-fg-muted)";
        } else {
            statusText.innerHTML = `
                <span style="color: ${isAllVisible ? "var(--color-success)" : hasHiddenCharts ? "var(--color-warning)" : "var(--color-error)"};">
                    ${counts.visible}
                </span>
                <span style="color: var(--color-fg-muted);"> / </span>
                <span style="color: var(--color-fg);">${counts.available}</span>
                <span style="color: var(--color-fg-muted);"> charts visible</span>
            `;
        } // Detailed breakdown (tooltip)
        const breakdown = document.createElement("div");
        breakdown.className = "status-breakdown";
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

        breakdown.innerHTML = `
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
            ${
                hasHiddenCharts
                    ? `
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--color-border); font-size: 11px; color: var(--color-warning);">
                    💡 Enable more charts in "Visible Metrics" below
                </div>
            `
                    : ""
            }
        `;

        // Make indicator interactive
        indicator.style.position = "relative";
        indicator.style.cursor = "pointer";
        indicator.addEventListener("mouseenter", () => {
            indicator.style.background = "var(--color-glass-border)";
            indicator.style.transform = "translateY(-1px)";

            // Position tooltip above the indicator
            const rect = indicator.getBoundingClientRect();
            breakdown.style.left = `${rect.left}px`;
            breakdown.style.top = `${rect.top - breakdown.offsetHeight - 8}px`;

            // Show tooltip
            breakdown.style.opacity = "1";
            breakdown.style.visibility = "visible";
        });

        indicator.addEventListener("mouseleave", () => {
            indicator.style.background = "var(--color-glass)";
            indicator.style.transform = "translateY(0)";
            breakdown.style.opacity = "0";
            breakdown.style.visibility = "hidden";
        });

        indicator.addEventListener("mousemove", () => {
            // Update position on mouse move to handle scrolling
            if (breakdown.style.visibility === "visible") {
                const rect = indicator.getBoundingClientRect();
                breakdown.style.left = `${rect.left}px`;
                breakdown.style.top = `${rect.top - breakdown.offsetHeight - 8}px`;
            }
        });

        // Click to scroll to field toggles
        indicator.addEventListener("click", () => {
            const fieldsSection = document.querySelector(".fields-section");
            if (fieldsSection instanceof HTMLElement) {
                fieldsSection.scrollIntoView({ behavior: "smooth", block: "start" });
                fieldsSection.style.outline = "2px solid var(--color-accent)";
                fieldsSection.style.outlineOffset = "4px";
                setTimeout(() => {
                    if (fieldsSection.style) {
                        fieldsSection.style.outline = "none";
                        fieldsSection.style.outlineOffset = "0";
                    }
                }, 2000);
            }
        });
        indicator.appendChild(statusIcon);
        indicator.appendChild(statusText);

        // Add tooltip to document body for proper positioning
        document.body.appendChild(breakdown);

        return indicator;
    } catch (error) {
        console.error("[ChartStatus] Error creating chart status indicator from counts:", error);
        // Return a minimal fallback element
        const fallback = document.createElement("div");
        fallback.className = "chart-status-indicator";
        fallback.id = "chart-status-indicator";
        fallback.textContent = "Chart status unavailable";
        return fallback;
    }
}
