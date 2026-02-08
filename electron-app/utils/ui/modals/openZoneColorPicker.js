import { chartStateManager } from "../../charts/core/chartStateManager.js";
import { getChartSettingsWrapper } from "../../charts/dom/chartDomUtils.js";
// Avoid direct import to prevent circular dependency during SSR; use event-based request
import {
    applyZoneColors,
    DEFAULT_HR_ZONE_COLORS,
    DEFAULT_POWER_ZONE_COLORS,
    getChartSpecificZoneColor,
    removeChartSpecificZoneColor,
    removeZoneColor,
    saveChartSpecificZoneColor,
    setChartColorScheme,
} from "../../data/zones/chartZoneColorUtils.js";
import { formatTime } from "../../formatting/formatters/formatTime.js";
import { addEventListenerWithCleanup } from "../events/eventListenerManager.js";
import { showNotification } from "../notifications/showNotification.js";

/**
 * @param {any} field
 */
export function openZoneColorPicker(field) {
    try {
        console.log(`[ChartJS] Opening zone color picker for field: ${field}`);

        // Determine zone type, data source, and chart-specific details
        let chartType = "",
            defaultColors = [],
            zoneData = null,
            zoneType = "";

        if (
            field.includes("hr_zone") ||
            field.includes("hr_lap_zone") ||
            field === "hr_zone"
        ) {
            zoneType = "Heart Rate";
            zoneData = globalThis.heartRateZones;
            defaultColors = DEFAULT_HR_ZONE_COLORS;

            // Determine specific chart type for HR zones
            switch (field) {
                case "hr_lap_zone_individual": {
                    chartType = "Lap Individual Chart";

                    break;
                }
                case "hr_lap_zone_stacked": {
                    chartType = "Lap Stacked Chart";

                    break;
                }
                case "hr_zone_doughnut": {
                    chartType = "Doughnut Chart";

                    break;
                }
                default: {
                    chartType = "Zone Charts";
                }
            }
        } else if (
            field.includes("power_zone") ||
            field.includes("power_lap_zone") ||
            field === "power_zone"
        ) {
            zoneType = "Power";
            zoneData = globalThis.powerZones;
            defaultColors = DEFAULT_POWER_ZONE_COLORS;

            // Determine specific chart type for Power zones
            switch (field) {
                case "power_lap_zone_individual": {
                    chartType = "Lap Individual Chart";

                    break;
                }
                case "power_lap_zone_stacked": {
                    chartType = "Lap Stacked Chart";

                    break;
                }
                case "power_zone_doughnut": {
                    chartType = "Doughnut Chart";

                    break;
                }
                default: {
                    chartType = "Zone Charts";
                }
            }
        } else {
            console.warn(`[ChartJS] Unknown zone field type: ${field}`);
            showNotification("Unknown zone type", "error");
            return;
        }

        if (!zoneData || !Array.isArray(zoneData) || zoneData.length === 0) {
            console.warn(`[ChartJS] No zone data available for ${field}`);
            showNotification(
                `No ${zoneType.toLowerCase()} zone data available`,
                "warning"
            );
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

        // ESC key handler (declare early to avoid no-use-before-define in listeners)
        /** @param {KeyboardEvent} e */
        const handleEscape = (e) => {
            if (e.key === "Escape" && document.body.contains(overlay)) {
                overlay.remove();
                document.removeEventListener("keydown", handleEscape);
            }
        };

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

        addEventListenerWithCleanup(closeButton, "mouseenter", () => {
            closeButton.style.background = "rgba(255, 255, 255, 0.2)";
        });

        addEventListenerWithCleanup(closeButton, "mouseleave", () => {
            closeButton.style.background = "rgba(255, 255, 255, 0.1)";
        });

        addEventListenerWithCleanup(closeButton, "click", () => {
            if (document.body.contains(overlay)) {
                overlay.remove();
                document.removeEventListener("keydown", handleEscape);
            }
        });

        header.append(title);
        header.append(closeButton);

        // Zone color controls container
        const zoneControls = document.createElement("div");
        zoneControls.style.cssText = `
						display: flex;
						flex-direction: column;
						gap: 16px;
						margin-bottom: 24px;
					`;

        // Create color picker for each zone
        for (const [index, zone] of zoneData.entries()) {
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
            zoneLabel.textContent =
                zone.label || `Zone ${zone.zone || index + 1}`;
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

            zoneInfo.append(zoneLabel);
            zoneInfo.append(zoneTime);

            // Color preview
            const colorPreview = document.createElement("div"),
                zoneIndex = (zone.zone || index + 1) - 1, // Convert to 0-based index
                currentColor = getChartSpecificZoneColor(field, zoneIndex);

            colorPreview.style.cssText = `
							width: 32px;
							height: 32px;
							border-radius: 8px;
							border: 2px solid rgba(255, 255, 255, 0.3);
							cursor: pointer;
							transition: all 0.3s ease;
						`;
            // Avoid embedding color strings into cssText.
            colorPreview.style.background = currentColor;

            /**
             * Convert stored color tokens to a valid <input type="color">
             * value.
             *
             * @param {string} value
             *
             * @returns {string}
             */
            const toColorInputHex6 = (value) => {
                const v = String(value).trim();
                if (/^#[\da-f]{6}$/iu.test(v)) return v;
                if (/^#[\da-f]{8}$/iu.test(v)) return v.slice(0, 7);
                if (/^#[\da-f]{3}$/iu.test(v)) {
                    const [
                        ,
                        r,
                        g,
                        b,
                    ] = v;
                    return `#${r}${r}${g}${g}${b}${b}`;
                }
                if (/^#[\da-f]{4}$/iu.test(v)) {
                    const [
                        ,
                        r,
                        g,
                        b,
                    ] = v;
                    return `#${r}${r}${g}${g}${b}${b}`;
                }
                return "#000000";
            };

            // Color picker input (hidden)
            const colorPicker = document.createElement("input");
            colorPicker.type = "color";
            colorPicker.value = toColorInputHex6(currentColor);
            colorPicker.style.cssText = `
							opacity: 0;
							position: absolute;
							width: 0;
							height: 0;
							pointer-events: none;
						`;

            // Color picker change handler
            addEventListenerWithCleanup(colorPicker, "change", (e) => {
                const { value: newColor } = /** @type {HTMLInputElement} */ (
                    e.target
                );
                colorPreview.style.background = newColor;

                // Set color scheme to custom when manually changing a zone color
                setChartColorScheme(field, "custom");

                saveChartSpecificZoneColor(field, zoneIndex, newColor);

                // Update preview in real-time if possible
                updateZoneColorPreview(field, zoneIndex, newColor);

                // Update the inline zone color selector UIs to show the scheme changed to custom
                if (
                    typeof globalThis.updateInlineZoneColorSelectors ===
                    "function"
                ) {
                    globalThis.updateInlineZoneColorSelectors(document.body);
                }
            });

            // Click handler for color preview
            addEventListenerWithCleanup(colorPreview, "click", () => {
                colorPicker.click();
            });

            addEventListenerWithCleanup(colorPreview, "mouseenter", () => {
                colorPreview.style.transform = "scale(1.1)";
                colorPreview.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
            });

            addEventListenerWithCleanup(colorPreview, "mouseleave", () => {
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

            addEventListenerWithCleanup(resetButton, "click", () => {
                const defaultColor =
                    defaultColors[zoneIndex] ||
                    defaultColors[zoneIndex % defaultColors.length];
                if (defaultColor) {
                    colorPicker.value = defaultColor;
                    colorPreview.style.background = defaultColor;

                    // Set color scheme to custom when manually resetting a zone color
                    setChartColorScheme(field, "custom");

                    saveChartSpecificZoneColor(field, zoneIndex, defaultColor);
                    updateZoneColorPreview(field, zoneIndex, defaultColor);
                }

                // Update the inline zone color selector UIs to show the scheme changed to custom
                if (
                    typeof globalThis.updateInlineZoneColorSelectors ===
                    "function"
                ) {
                    globalThis.updateInlineZoneColorSelectors(document.body);
                }
            });

            addEventListenerWithCleanup(resetButton, "mouseenter", () => {
                resetButton.style.background = "rgba(255, 255, 255, 0.2)";
            });

            addEventListenerWithCleanup(resetButton, "mouseleave", () => {
                resetButton.style.background = "rgba(255, 255, 255, 0.1)";
            });

            zoneControl.append(zoneInfo);
            zoneControl.append(colorPreview);
            zoneControl.append(colorPicker);
            zoneControl.append(resetButton);
            zoneControls.append(zoneControl);
        }

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
        resetAllButton.title =
            "Reset all zone colors, set scheme to custom, and enable all charts";
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
        addEventListenerWithCleanup(resetAllButton, "mouseenter", () => {
            resetAllButton.style.background = "#2563eb";
        });
        addEventListenerWithCleanup(resetAllButton, "mouseleave", () => {
            resetAllButton.style.background = "var(--accent-color, #3b82f6)";
        });
        addEventListenerWithCleanup(resetAllButton, "click", () => {
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
                for (const f of zoneFields) {
                    setChartColorScheme(f, "custom");
                }
                // Also set for the current field in case it's not in the above list
                setChartColorScheme(field, "custom");

                // Clear all saved zone color data for this field
                if (globalThis.clearZoneColorData) {
                    globalThis.clearZoneColorData(field, zoneData.length);
                } else {
                    // Fallback: remove per-zone color keys
                    const fallbackZoneType = field.includes("hr")
                        ? "hr"
                        : "power";
                    for (let i = 0; i < zoneData.length; i++) {
                        removeChartSpecificZoneColor(field, i);
                        removeZoneColor(fallbackZoneType, i);
                    }
                }

                // Enable all chart fields (set all toggles to visible)
                const settingsWrapper = getChartSettingsWrapper(document);
                if (settingsWrapper) {
                    const fieldToggles = settingsWrapper.querySelectorAll(
                        '.field-toggle input[type="checkbox"]'
                    );
                    for (const toggle of fieldToggles) {
                        /** @type {HTMLInputElement} */ (toggle).checked = true;
                    }
                }

                // Call global resetAllSettings if available (for full reset)
                if (typeof globalThis.resetAllSettings === "function") {
                    globalThis.resetAllSettings();
                }

                // Update UI and chart to reflect reset state
                if (
                    typeof globalThis.updateInlineZoneColorSelectors ===
                    "function"
                ) {
                    globalThis.updateInlineZoneColorSelectors(document.body);
                }

                // Trigger chart re-render through state management instead of direct call
                if (chartStateManager) {
                    chartStateManager.debouncedRender("Zone colors reset");
                } else if (typeof globalThis.renderChartJS === "function") {
                    globalThis.renderChartJS(); // Fallback for compatibility
                }

                if (typeof globalThis.showNotification === "function") {
                    globalThis.showNotification(
                        "Zone colors and settings reset to defaults",
                        "success"
                    );
                }
            } catch (error) {
                if (typeof globalThis.showNotification === "function") {
                    globalThis.showNotification(
                        `Failed to reset zone colors: ${/** @type {Error} */ (error).message}`,
                        "error"
                    );
                }
                console.error("[ZoneColorPicker] Reset all failed:", error);
            }
        });
        actions.append(resetAllButton);

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

        addEventListenerWithCleanup(applyButton, "mouseenter", () => {
            applyButton.style.transform = "translateY(-2px)";
            applyButton.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.4)";
        });

        addEventListenerWithCleanup(applyButton, "mouseleave", () => {
            applyButton.style.transform = "translateY(0)";
            applyButton.style.boxShadow = "none";
        });

        addEventListenerWithCleanup(applyButton, "click", () => {
            if (document.body.contains(overlay)) {
                overlay.remove();
                document.removeEventListener("keydown", handleEscape);
            }

            // Trigger chart re-render through state management instead of direct call
            if (chartStateManager) {
                chartStateManager.debouncedRender("Zone colors applied");
            } else if (typeof globalThis.renderChartJS === "function") {
                globalThis.renderChartJS();
            } else {
                globalThis.dispatchEvent(
                    new CustomEvent("ffv:request-render-charts", {
                        detail: { reason: "zone-colors-applied" },
                    })
                );
            }

            showNotification(`${zoneType} zone colors updated`, "success");
        });

        actions.append(resetAllButton);
        actions.append(applyButton);

        // Assemble modal
        modal.append(header);
        modal.append(zoneControls);
        modal.append(actions);
        overlay.append(modal);

        addEventListenerWithCleanup(document, "keydown", handleEscape);

        // Click outside to close
        addEventListenerWithCleanup(overlay, "click", (e) => {
            if (e.target === overlay && document.body.contains(overlay)) {
                overlay.remove();
                document.removeEventListener("keydown", handleEscape);
            }
        });

        // Add to DOM
        document.body.append(overlay);

        console.log(`[ChartJS] Zone color picker opened for ${zoneType} zones`);
    } catch (error) {
        console.error("[ChartJS] Error opening zone color picker:", error);
        showNotification("Failed to open zone color picker", "error");
    }
}

/**
 * Updates zone color preview in real-time (if chart is visible)
 *
 * @param {any} field - The field name
 * @param {any} zoneIndex - Zone index (0-based)
 * @param {any} newColor - New color value
 */
export function updateZoneColorPreview(field, zoneIndex, newColor) {
    try {
        // Find the corresponding chart instance
        const targetChart = globalThis._chartjsInstances?.find((chart) => {
            const [dataset] = chart.data.datasets;
            return (
                dataset &&
                ((field.includes("hr_zone") &&
                    dataset.label &&
                    dataset.label.includes("Heart Rate")) ||
                    (field.includes("power_zone") &&
                        dataset.label &&
                        dataset.label.includes("Power")))
            );
        });

        if (targetChart && targetChart.data.datasets[0]) {
            const [dataset] = targetChart.data.datasets;
            if (
                Array.isArray(dataset.backgroundColor) &&
                dataset.backgroundColor[zoneIndex]
            ) {
                dataset.backgroundColor[zoneIndex] = newColor;
                targetChart.update("none"); // Update without animation for real-time preview
            }
        }
    } catch (error) {
        console.warn("[ChartJS] Could not update zone color preview:", error);
    }
}
