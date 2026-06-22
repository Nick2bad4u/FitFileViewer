import { chartStateManager } from "../../charts/core/chartStateManager.js";
import { getRegisteredChartInstances } from "../../charts/core/chartInstanceRegistry.js";
import { getChartSettingsWrapper } from "../../charts/dom/chartDomUtils.js";
import { resetAllSettings } from "../../app/initialization/getCurrentSettings.js";
// Avoid direct import to prevent circular dependency during SSR; use event-based request
import {
    applyZoneColors,
    DEFAULT_HR_ZONE_COLORS,
    DEFAULT_POWER_ZONE_COLORS,
    getChartSpecificZoneColor,
    saveChartSpecificZoneColor,
    setChartColorScheme,
    type ZoneData,
} from "../../data/zones/chartZoneColorUtils.js";
import {
    getHeartRateZones,
    getPowerZones,
} from "../../data/zones/zoneDataState.js";
import { formatTime } from "../../formatting/formatters/formatTime.js";
import {
    clearZoneColorData,
    updateInlineZoneColorSelectors,
} from "../controls/createInlineZoneColorSelector.js";
import { addEventListenerWithCleanup } from "../events/eventListenerManager.js";
import { showNotification } from "../notifications/showNotification.js";
import { createModalFocusTrap } from "./modalFocusTrap.js";
import {
    getOpenZoneColorPickerRuntime,
    type OpenZoneColorPickerRuntime,
} from "./openZoneColorPickerRuntime.js";

type ChartDataset = {
    backgroundColor?: unknown;
    label?: string;
};

type ChartInstance = {
    data: {
        datasets: ChartDataset[];
    };
    update: (mode?: string) => void;
};

