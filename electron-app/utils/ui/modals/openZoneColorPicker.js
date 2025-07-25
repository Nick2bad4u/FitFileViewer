import { formatTime } from "../../formatting/formatters/formatTime.js";
import { renderChartJS } from "../../charts/core/renderChartJS.js";
import { showNotification } from "../notifications/showNotification.js";
import { chartStateManager } from "../../charts/core/chartStateManager.js";
import {
    DEFAULT_HR_ZONE_COLORS,
    DEFAULT_POWER_ZONE_COLORS,
    getChartSpecificZoneColor,
    saveChartSpecificZoneColor,
    applyZoneColors,
} from "../../data/zones/chartZoneColorUtils.js";

export function openZoneColorPicker(field) {
    try {
        console.log(`[ChartJS] Opening zone color picker for field: ${field}`);

        // Determine zone type, data source, and chart-specific details
        let zoneData = null;
        let zoneType = "";
        let chartType = "";
        let defaultColors = [];

        if (field.includes("hr_zone") || field.includes("hr_lap_zone") || field === "hr_zone") {
            zoneType = "Heart Rate";
            zoneData = window.heartRateZones;
            defaultColors = DEFAULT_HR_ZONE_COLORS;

            // Determine specific chart type for HR zones
            if (field === "hr_zone_doughnut") chartType = "Doughnut Chart";
            else if (field === "hr_lap_zone_stacked") chartType = "Lap Stacked Chart";
            else if (field === "hr_lap_zone_individual") chartType = "Lap Individual Chart";
            else chartType = "Zone Charts";
        } else if (field.includes("power_zone") || field.includes("power_lap_zone") || field === "power_zone") {
            zoneType = "Power";
            zoneData = window.powerZones;
            defaultColors = DEFAULT_POWER_ZONE_COLORS;

            // Determine specific chart type for Power zones
            if (field === "power_zone_doughnut") chartType = "Doughnut Chart";
            else if (field === "power_lap_zone_stacked") chartType = "Lap Stacked Chart";
            else if (field === "power_lap_zone_individual") chartType = "Lap Individual Chart";
            else chartType = "Zone Charts";
        } else {
            console.warn(`[ChartJS] Unknown zone field type: ${field}`);
            showNotification("Unknown zone type", "error");
            return;
        }

        if (!zoneData || !Array.isArray(zoneData) || zoneData.length === 0) {
            console.warn(`[ChartJS] No zone data available for ${field}`);
            showNotification(`No ${zoneType.toLowerCase()} zone data available`, "warning");
            return;
        }

        // Apply saved zone colors to the zone data
        zoneData = applyZoneColors(zoneData, zoneType.toLowerCase());

        // Create modal overlay
        const overlay = document.createElement("div");
        overlay.id = "zone-color-picker-overlay";
        overlay.style.cssText = `
						position: fixed;
						top: 0;
						left: 0;
						width: 100%;
						height: 100%;
						background: rgba(0, 0, 0, 0.7);
						display: flex;
						justify-content: center;
						align-items: center;
						z-index: 10001;
						backdrop-filter: blur(4px);
					`;

        // Create modal content
        const modal = document.createElement("div");
        modal.style.cssText = `
						background: linear-gradient(145deg, #1a1f2e 0%, #252b3f 100%);
						border-radius: 16px;
						padding: 24px;
						max-width: 500px;
						width: 90%;
						max-height: 80vh;
						overflow-y: auto;
						border: 1px solid rgba(255, 255, 255, 0.1);
						box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
						position: relative;
					`;

        // Modal header
        const header = document.createElement("div");
        header.style.cssText = `
						display: flex;
						justify-content: space-between;
						align-items: center;
						margin-bottom: 24px;
						padding-bottom: 16px;
						border-bottom: 1px solid rgba(255, 255, 255, 0.1);
					`;

        const title = document.createElement("h3");
        title.textContent = `${zoneType} Zone Colors - ${chartType}`;
        title.style.cssText = `
						margin: 0;
						color: #ffffff;
						font-size: 20px;
						font-weight: 600;
					`;

        const closeButton = document.createElement("button");
        closeButton.innerHTML = "✕";
        closeButton.style.cssText = `
						background: rgba(255, 255, 255, 0.1);
						border: none;
						border-radius: 8px;
						color: #ffffff;
						width: 32px;
						height: 32px;
						font-size: 16px;
						cursor: pointer;
						display: flex;
						align-items: center;
						justify-content: center;
						transition: all 0.3s ease;
					`;

        closeButton.addEventListener("mouseenter", () => {
            closeButton.style.background = "rgba(255, 255, 255, 0.2)";
        });

        closeButton.addEventListener("mouseleave", () => {
            closeButton.style.background = "rgba(255, 255, 255, 0.1)";
        });

        closeButton.addEventListener("click", () => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
                document.removeEventListener("keydown", handleEscape);
            }
        });

        header.appendChild(title);
        header.appendChild(closeButton);

        // Zone color controls container
        const zoneControls = document.createElement("div");
        zoneControls.style.cssText = `
						display: flex;
						flex-direction: column;
						gap: 16px;
						margin-bottom: 24px;
					`;

        // Create color picker for each zone
        zoneData.forEach((zone, index) => {
            const zoneControl = document.createElement("div");
            zoneControl.style.cssText = `
							display: flex;
							align-items: center;
							gap: 16px;
							padding: 16px;
							background: rgba(255, 255, 255, 0.05);
							border-radius: 12px;
							border: 1px solid rgba(255, 255, 255, 0.1);
							transition: all 0.3s ease;
						`;

            // Zone info
            const zoneInfo = document.createElement("div");
            zoneInfo.style.cssText = `
							flex: 1;
							color: #ffffff;
						`;

            const zoneLabel = document.createElement("div");
            zoneLabel.textContent = zone.label || `Zone ${zone.zone || index + 1}`;
            zoneLabel.style.cssText = `
							font-weight: 600;
							font-size: 14px;
							margin-bottom: 4px;
						`;

            const zoneTime = document.createElement("div");
            zoneTime.textContent = `Time: ${formatTime(zone.time || 0, true)}`;
            zoneTime.style.cssText = `
							font-size: 12px;
							color: rgba(255, 255, 255, 0.7);
						`;

            zoneInfo.appendChild(zoneLabel);
            zoneInfo.appendChild(zoneTime);

            // Color preview
            const colorPreview = document.createElement("div");
            const zoneIndex = (zone.zone || index + 1) - 1; // Convert to 0-based index
            const currentColor = getChartSpecificZoneColor(field, zoneIndex);

            colorPreview.style.cssText = `
							width: 32px;
							height: 32px;
							border-radius: 8px;
							background: ${currentColor};
							border: 2px solid rgba(255, 255, 255, 0.3);
							cursor: pointer;
							transition: all 0.3s ease;
						`;

            // Color picker input (hidden)
            const colorPicker = document.createElement("input");
            colorPicker.type = "color";
            colorPicker.value = currentColor;
            colorPicker.style.cssText = `
							opacity: 0;
							position: absolute;
							width: 0;
							height: 0;
							pointer-events: none;
						`;

            // Color picker change handler
            colorPicker.addEventListener("change", (e) => {
                const newColor = e.target.value;
                colorPreview.style.background = newColor;

                // Set color scheme to custom when manually changing a zone color
                localStorage.setItem(`chartjs_${field}_color_scheme`, "custom");

                saveChartSpecificZoneColor(field, zoneIndex, newColor);

                // Update preview in real-time if possible
                updateZoneColorPreview(field, zoneIndex, newColor);

                // Update the inline zone color selector UIs to show the scheme changed to custom
                if (typeof window.updateInlineZoneColorSelectors === "function") {
                    window.updateInlineZoneColorSelectors(document.body);
                }
            });

            // Click handler for color preview
            colorPreview.addEventListener("click", () => {
                colorPicker.click();
            });

            colorPreview.addEventListener("mouseenter", () => {
                colorPreview.style.transform = "scale(1.1)";
                colorPreview.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
            });

            colorPreview.addEventListener("mouseleave", () => {
                colorPreview.style.transform = "scale(1)";
                colorPreview.style.boxShadow = "none";
            });

            // Reset button for this zone
            const resetButton = document.createElement("button");
            resetButton.textContent = "↻";
            resetButton.title = "Reset to default color";
            resetButton.style.cssText = `
							background: rgba(255, 255, 255, 0.1);
							border: none;
							border-radius: 6px;
							color: #ffffff;
							width: 28px;
							height: 28px;
							font-size: 12px;
							cursor: pointer;
							display: flex;
							align-items: center;
							justify-content: center;
							transition: all 0.3s ease;
						`;

            resetButton.addEventListener("click", () => {
                const defaultColor = defaultColors[zoneIndex] || defaultColors[zoneIndex % defaultColors.length];
                colorPicker.value = defaultColor;
                colorPreview.style.background = defaultColor;

                // Set color scheme to custom when manually resetting a zone color
                localStorage.setItem(`chartjs_${field}_color_scheme`, "custom");

                saveChartSpecificZoneColor(field, zoneIndex, defaultColor);
                updateZoneColorPreview(field, zoneIndex, defaultColor);

                // Update the inline zone color selector UIs to show the scheme changed to custom
                if (typeof window.updateInlineZoneColorSelectors === "function") {
                    window.updateInlineZoneColorSelectors(document.body);
                }
            });

            resetButton.addEventListener("mouseenter", () => {
                resetButton.style.background = "rgba(255, 255, 255, 0.2)";
            });

            resetButton.addEventListener("mouseleave", () => {
                resetButton.style.background = "rgba(255, 255, 255, 0.1)";
            });

            zoneControl.appendChild(zoneInfo);
            zoneControl.appendChild(colorPreview);
            zoneControl.appendChild(colorPicker);
            zoneControl.appendChild(resetButton);
            zoneControls.appendChild(zoneControl);
        });

        // Action buttons
        const actions = document.createElement("div");
        actions.style.cssText = `
						display: flex;
						gap: 12px;
						justify-content: flex-end;
						padding-top: 16px;
						border-top: 1px solid rgba(255, 255, 255, 0.1);
					`;

        // Reset all button
        const resetAllButton = document.createElement("button");
        resetAllButton.textContent = "Reset All";
        resetAllButton.title = "Reset all zone colors, set scheme to custom, and enable all charts";
        resetAllButton.className = "reset-all-btn";
        resetAllButton.style.cssText = `
            background: var(--accent-color, #3b82f6);
            color: #fff;
            border: none;
            border-radius: 8px;
            padding: 8px 16px;
            font-size: 15px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s;
        `;
        resetAllButton.addEventListener("mouseenter", () => {
            resetAllButton.style.background = "#2563eb";
        });
        resetAllButton.addEventListener("mouseleave", () => {
            resetAllButton.style.background = "var(--accent-color, #3b82f6)";
        });
        resetAllButton.addEventListener("click", () => {
            try {
                // Set color scheme to custom for all relevant zone fields
                const zoneFields = [
                    "hr_zone",
                    "power_zone",
                    "hr_lap_zone",
                    "power_lap_zone",
                    "hr_zone_doughnut",
                    "power_zone_doughnut",
                    "hr_lap_zone_stacked",
                    "hr_lap_zone_individual",
                    "power_lap_zone_stacked",
                    "power_lap_zone_individual",
                ];
                zoneFields.forEach((f) => {
                    localStorage.setItem(`chartjs_${f}_color_scheme`, "custom");
                });
                // Also set for the current field in case it's not in the above list
                localStorage.setItem(`chartjs_${field}_color_scheme`, "custom");

                // Clear all saved zone color data for this field
                if (window.clearZoneColorData) {
                    window.clearZoneColorData(field, zoneData.length);
                } else {
                    // fallback: remove per-zone color keys
                    for (let i = 0; i < zoneData.length; i++) {
                        localStorage.removeItem(`chartjs_${field}_zone_${i + 1}_color`);
                    }
                }

                // Enable all chart fields (set all toggles to visible)
                const settingsWrapper = document.getElementById("chartjs-settings-wrapper");
                if (settingsWrapper) {
                    const fieldToggles = settingsWrapper.querySelectorAll('.field-toggle input[type="checkbox"]');
                    fieldToggles.forEach((toggle) => {
                        toggle.checked = true;
                    });
                }

                // Call global resetAllSettings if available (for full reset)
                if (typeof window.resetAllSettings === "function") {
                    window.resetAllSettings();
                }

                // Update UI and chart to reflect reset state
                if (typeof window.updateInlineZoneColorSelectors === "function") {
                    window.updateInlineZoneColorSelectors(document.body);
                }

                // Trigger chart re-render through state management instead of direct call
                if (chartStateManager) {
                    chartStateManager.debouncedRender("Zone colors reset");
                } else if (typeof window.renderChartJS === "function") {
                    window.renderChartJS(); // Fallback for compatibility
                }

                if (typeof window.showNotification === "function") {
                    window.showNotification("Zone colors and settings reset to defaults", "success");
                }
            } catch (err) {
                if (typeof window.showNotification === "function") {
                    window.showNotification("Failed to reset zone colors: " + err.message, "error");
                }
                console.error("[ZoneColorPicker] Reset all failed:", err);
            }
        });
        actions.appendChild(resetAllButton);

        // Apply button
        const applyButton = document.createElement("button");
        applyButton.textContent = "Apply & Close";
        applyButton.style.cssText = `
						padding: 10px 20px;
						background: linear-gradient(145deg, #3b82f665, #2563eb);
						border: none;
						border-radius: 8px;
						color: #ffffff;
						font-size: 14px;
						font-weight: 600;
						cursor: pointer;
						transition: all 0.3s ease;
					`;

        applyButton.addEventListener("mouseenter", () => {
            applyButton.style.transform = "translateY(-2px)";
            applyButton.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.4)";
        });

        applyButton.addEventListener("mouseleave", () => {
            applyButton.style.transform = "translateY(0)";
            applyButton.style.boxShadow = "none";
        });

        applyButton.addEventListener("click", () => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
                document.removeEventListener("keydown", handleEscape);
            }

            // Trigger chart re-render through state management instead of direct call
            if (chartStateManager) {
                chartStateManager.debouncedRender("Zone colors applied");
            } else {
                renderChartJS(); // Fallback for compatibility
            }

            showNotification(`${zoneType} zone colors updated`, "success");
        });

        actions.appendChild(resetAllButton);
        actions.appendChild(applyButton);

        // Assemble modal
        modal.appendChild(header);
        modal.appendChild(zoneControls);
        modal.appendChild(actions);
        overlay.appendChild(modal);

        // ESC key handler
        const handleEscape = (e) => {
            if (e.key === "Escape" && document.body.contains(overlay)) {
                document.body.removeChild(overlay);
                document.removeEventListener("keydown", handleEscape);
            }
        };
        document.addEventListener("keydown", handleEscape);

        // Click outside to close
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay && document.body.contains(overlay)) {
                document.body.removeChild(overlay);
                document.removeEventListener("keydown", handleEscape);
            }
        });

        // Add to DOM
        document.body.appendChild(overlay);

        console.log(`[ChartJS] Zone color picker opened for ${zoneType} zones`);
    } catch (error) {
        console.error("[ChartJS] Error opening zone color picker:", error);
        showNotification("Failed to open zone color picker", "error");
    }
} /**
 * Updates zone color preview in real-time (if chart is visible)
 * @param {string} field - The field name
 * @param {number} zoneIndex - Zone index (0-based)
 * @param {string} newColor - New color value
 */

export function updateZoneColorPreview(field, zoneIndex, newColor) {
    try {
        // Find the corresponding chart instance
        const targetChart = window._chartjsInstances?.find((chart) => {
            const dataset = chart.data.datasets[0];
            return (
                dataset &&
                ((field.includes("hr_zone") && dataset.label && dataset.label.includes("Heart Rate")) ||
                    (field.includes("power_zone") && dataset.label && dataset.label.includes("Power")))
            );
        });

        if (targetChart && targetChart.data.datasets[0]) {
            const dataset = targetChart.data.datasets[0];
            if (Array.isArray(dataset.backgroundColor) && dataset.backgroundColor[zoneIndex]) {
                dataset.backgroundColor[zoneIndex] = newColor;
                targetChart.update("none"); // Update without animation for real-time preview
            }
        }
    } catch (error) {
        console.warn("[ChartJS] Could not update zone color preview:", error);
    }
}
