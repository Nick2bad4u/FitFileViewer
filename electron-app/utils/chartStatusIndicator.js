/**
 * @fileoverview Chart Status Indicator utility for showing chart visibility statistics
 * @description Provides a visual indicator showing how many charts are currently visible
 * out of the total available charts, helping users understand their chart selection status
 */

import { chartFields } from "./chartFields.js";

/**
 * Gets the count of available chart types based on current data
 * @returns {Object} Object containing total available and currently visible counts
 */
export function getChartCounts() {
    const counts = {
        total: 0,
        visible: 0,
        available: 0,
        categories: {
            metrics: { total: 0, visible: 0, available: 0 },
            analysis: { total: 0, visible: 0, available: 0 },
            zones: { total: 0, visible: 0, available: 0 },
            gps: { total: 0, visible: 0, available: 0 },
        },
    };

    // Check if we have data
    const hasData = window.globalData && window.globalData.recordMesgs && window.globalData.recordMesgs.length > 0;
    if (!hasData) {
        return counts;
    }

    const data = window.globalData.recordMesgs;

    try {
        // Basic metric fields
        chartFields.forEach((field) => {
            counts.total++;
            counts.categories.metrics.total++;

            // Check if this field has valid numeric data (same logic as renderChartJS)
            const numericData = data.map((row) => {
                if (row[field] !== undefined && row[field] !== null) {
                    const value = parseFloat(row[field]);
                    return isNaN(value) ? null : value;
                }
                return null;
            });

            // Only count as available if there's at least one valid data point
            const hasValidData = !numericData.every((val) => val === null);
            if (hasValidData) {
                counts.available++;
                counts.categories.metrics.available++;

                // Check visibility
                const visibility = localStorage.getItem(`chartjs_field_${field}`);
                if (visibility !== "hidden") {
                    counts.visible++;
                    counts.categories.metrics.visible++;
                }
            }
        }); // GPS track chart (counted separately from lat/long individual charts)
        const hasGPSData = data.some((row) => {
            const lat = row.positionLat;
            const long = row.positionLong;
            return (
                (lat !== undefined && lat !== null && !isNaN(parseFloat(lat))) ||
                (long !== undefined && long !== null && !isNaN(parseFloat(long)))
            );
        }); // Add GPS track chart in addition to individual lat/long charts
        // (Both are rendered in the current implementation)
        if (hasGPSData) {
            counts.total++;
            counts.available++;
            counts.categories.gps.total++;
            counts.categories.gps.available++;

            const gpsVisibility = localStorage.getItem("chartjs_field_gps_track");
            if (gpsVisibility !== "hidden") {
                counts.visible++;
                counts.categories.gps.visible++;
            }
        } // Performance analysis charts
        const analysisCharts = ["speed_vs_distance", "power_vs_hr", "altitude_profile"];
        analysisCharts.forEach((chartType) => {
            counts.total++;
            counts.categories.analysis.total++; // Check if required fields exist and have valid data for each analysis chart
            let hasRequiredData = false;
            switch (chartType) {
                case "speed_vs_distance": {
                    const hasSpeed = data.some((row) => {
                        const speed = row.enhancedSpeed || row.speed;
                        return speed !== undefined && speed !== null && !isNaN(parseFloat(speed));
                    });
                    const hasDistance = data.some((row) => {
                        const distance = row.distance;
                        return distance !== undefined && distance !== null && !isNaN(parseFloat(distance));
                    });
                    hasRequiredData = hasSpeed && hasDistance;
                    break;
                }
                case "power_vs_hr": {
                    const hasPower = data.some((row) => {
                        const power = row.power;
                        return power !== undefined && power !== null && !isNaN(parseFloat(power));
                    });
                    const hasHeartRate = data.some((row) => {
                        const hr = row.heartRate;
                        return hr !== undefined && hr !== null && !isNaN(parseFloat(hr));
                    });
                    hasRequiredData = hasPower && hasHeartRate;
                    break;
                }
                case "altitude_profile": {
                    hasRequiredData = data.some((row) => {
                        const altitude = row.altitude || row.enhancedAltitude;
                        return altitude !== undefined && altitude !== null && !isNaN(parseFloat(altitude));
                    });
                    break;
                }
            }

            if (hasRequiredData) {
                counts.available++;
                counts.categories.analysis.available++;

                const visibility = localStorage.getItem(`chartjs_field_${chartType}`);
                if (visibility !== "hidden") {
                    counts.visible++;
                    counts.categories.analysis.visible++;
                }
            }
        }); // Zone charts (these are field-based toggles for doughnut charts only)
        const zoneCharts = ["hr_zone_doughnut", "power_zone_doughnut"];
        zoneCharts.forEach((chartType) => {
            counts.total++;
            counts.categories.zones.total++;

            // Check if required data exists for zone charts with valid numeric values
            let hasRequiredData = false;
            if (chartType.includes("hr_zone")) {
                hasRequiredData = data.some((row) => {
                    const hr = row.heartRate;
                    return hr !== undefined && hr !== null && !isNaN(parseFloat(hr));
                });
            } else if (chartType.includes("power_zone")) {
                hasRequiredData = data.some((row) => {
                    const power = row.power;
                    return power !== undefined && power !== null && !isNaN(parseFloat(power));
                });
            }

            if (hasRequiredData) {
                counts.available++;
                counts.categories.zones.available++;

                const visibility = localStorage.getItem(`chartjs_field_${chartType}`);
                if (visibility !== "hidden") {
                    counts.visible++;
                    counts.categories.zones.visible++;
                }
            }
        }); // Event messages chart
        if (
            window.globalData?.eventMesgs &&
            Array.isArray(window.globalData.eventMesgs) &&
            window.globalData.eventMesgs.length > 0
        ) {
            counts.total++;
            counts.available++;
            counts.categories.analysis.total++;
            counts.categories.analysis.available++;

            // Event messages charts should respect visibility settings
            const visibility = localStorage.getItem("chartjs_field_event_messages");
            if (visibility !== "hidden") {
                counts.visible++;
                counts.categories.analysis.visible++;
            }
        } // Time in zone charts are handled by the field toggles above (hr_zone_doughnut, power_zone_doughnut)
        // No need to count separately as they use the same visibility toggles        // Lap zone charts (from renderLapZoneCharts - up to 4 charts possible)
        if (window.globalData?.timeInZoneMesgs) {
            const timeInZoneMesgs = window.globalData.timeInZoneMesgs;
            const lapZoneMsgs = timeInZoneMesgs.filter((msg) => msg.referenceMesg === "lap");

            if (lapZoneMsgs.length > 0) {
                // Check for HR lap zone charts (2 charts: stacked bar and individual bars)
                const hrLapZones = lapZoneMsgs.filter((msg) => msg.timeInHrZone);
                if (hrLapZones.length > 0) {
                    counts.total += 2; // Stacked bar + individual bars
                    counts.available += 2;
                    counts.categories.zones.total += 2;
                    counts.categories.zones.available += 2;

                    // Check visibility for HR lap zone charts
                    const hrStackedVisibility = localStorage.getItem("chartjs_field_hr_lap_zone_stacked");
                    const hrIndividualVisibility = localStorage.getItem("chartjs_field_hr_lap_zone_individual");

                    if (hrStackedVisibility !== "hidden") {
                        counts.visible += 1;
                        counts.categories.zones.visible += 1;
                    }
                    if (hrIndividualVisibility !== "hidden") {
                        counts.visible += 1;
                        counts.categories.zones.visible += 1;
                    }
                }

                // Check for Power lap zone charts (2 charts: stacked bar + individual bars)
                const powerLapZones = lapZoneMsgs.filter((msg) => msg.timeInPowerZone);
                if (powerLapZones.length > 0) {
                    counts.total += 2; // Stacked bar + individual bars
                    counts.available += 2;
                    counts.categories.zones.total += 2;
                    counts.categories.zones.available += 2;

                    // Check visibility for Power lap zone charts
                    const powerStackedVisibility = localStorage.getItem("chartjs_field_power_lap_zone_stacked");
                    const powerIndividualVisibility = localStorage.getItem("chartjs_field_power_lap_zone_individual");

                    if (powerStackedVisibility !== "hidden") {
                        counts.visible += 1;
                        counts.categories.zones.visible += 1;
                    }
                    if (powerIndividualVisibility !== "hidden") {
                        counts.visible += 1;
                        counts.categories.zones.visible += 1;
                    }
                }
            }
        } // Developer fields (dynamic based on actual data)
        // Only count fields that are not already in chartFields and have meaningful data
        if (window.globalData?.recordMesgs && window.globalData.recordMesgs.length > 0) {
            const sampleRecord = window.globalData.recordMesgs[0];
            const excludedFields = ["timestamp", "distance", "fractional_cadence", "positionLat", "positionLong"];
            const developerFields = Object.keys(sampleRecord).filter(
                (key) =>
                    !chartFields.includes(key) &&
                    !excludedFields.includes(key) &&
                    (key.startsWith("developer_") || key.includes("_"))
            );
            developerFields.forEach((field) => {
                // Check if this field has valid numeric data (same logic as renderChartJS)
                const numericData = data.map((row) => {
                    if (row[field] !== undefined && row[field] !== null) {
                        const value = parseFloat(row[field]);
                        return isNaN(value) ? null : value;
                    }
                    return null;
                });

                // Only count as available if there's at least one valid data point
                const hasValidData = !numericData.every((val) => val === null);
                if (hasValidData) {
                    counts.total++;
                    counts.available++;
                    counts.categories.metrics.total++;
                    counts.categories.metrics.available++;

                    const visibility = localStorage.getItem(`chartjs_field_${field}`);
                    if (visibility !== "hidden") {
                        counts.visible++;
                        counts.categories.metrics.visible++;
                    }
                }
            });
        }
    } catch (error) {
        console.error("[ChartStatus] Error counting charts:", error);
        // Don't rethrow - just log and return current counts
        // This prevents the error from propagating to renderChartJS
    }

    // Debug logging to help identify discrepancies
    console.log("[ChartStatus] Chart count breakdown:", {
        total: counts.total,
        available: counts.available,
        visible: counts.visible,
        categories: counts.categories,
        actualRendered: window._chartjsInstances ? window._chartjsInstances.length : 0,
    });

    // Debug: Show what charts are actually rendered
    if (window._chartjsInstances && window._chartjsInstances.length > 0) {
        const renderedChartIds = window._chartjsInstances.map((chart) => chart.canvas.id);
        console.log("[ChartStatus] Actually rendered charts:", renderedChartIds);
    }

    return counts;
}