function isChartInstance(value: unknown): value is ChartInstance {
    if (value === null || typeof value !== "object") {
        return false;
    }

    const chartData = (value as { data?: unknown }).data;

    return (
        chartData !== null &&
        typeof chartData === "object" &&
        Array.isArray((chartData as { datasets?: unknown }).datasets) &&
        "update" in value &&
        typeof (value as { update?: unknown }).update === "function"
    );
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function dispatchChartRenderRequest(
    reason: string,
    runtime: OpenZoneColorPickerRuntime = getOpenZoneColorPickerRuntime()
): void {
    runtime.dispatchEvent(
        runtime.createCustomEvent("ffv:request-render-charts", {
            detail: { reason },
        })
    );
}

function requestDirectChartRender(
    reason: string,
    runtime: OpenZoneColorPickerRuntime = getOpenZoneColorPickerRuntime()
): void {
    void import("../../charts/core/renderChartJS.js")
        .then(({ renderChartJS }) => {
            void renderChartJS();
        })
        .catch((error: unknown) => {
            console.warn(
                "[ZoneColorPicker] Direct chart render import failed; dispatching render request event",
                error
            );
            dispatchChartRenderRequest(reason, runtime);
        });
}

/**
 * Opens the zone color picker for a chart field.
 *
 * @param field - Chart field whose zone colors should be edited.
 */
export function openZoneColorPicker(field: string): void {
    try {
        console.log(`[ChartJS] Opening zone color picker for field: ${field}`);
        const runtime = getOpenZoneColorPickerRuntime();

        // Determine zone type, data source, and chart-specific details
        let chartType = "",
            defaultColors: readonly string[] = [],
            zoneData: null | ZoneData[] = null,
            zoneType = "";

        if (
            field.includes("hr_zone") ||
            field.includes("hr_lap_zone") ||
            field === "hr_zone"
        ) {
            zoneType = "Heart Rate";
            zoneData = getHeartRateZones();
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
            zoneData = getPowerZones();
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
        const overlay = runtime.createElement("div");
        overlay.id = "zone-color-picker-overlay";
        overlay.className = "zone-color-picker-overlay";
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

        let escapeCleanup: (() => void) | undefined,
            focusTrapCleanup: (() => void) | undefined;
        const activeElement = runtime.getActiveElement();
        const previouslyFocusedElement =
            activeElement instanceof HTMLElement ? activeElement : null;

        const closeModal = (): void => {
            if (runtime.bodyContains(overlay)) {
                overlay.remove();
            }
            escapeCleanup?.();
            focusTrapCleanup?.();
            try {
                previouslyFocusedElement?.focus();
            } catch {
                /* Ignore focus restoration failures in lightweight DOMs. */
            }
        };

        const handleEscape = (event: Event): void => {
            if (
                event instanceof KeyboardEvent &&
                event.key === "Escape" &&
                runtime.bodyContains(overlay)
            ) {
                closeModal();
            }
        };

        // Create modal content
        const modal = runtime.createElement("div");
        modal.className = "zone-color-picker-modal";
        modal.setAttribute("aria-labelledby", "zone-color-picker-title");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("role", "dialog");
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
        const header = runtime.createElement("div");
        header.style.cssText = `
						display: flex;
						justify-content: space-between;
						align-items: center;
						margin-bottom: 24px;
						padding-bottom: 16px;
						border-bottom: 1px solid rgba(255, 255, 255, 0.1);
					`;

        const title = runtime.createElement("h3");
        title.id = "zone-color-picker-title";
        title.className = "zone-color-picker-title";
        title.textContent = `${zoneType} Zone Colors - ${chartType}`;
        title.style.cssText = `
						margin: 0;
						color: #ffffff;
						font-size: 20px;
						font-weight: 600;
					`;

        const closeButton = runtime.createElement("button");
        closeButton.type = "button";
        closeButton.textContent = "✕";
        closeButton.setAttribute("aria-label", "Close zone color picker");
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
            closeModal();
        });

        header.append(title);
        header.append(closeButton);

        // Zone color controls container
        const zoneControls = runtime.createElement("div");
        zoneControls.className = "zone-color-controls";
        zoneControls.style.cssText = `
						display: flex;
						flex-direction: column;
						gap: 16px;
						margin-bottom: 24px;
					`;

        // Create color picker for each zone
        for (const [index, zone] of zoneData.entries()) {
            const zoneControl = runtime.createElement("div");
            zoneControl.className = "zone-color-control";
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
            const zoneInfo = runtime.createElement("div");
            zoneInfo.className = "zone-color-info";
            zoneInfo.style.cssText = `
							flex: 1;
							color: #ffffff;
						`;

            const zoneLabel = runtime.createElement("div");
            zoneLabel.className = "zone-color-label";
            zoneLabel.textContent =
                zone.label || `Zone ${zone.zone || index + 1}`;
            zoneLabel.style.cssText = `
							font-weight: 600;
							font-size: 14px;
							margin-bottom: 4px;
						`;

            const zoneTime = runtime.createElement("div");
            zoneTime.className = "zone-color-time";
            zoneTime.textContent = `Time: ${formatTime(zone.time || 0, true)}`;
            zoneTime.style.cssText = `
							font-size: 12px;
							color: rgba(255, 255, 255, 0.7);
						`;

            zoneInfo.append(zoneLabel);
            zoneInfo.append(zoneTime);

            // Color preview
            const colorPreview = runtime.createElement("div"),
                zoneIndex = (zone.zone || index + 1) - 1, // Convert to 0-based index
                currentColor = getChartSpecificZoneColor(field, zoneIndex);
            colorPreview.className = "zone-color-preview";
            colorPreview.setAttribute(
                "aria-label",
                `Choose ${zoneLabel.textContent ?? `Zone ${index + 1}`} color`
            );
            colorPreview.setAttribute("role", "button");
            colorPreview.tabIndex = 0;

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
             * @param value - Stored color value.
             *
             * @returns Normalized six-digit hex color.
             */
            const toColorInputHex6 = (value: string): string => {
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
            const colorPicker = runtime.createElement("input");
            colorPicker.className = "zone-color-input";
            colorPicker.setAttribute(
                "aria-label",
                `${zoneLabel.textContent ?? `Zone ${index + 1}`} color`
            );
            colorPicker.setAttribute("aria-hidden", "true");
            colorPicker.type = "color";
            colorPicker.tabIndex = -1;
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
                if (!(e.target instanceof HTMLInputElement)) {
                    return;
                }

                const { value: newColor } = e.target;
                colorPreview.style.background = newColor;

                // Set color scheme to custom when manually changing a zone color
                setChartColorScheme(field, "custom");

                saveChartSpecificZoneColor(field, zoneIndex, newColor);

                // Update preview in real-time if possible
                updateZoneColorPreview(field, zoneIndex, newColor);

                // Update the inline zone color selector UIs to show the scheme changed to custom
                updateInlineZoneColorSelectors(runtime.getBody());
            });

            // Click handler for color preview
            addEventListenerWithCleanup(colorPreview, "click", () => {
                colorPicker.click();
            });

            addEventListenerWithCleanup(colorPreview, "keydown", (event) => {
                if (
                    event instanceof KeyboardEvent &&
                    (event.key === "Enter" || event.key === " ")
                ) {
                    event.preventDefault();
                    colorPicker.click();
                }
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
            const resetButton = runtime.createElement("button");
            resetButton.className = "zone-color-reset-btn";
            resetButton.textContent = "↻";
            resetButton.title = "Reset to default color";
            resetButton.type = "button";
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
                updateInlineZoneColorSelectors(runtime.getBody());
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
        const actions = runtime.createElement("div");
        actions.className = "zone-color-actions";
        actions.style.cssText = `
						display: flex;
						gap: 12px;
						justify-content: flex-end;
						padding-top: 16px;
						border-top: 1px solid rgba(255, 255, 255, 0.1);
					`;

        // Reset all button
        const resetAllButton = runtime.createElement("button");
        resetAllButton.textContent = "Reset All";
        resetAllButton.type = "button";
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

                clearZoneColorData(field, zoneData.length);

                // Enable all chart fields (set all toggles to visible)
                const settingsWrapper = getChartSettingsWrapper(
                    runtime.getDocument()
                );
                if (settingsWrapper) {
                    const fieldToggles = settingsWrapper.querySelectorAll(
                        '.field-toggle input[type="checkbox"]'
                    );
                    for (const toggle of fieldToggles) {
                        if (toggle instanceof HTMLInputElement) {
                            toggle.checked = true;
                        }
                    }
                }

                resetAllSettings();

                // Update UI and chart to reflect reset state
                updateInlineZoneColorSelectors(runtime.getBody());

                // Trigger chart re-render through state management instead of direct call
                if (chartStateManager) {
                    chartStateManager.debouncedRender("Zone colors reset");
                } else {
                    requestDirectChartRender("zone-colors-reset", runtime);
                }

                showNotification(
                    "Zone colors and settings reset to defaults",
                    "success"
                );
            } catch (error) {
                showNotification(
                    `Failed to reset zone colors: ${getErrorMessage(error)}`,
                    "error"
                );
                console.error("[ZoneColorPicker] Reset all failed:", error);
            }
        });
        // Apply button
        const applyButton = runtime.createElement("button");
        applyButton.className = "zone-color-apply-btn";
        applyButton.textContent = "Apply & Close";
        applyButton.type = "button";
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
            closeModal();

            // Trigger chart re-render through state management instead of direct call
            if (chartStateManager) {
                chartStateManager.debouncedRender("Zone colors applied");
            } else {
                requestDirectChartRender("zone-colors-applied", runtime);
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

        escapeCleanup = runtime.addDocumentKeydownListener(handleEscape);

        // Click outside to close
        addEventListenerWithCleanup(overlay, "click", (e) => {
            if (e.target === overlay && runtime.bodyContains(overlay)) {
                closeModal();
            }
        });

        // Add to DOM
        runtime.appendToBody(overlay);
        focusTrapCleanup = createModalFocusTrap(modal, closeButton);

        console.log(`[ChartJS] Zone color picker opened for ${zoneType} zones`);
    } catch (error) {
        console.error("[ChartJS] Error opening zone color picker:", error);
        showNotification("Failed to open zone color picker", "error");
    }
}

/**
 * Updates zone color preview in real-time (if chart is visible)
 *
 * @param field - The field name.
 * @param zoneIndex - Zone index, zero-based.
 * @param newColor - New color value.
 */
export function updateZoneColorPreview(
    field: string,
    zoneIndex: number,
    newColor: string
): void {
    try {
        // Find the corresponding chart instance
        const targetChart = getRegisteredChartInstances()
            .filter(isChartInstance)
            .find((chart) => {
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