/**
 * Creates the chart status indicator element
 * @returns {HTMLElement} The status indicator element
 */
export function createChartStatusIndicator() {
    try {
        const counts = getChartCounts();

        const indicator = document.createElement("div");
        indicator.className = "chart-status-indicator";
        indicator.id = "chart-status-indicator";

        // Calculate status
        const isAllVisible = counts.visible === counts.available;
        const hasHiddenCharts = counts.available > counts.visible;

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
        margin-top: 4px;
        box-shadow: var(--color-box-shadow);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 999999;
        backdrop-filter: var(--backdrop-blur);
        pointer-events: none;
        min-width: 280px;
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
            breakdown.style.opacity = "1";
            breakdown.style.visibility = "visible";
        });
        indicator.addEventListener("mouseleave", () => {
            indicator.style.background = "var(--color-glass)";
            indicator.style.transform = "translateY(0)";
            breakdown.style.opacity = "0";
            breakdown.style.visibility = "hidden";
        });

        // Click to scroll to field toggles
        indicator.addEventListener("click", () => {
            const fieldsSection = document.querySelector(".fields-section");
            if (fieldsSection) {
                fieldsSection.scrollIntoView({ behavior: "smooth", block: "start" });
                // Add a brief highlight effect
                fieldsSection.style.outline = "2px solid var(--color-accent)";
                fieldsSection.style.outlineOffset = "4px";
                setTimeout(function () {
                    fieldsSection.style.outline = "none";
                    fieldsSection.style.outlineOffset = "0";
                }, 2000);
            }
        });
        indicator.appendChild(statusIcon);
        indicator.appendChild(statusText);

        // Add tooltip to document body for proper positioning
        document.body.appendChild(breakdown);

        return indicator;
    } catch (error) {
        console.error("[ChartStatus] Error creating chart status indicator:", error);
        // Return a minimal fallback element
        const fallback = document.createElement("div");
        fallback.className = "chart-status-indicator";
        fallback.textContent = "Chart status unavailable";
        return fallback;
    }
}

/**
 * Updates both the settings and global chart status indicators synchronously
 * This ensures they always show the same counts
 */
export function updateAllChartStatusIndicators() {
    try {
        // Use a single call to get counts to ensure consistency
        const counts = getChartCounts();

        // Update settings indicator
        const settingsIndicator = document.getElementById("chart-status-indicator");
        if (settingsIndicator) {
            const newSettingsIndicator = createChartStatusIndicatorFromCounts(counts);
            settingsIndicator.parentNode.replaceChild(newSettingsIndicator, settingsIndicator);
        }

        // Update global indicator
        const globalIndicator = document.getElementById("global-chart-status");
        if (globalIndicator) {
            const newGlobalIndicator = createGlobalChartStatusIndicatorFromCounts(counts);
            if (newGlobalIndicator) {
                globalIndicator.parentNode.replaceChild(newGlobalIndicator, globalIndicator);
            }
        } else {
            // Create if it doesn't exist
            createGlobalChartStatusIndicator();
        }
    } catch (error) {
        console.error("[ChartStatus] Error updating all chart status indicators:", error);
    }
}

/**
 * Creates chart status indicator from pre-calculated counts
 * @param {Object} counts - Pre-calculated chart counts
 */
function createChartStatusIndicatorFromCounts(counts) {
    try {
        const indicator = document.createElement("div");
        indicator.className = "chart-status-indicator";
        indicator.id = "chart-status-indicator";

        // Calculate status
        const isAllVisible = counts.visible === counts.available;
        const hasHiddenCharts = counts.available > counts.visible;

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
            if (fieldsSection) {
                fieldsSection.scrollIntoView({ behavior: "smooth", block: "start" });
                // Add a brief highlight effect
                fieldsSection.style.outline = "2px solid var(--color-accent)";
                fieldsSection.style.outlineOffset = "4px";
                setTimeout(function () {
                    fieldsSection.style.outline = "none";
                    fieldsSection.style.outlineOffset = "0";
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

/**
 * Creates global chart status indicator from pre-calculated counts
 * @param {Object} counts - Pre-calculated chart counts
 */
function createGlobalChartStatusIndicatorFromCounts(counts) {
    try {
        const chartTabContent = document.getElementById("content-chartjs");
        if (!chartTabContent) {
            console.warn("[ChartStatus] Chart tab content not found");
            return null;
        }

        const globalIndicator = document.createElement("div");
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

        // Add detailed breakdown tooltip for global indicator too
        const globalBreakdown = document.createElement("div");
        globalBreakdown.className = "status-breakdown global-breakdown";
        globalBreakdown.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
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
            ${
                hasHiddenCharts
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

        globalIndicator.appendChild(globalBreakdown);

        return globalIndicator;
    } catch (error) {
        console.error("[ChartStatus] Error creating global chart status indicator from counts:", error);
        return null;
    }
}
export function updateChartStatusIndicator(indicator = null) {
    try {
        if (!indicator) {
            indicator = document.getElementById("chart-status-indicator");
        }

        if (!indicator) {
            return;
        }

        // Replace the entire indicator with a new one
        const newIndicator = createChartStatusIndicator();
        indicator.parentNode.replaceChild(newIndicator, indicator);
    } catch (error) {
        console.error("[ChartStatus] Error updating chart status indicator:", error);
    }
}

/**
 * Sets up automatic updates for the chart status indicator
 * Called whenever charts are rendered or field toggles change
 */
export function setupChartStatusUpdates() {
    try {
        // Listen for storage changes (field toggles)
        window.addEventListener("storage", (e) => {
            if (e.key && e.key.startsWith("chartjs_field_")) {
                setTimeout(function () {
                    try {
                        updateAllChartStatusIndicators();
                    } catch (error) {
                        console.error("[ChartStatus] Error in storage handler:", error);
                    }
                }, 50);
            }
        });

        // Listen for custom field toggle events (real-time updates in same window)
        window.addEventListener("fieldToggleChanged", () => {
            setTimeout(function () {
                try {
                    updateAllChartStatusIndicators();
                } catch (error) {
                    console.error("[ChartStatus] Error in fieldToggleChanged handler:", error);
                }
            }, 50);
        }); // Listen for custom events when charts are rendered
        document.addEventListener("chartsRendered", () => {
            // Use setTimeout to ensure DOM updates don't interfere with chart rendering
            setTimeout(function () {
                try {
                    updateAllChartStatusIndicators();
                } catch (error) {
                    console.error("[ChartStatus] Error in chartsRendered handler:", error);
                }
            }, 50);
        }); // Update when global data changes
        const existingDescriptor = Object.getOwnPropertyDescriptor(window, "globalData");

        // Only set up the property if it doesn't already have a custom setter
        if (!existingDescriptor || !existingDescriptor.set || existingDescriptor.configurable) {
            try {
                // Store existing value if any
                const currentValue = window.globalData;

                Object.defineProperty(window, "globalData", {
                    get() {
                        return window._globalData || currentValue;
                    },
                    set(value) {
                        window._globalData = value;
                        setTimeout(function () {
                            try {
                                updateAllChartStatusIndicators();
                            } catch (error) {
                                console.error("[ChartStatus] Error in globalData setter:", error);
                            }
                        }, 100);
                    },
                    configurable: true,
                    enumerable: true,
                });

                // Set initial value if it existed
                if (currentValue !== undefined) {
                    window._globalData = currentValue;
                }
            } catch (propertyError) {
                console.warn(
                    "[ChartStatus] Could not redefine globalData property, using fallback approach:",
                    propertyError
                );
                // Fallback: just monitor for manual updates
            }
        } // Create global indicator on initial setup
        setTimeout(function () {
            try {
                createGlobalChartStatusIndicator();
            } catch (error) {
                console.error("[ChartStatus] Error creating initial global indicator:", error);
            }
        }, 100);
    } catch (error) {
        console.error("[ChartStatus] Error setting up chart status updates:", error);
    }
}

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

/**
 * Updates the global chart status indicator
 */
export function updateGlobalChartStatusIndicator() {
    try {
        const globalIndicator = document.getElementById("global-chart-status");
        if (globalIndicator) {
            // Replace with updated version
            const newIndicator = createGlobalChartStatusIndicator();
            if (newIndicator) {
                globalIndicator.parentNode.replaceChild(newIndicator, globalIndicator);
            }
        } else {
            // Create if it doesn't exist
            createGlobalChartStatusIndicator();
        }
    } catch (error) {
        console.error("[ChartStatus] Error updating global chart status indicator:", error);
    }
}
