import { formatChartFields, fieldLabels, fieldColors } from "../../formatting/display/formatChartFields.js";
import { chartOptionsConfig } from "../../charts/plugins/chartOptionsConfig.js";
import { exportUtils } from "../../files/export/exportUtils.js";
import { renderChartJS } from "../../charts/core/renderChartJS.js";
import { exportAllCharts } from "../../files/export/exportAllCharts.js";
import { extractDeveloperFieldsList } from "../../data/processing/extractDeveloperFieldsList.js";
import { resetAllSettings, reRenderChartsAfterSettingChange } from "../../app/initialization/getCurrentSettings.js";
import { showNotification } from "../notifications/showNotification.js";
import { getThemeConfig } from "../../theming/core/theme.js";
import { updateAllChartStatusIndicators } from "../../charts/components/chartStatusIndicator.js";
import { createChartStatusIndicator } from "../../charts/components/createChartStatusIndicator.js";
import { chartStateManager } from "../../charts/core/chartStateManager.js";

// ==========================================
// Type Definitions (JSDoc)
// ==========================================

/**
 * @typedef {Object} WindowExtensions
 * @property {any[]} [_chartjsInstances] - ChartJS instances
 * @property {Object} [globalData] - Global data object
 * @property {any[]} [globalData.timeInZoneMesgs] - Time in zone messages
 * @property {any[]} [globalData.eventMesgs] - Event messages
 * @property {any[]} [globalData.recordMesgs] - Record messages
 */

/**
 * @typedef {Object} ChartOption
 * @property {string} id - Option identifier
 * @property {string} label - Display label
 * @property {string} type - Option type (slider, toggle, select)
 * @property {number} [min] - Minimum value for sliders
 * @property {number} [max] - Maximum value for sliders
 * @property {number} [step] - Step value for sliders
 * @property {any} [defaultValue] - Default value
 * @property {any} [default] - Default value (alternate property)
 * @property {any[]} [options] - Options for select controls
 */

/**
 * @typedef {HTMLInputElement & { timeout?: any }} HTMLInputElementExtended
 */

/**
 * @typedef {HTMLDivElement & { _updateFromReset?: Function }} HTMLDivElementExtended
 */

/**
 * Creates the settings header with title and global actions
 * @param {HTMLElement} wrapper - The wrapper element to add the header to
 */
export function createSettingsHeader(/** @type {HTMLElement} */ wrapper) {
    // Check if header already exists
    if (wrapper.querySelector(".settings-header")) {
        return;
    }
    const header = document.createElement("div");
    header.className = "settings-header";
    header.style.cssText = `
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		position: relative;
		z-index: 1;
		flex-wrap: wrap;
		gap: 12px;
	`;

    const leftSection = document.createElement("div");
    leftSection.style.cssText = `
		display: flex;
		align-items: center;
		gap: 16px;
		flex: 1;
		min-width: 200px;
	`;

    const title = document.createElement("h3");
    title.textContent = "Chart Controls";
    title.style.cssText = `
		margin: 0;
		color: var(--color-fg-alt);
		font-size: 20px;
		font-weight: 600;
		text-shadow: 0 2px 4px var(--color-shadow);
		white-space: nowrap;
	`;

    // Add chart status indicator
    const statusIndicator = createChartStatusIndicator();

    leftSection.appendChild(title);
    leftSection.appendChild(statusIndicator);

    const globalActions = document.createElement("div");
    globalActions.className = "global-actions";
    globalActions.style.cssText = `
		display: flex;		gap: 8px;
	`;

    // Reset to defaults button
    const resetBtn = createActionButton("↻ Reset", "Reset all settings to defaults", () => {
        // Provide immediate visual feedback
        resetBtn.style.opacity = "0.6";
        resetBtn.disabled = true;

        // Perform the reset
        const success = resetAllSettings();

        // Re-enable button after reset completes
        setTimeout(() => {
            resetBtn.style.opacity = "1";
            resetBtn.disabled = false;
        }, 200);

        if (!success) {
            console.error("[ResetBtn] Reset failed");
        }
    });

    // Export all charts button
    const exportAllBtn = createActionButton("📦 Export All", "Export all charts as images", () => {
        exportAllCharts();
    });

    globalActions.appendChild(resetBtn);
    globalActions.appendChild(exportAllBtn);
    header.appendChild(leftSection);
    header.appendChild(globalActions);
    wrapper.appendChild(header);
}
/**
 * Creates the main controls section with dropdowns and sliders
 * @param {HTMLElement} wrapper - The wrapper element to add the controls to
 */

export function createControlsSection(wrapper) {
    // Check if controls section already exists
    if (wrapper.querySelector(".controls-section")) {
        return;
    }

    const controlsSection = document.createElement("div");
    controlsSection.className = "controls-section";
    controlsSection.style.cssText = `
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 16px;
		margin-bottom: 20px;
		position: relative;
		z-index: 1;
	`;

    chartOptionsConfig.forEach((opt) => {
        const controlGroup = createControlGroup(opt);
        controlsSection.appendChild(controlGroup);
    });

    wrapper.appendChild(controlsSection);
}
/**
 * Creates individual control groups for each setting
 * @param {any} option - The control option configuration
 */
function createControlGroup(option) {
    const group = document.createElement("div");
    group.className = "control-group";
    group.style.cssText = `
		background: var(--color-glass);
		border-radius: 12px;
		padding: 16px;
		border: 1px solid var(--color-border);
		transition: var(--transition-smooth);
		backdrop-filter: var(--backdrop-blur);
	`;

    // Add hover effect
    group.addEventListener("mouseenter", () => {
        group.style.background = "var(--color-glass-border)";
        group.style.transform = "translateY(-2px)";
        group.style.boxShadow = "var(--color-box-shadow)";
    });

    group.addEventListener("mouseleave", () => {
        group.style.background = "var(--color-glass)";
        group.style.transform = "translateY(0)";
        group.style.boxShadow = "none";
    });

    const label = document.createElement("label");
    label.textContent = option.label;
    label.style.cssText = `
		display: block;
		color: var(--color-fg-alt);
		font-weight: 600;
		margin-bottom: 8px;
		font-size: 14px;
	`;

    if (option.description) {
        const description = document.createElement("div");
        description.textContent = option.description;
        description.style.cssText = `
			color: var(--color-fg);
			font-size: 12px;
			margin-bottom: 12px;
			line-height: 1.4;
			opacity: 0.8;
		`;
        group.appendChild(description);
    }

    let control;
    if (option.type === "range") {
        control = createRangeControl(option);
    } else if (option.type === "toggle") {
        control = createToggleControl(option);
    } else {
        control = createSelectControl(option);
    }

    group.appendChild(label);
    group.appendChild(control);
    return group;
}
/**
 * Creates a range slider control
 * @param {ChartOption} option - The range control option configuration
 */
function createRangeControl(/** @type {ChartOption} */ option) {
    const container = document.createElement("div");
    container.style.cssText = `
		position: relative;
	`;

    const slider = /** @type {HTMLInputElementExtended} */ (document.createElement("input"));
    slider.type = "range";
    slider.id = `chartjs-${option.id}-slider`;
    slider.min = String(option.min || 0);
    slider.max = String(option.max || 100);
    slider.step = String(option.step || 1);
    slider.value = localStorage.getItem(`chartjs_${option.id}`) || String(option.default || option.defaultValue || 0);

    slider.style.cssText = `
		width: 100%;
		height: 6px;
		background: linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) 50%, var(--color-border) 50%, var(--color-border) 100%);
		border-radius: 3px;
		outline: none;
		-webkit-appearance: none;
		cursor: pointer;
	`;

    // Style the thumb
    const style = document.createElement("style");
    style.textContent = `
		#${slider.id}::-webkit-slider-thumb {
			-webkit-appearance: none;
			width: 18px;
			height: 18px;
			background: var(--color-btn-bg);
			border-radius: 50%;
			cursor: pointer;
			box-shadow: var(--color-box-shadow-light);
			border: 2px solid var(--color-fg-alt);
		}
		#${slider.id}::-moz-range-thumb {
			width: 18px;
			height: 18px;
			background: var(--color-btn-bg);
			border-radius: 50%;
			cursor: pointer;
			border: 2px solid var(--color-fg-alt);
		}
	`;
    document.head.appendChild(style);

    const valueDisplay = document.createElement("span");
    valueDisplay.textContent = slider.value;
    valueDisplay.style.cssText = `
		position: absolute;
		right: 0;
		top: -24px;
		background: var(--color-accent);
		color: var(--color-fg-alt);
		padding: 2px 8px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 600;
	`;

    slider.addEventListener("input", (/** @type {Event} */ e) => {
        const target = /** @type {HTMLInputElement} */ (e.target);
        if (target) {
            valueDisplay.textContent = target.value;
            localStorage.setItem(`chartjs_${option.id}`, target.value);

            // Update slider background
            const minVal = option.min || 0;
            const maxVal = option.max || 100;
            const percentage = ((Number(target.value) - minVal) / (maxVal - minVal)) * 100;
            slider.style.background = `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${percentage}%, var(--color-border) ${percentage}%, var(--color-border) 100%)`;

            // Debounced re-render using the same approach as the reset button
            clearTimeout(slider.timeout);
            slider.timeout = setTimeout(function () {
                reRenderChartsAfterSettingChange(option.id, target.value);
            }, 300);
        }
    });

    // Initialize slider background
    // Set initial background
    const minVal = option.min || 0;
    const maxVal = option.max || 100;
    const initialPercentage = ((Number(slider.value) - minVal) / (maxVal - minVal)) * 100;
    slider.style.background = `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${initialPercentage}%, var(--color-border) ${initialPercentage}%, var(--color-border) 100%)`;

    container.appendChild(valueDisplay);
    container.appendChild(slider);
    return container;
}
/**
 * Creates a toggle switch control
 */
function createToggleControl(/** @type {ChartOption} */ option) {
    const container = /** @type {HTMLDivElementExtended} */ (document.createElement("div"));
    container.style.cssText = `
		display: flex;
		align-items: center;
		gap: 8px;
	`;

    const toggle = document.createElement("div");
    toggle.className = "toggle-switch";
    toggle.style.cssText = `
		width: 48px;
		height: 24px;
		background: var(--color-border);
		border-radius: 12px;
		position: relative;
		cursor: pointer;
		transition: var(--transition-smooth);
	`;

    const toggleThumb = document.createElement("div");
    toggleThumb.className = "toggle-thumb";
    toggleThumb.style.cssText = `
		width: 20px;
		height: 20px;
		background: var(--color-fg-alt);
		border-radius: 50%;
		position: absolute;
		top: 2px;
		left: 2px;
		transition: var(--transition-smooth);
		box-shadow: var(--color-box-shadow-light);
	`;

    // Get current value with proper boolean conversion
    function getCurrentValue() {
        const stored = localStorage.getItem(`chartjs_${option.id}`);
        if (stored === null) {
            return option.default; // Use default from config (boolean)
        }
        // Handle both string and boolean representations
        return stored === "true" || stored === "on";
    }

    // Set visual state based on boolean value
    function updateVisualState(/** @type {boolean} */ isOn) {
        if (isOn) {
            toggle.style.background = "var(--color-success)";
            toggleThumb.style.left = "26px";
            statusText.textContent = "On";
            statusText.style.color = "var(--color-success)";
            statusText.style.opacity = "1";
        } else {
            toggle.style.background = "var(--color-border)";
            toggleThumb.style.left = "2px";
            statusText.textContent = "Off";
            statusText.style.color = "var(--color-fg)";
            statusText.style.opacity = "0.7";
        }
    }

    const statusText = document.createElement("span");
    statusText.style.cssText = `
		font-weight: 600;
		font-size: 14px;
		min-width: 24px;
		transition: all 0.3s ease;
	`;

    // Initialize with current value
    let isOn = getCurrentValue();
    updateVisualState(isOn);

    toggle.appendChild(toggleThumb);

    toggle.addEventListener("click", () => {
        // Toggle the current state
        isOn = !isOn;

        // Store as string for consistency with existing system
        localStorage.setItem(`chartjs_${option.id}`, isOn ? "true" : "false");

        // Update visual state
        updateVisualState(isOn);

        // Re-render charts using the same approach as the reset button
        reRenderChartsAfterSettingChange(option.id, isOn);
    });

    // Add method to update from external reset
    container._updateFromReset = function () {
        isOn = getCurrentValue();
        updateVisualState(isOn);
    };

    container.appendChild(toggle);
    container.appendChild(statusText);
    return container;
}
/**
 * Creates a select dropdown control
 */
function createSelectControl(/** @type {ChartOption} */ option) {
    const select = document.createElement("select");
    select.id = `chartjs-${option.id}-dropdown`;
    select.style.cssText = `
		width: 100%;
		padding: 10px 12px;
		border-radius: 8px;
		border: 1px solid var(--color-border);
		background: var(--color-glass);
		color: var(--color-fg);
		font-size: 14px;
		cursor: pointer;
		transition: var(--transition-smooth);
		outline: none;
		backdrop-filter: var(--backdrop-blur);
	`;

    select.addEventListener("focus", () => {
        select.style.borderColor = "var(--color-accent)";
        select.style.boxShadow = "0 0 0 2px var(--color-accent-secondary)";
    });

    select.addEventListener("blur", () => {
        select.style.borderColor = "var(--color-border)";
        select.style.boxShadow = "none";
    });

    option.options?.forEach((/** @type {any} */ val) => {
        const optionEl = document.createElement("option");
        optionEl.value = val;
        optionEl.textContent =
            val === "all"
                ? "All Points"
                : val === "on"
                  ? "Enabled"
                  : val === "off"
                    ? "Disabled"
                    : String(val).charAt(0).toUpperCase() + String(val).slice(1);
        optionEl.style.background = "var(--color-bg-solid)";
        optionEl.style.color = "var(--color-fg)";
        select.appendChild(optionEl);
    });

    const stored = localStorage.getItem(`chartjs_${option.id}`);
    select.value = stored !== null ? stored : option.default;

    // Mouse wheel support for maxpoints
    if (option.id === "maxpoints") {
        select.addEventListener(
            "wheel",
            (e) => {
                e.preventDefault();
                const idx = option.options?.indexOf(select.value === "all" ? "all" : Number(select.value)) ?? -1;
                let newIdx = idx + (e.deltaY > 0 ? 1 : -1);
                if (newIdx < 0) newIdx = 0;
                if (newIdx >= (option.options?.length ?? 0)) newIdx = (option.options?.length ?? 1) - 1;
                select.value = option.options?.[newIdx] ?? "";
                select.dispatchEvent(new Event("change"));
            },
            { passive: false }
        );
    }

    select.addEventListener("change", (/** @type {Event} */ e) => {
        const target = /** @type {HTMLSelectElement} */ (e.target);
        if (target) {
            localStorage.setItem(`chartjs_${option.id}`, target.value);
            reRenderChartsAfterSettingChange(option.id, target.value);
        }
    });

    return select;
}
/**
 * Shows a modal to select which chart(s) to use for an action
 * @param {string} actionType - Type of action (copy, save, print, etc.)
 * @param {Function} singleCallback - Callback for single chart selection
 * @param {Function} combinedCallback - Callback for combined charts action
 */

export function showChartSelectionModal(actionType, singleCallback, combinedCallback) {
    const charts = /** @type {WindowExtensions} */ (window)._chartjsInstances;
    if (!charts || charts.length === 0) {
        showNotification("No charts available", "warning");
        return;
    }

    // Filter out invalid charts using exportUtils validation
    const validCharts = charts.filter((/** @type {any} */ chart) => exportUtils.isValidChart(chart));

    if (validCharts.length === 0) {
        showNotification("No valid charts available", "warning");
        return;
    }

    if (validCharts.length === 1) {
        // Only one valid chart, execute single callback directly
        singleCallback(validCharts[0]);
        return;
    }

    // Create modal overlay
    const overlay = document.createElement("div");
    overlay.style.cssText = `
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: var(--color-overlay-bg);
		backdrop-filter: blur(8px);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 10000;
	`;

    // Create modal content
    const modal = document.createElement("div");
    modal.style.cssText = `
		background: var(--color-modal-bg);
		border-radius: var(--border-radius);
		padding: 24px;
		max-width: 500px;
		width: 90%;
		max-height: 70vh;
		overflow-y: auto;
		border: 1px solid var(--color-glass-border);
		box-shadow: var(--color-box-shadow);
	`;

    // Modal title
    const title = document.createElement("h3");
    title.textContent = `Select Chart to ${actionType}`;
    title.style.cssText = `
		margin: 0 0 16px 0;
		color: var(--color-modal-fg);
		text-align: center;
	`;

    // Chart selection list
    const chartList = document.createElement("div");
    chartList.style.cssText = `
		margin-bottom: 20px;
	`;

    validCharts.forEach((/** @type {any} */ chart, /** @type {number} */ index) => {
        const dataset = chart.data.datasets[0];
        const fieldName = dataset?.label || `Chart ${index + 1}`;

        const chartItem = document.createElement("button");
        chartItem.textContent = `📊 ${fieldName}`;
        chartItem.style.cssText = `
			display: block;
			width: 100%;
			padding: 12px;
			margin-bottom: 8px;
			background: var(--color-glass);
			border: 1px solid var(--color-border);
			border-radius: var(--border-radius-small);
			color: var(--color-modal-fg);
			cursor: pointer;
			font-size: 14px;
			text-align: left;
			transition: var(--transition-smooth);
		`;

        chartItem.addEventListener("mouseenter", () => {
            chartItem.style.background = "var(--color-accent-hover)";
        });

        chartItem.addEventListener("mouseleave", () => {
            chartItem.style.background = "var(--color-glass)";
        });

        chartItem.addEventListener("click", () => {
            document.body.removeChild(overlay);
            singleCallback(chart); // Pass the actual chart object, not the index
        });

        chartList.appendChild(chartItem);
    });

    // Combined option
    const combinedItem = document.createElement("button");
    combinedItem.textContent = `🔗 All Charts Combined (${validCharts.length} charts)`;
    combinedItem.style.cssText = `
		display: block;
		width: 100%;
		padding: 12px;
		margin-bottom: 16px;
		background: var(--color-accent-hover);
		border: 1px solid var(--color-accent);
		border-radius: 8px;
		color: var(--color-fg-alt);
		cursor: pointer;
		font-size: 14px;
		text-align: left;
		transition: all 0.3s ease;
	`;

    combinedItem.addEventListener("mouseenter", () => {
        combinedItem.style.background = "var(--color-accent-hover)";
    });

    combinedItem.addEventListener("mouseleave", () => {
        combinedItem.style.background = "var(--color-accent-hover)";
    });

    combinedItem.addEventListener("click", () => {
        document.body.removeChild(overlay);
        combinedCallback(validCharts);
    });

    // Cancel button
    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.style.cssText = `
		width: 100%;
		padding: 12px;
		background: var(--color-border-light);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		color: var(--color-fg-alt);
		cursor: pointer;
		font-size: 14px;
		transition: all 0.3s ease;
	`;

    cancelButton.addEventListener("click", () => {
        document.body.removeChild(overlay);
    });

    // ESC key handler
    const handleEscape = (/** @type {KeyboardEvent} */ e) => {
        if (e.key === "Escape") {
            document.body.removeChild(overlay);
            document.removeEventListener("keydown", handleEscape);
        }
    };
    document.addEventListener("keydown", handleEscape);

    // Click outside to close
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });

    // Assemble modal
    modal.appendChild(title);
    modal.appendChild(chartList);
    modal.appendChild(combinedItem);
    modal.appendChild(cancelButton);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}
/**
 * Creates the export section with various export options
 */

export function createExportSection(/** @type {HTMLElement} */ wrapper) {
    // Check if export section already exists
    if (wrapper.querySelector(".export-section")) {
        return;
    }

    const exportSection = document.createElement("div");
    exportSection.className = "export-section";
    exportSection.style.cssText = `
		background: var(--color-glass);
		border-radius: 12px;
		padding: 16px;
		margin-bottom: 20px;
		border: 1px solid var(--color-accent);
		position: relative;
		z-index: 1;
		backdrop-filter: var(--backdrop-blur);
	`;
    const exportTitle = document.createElement("h4");
    exportTitle.textContent = "Export & Share";
    exportTitle.style.cssText = `
		margin: 0 0 12px 0;
		color: var(--color-accent);
		font-size: 16px;
		font-weight: 600;
	`;

    const exportGrid = document.createElement("div");
    exportGrid.style.cssText = `
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 8px;
	`;

    const exportButtons = [
        {
            icon: "📷",
            text: "Save PNG",
            action: () =>
                showChartSelectionModal(
                    "Save as PNG",
                    (/** @type {any} */ chart) => {
                        const dataset = chart.data.datasets[0];
                        const fieldName = dataset?.label || "chart";
                        const filename = `${fieldName.replace(/\s+/g, "-").toLowerCase()}-chart.png`;
                        exportUtils.downloadChartAsPNG(chart, filename);
                    },
                    (/** @type {any} */ charts) => exportUtils.createCombinedChartsImage(charts, "combined-charts.png")
                ),
        },
        {
            icon: "📋",
            text: "Copy Image",
            action: () =>
                showChartSelectionModal(
                    "Copy to Clipboard",
                    (/** @type {any} */ chart) => exportUtils.copyChartToClipboard(chart),
                    (/** @type {any} */ charts) => exportUtils.copyCombinedChartsToClipboard(charts)
                ),
        },
        {
            icon: "📊",
            text: "Export CSV",
            action: () =>
                showChartSelectionModal(
                    "Export as CSV",
                    (/** @type {any} */ chart) => {
                        const dataset = chart.data.datasets[0];
                        if (dataset && dataset.data) {
                            const fieldName = dataset.label || "chart";
                            const filename = `${fieldName.replace(/\s+/g, "-").toLowerCase()}-data.csv`;
                            exportUtils.exportChartDataAsCSV(dataset.data, fieldName, filename);
                        }
                    },
                    (/** @type {any} */ charts) =>
                        exportUtils.exportCombinedChartsDataAsCSV(charts, "combined-charts-data.csv")
                ),
        },
        {
            icon: "📄",
            text: "Export JSON",
            action: () =>
                showChartSelectionModal(
                    "Export as JSON",
                    (/** @type {any} */ chart) => {
                        const dataset = chart.data.datasets[0];
                        if (dataset && dataset.data) {
                            const fieldName = dataset.label || "chart";
                            const filename = `${fieldName.replace(/\s+/g, "-").toLowerCase()}-data.json`;
                            exportUtils.exportChartDataAsJSON(dataset.data, fieldName, filename);
                        }
                    },
                    (/** @type {any} */ charts) => {
                        const allChartsData = {
                            exportedAt: new Date().toISOString(),
                            charts: charts.map((/** @type {any} */ chart, /** @type {number} */ index) => {
                                const dataset = chart.data.datasets[0];
                                return {
                                    field: dataset?.label || `chart-${index}`,
                                    data: dataset?.data || [],
                                    type: chart.config.type,
                                    totalPoints: dataset?.data ? dataset.data.length : 0,
                                };
                            }),
                        };
                        const blob = new Blob([JSON.stringify(allChartsData, null, 2)], {
                            type: "application/json;charset=utf-8;",
                        });
                        const link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        link.download = "combined-charts-data.json";
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        showNotification("Combined chart data exported as JSON", "success");
                    }
                ),
        },
        {
            icon: "🖨️",
            text: "Print",
            action: () =>
                showChartSelectionModal(
                    "Print",
                    (/** @type {any} */ chart) => exportUtils.printChart(chart),
                    (/** @type {any} */ charts) => exportUtils.printCombinedCharts(charts)
                ),
        },
        {
            icon: "�",
            text: "Export ZIP",
            action: () => {
                const charts = /** @type {WindowExtensions} */ (window)._chartjsInstances;
                if (!charts || charts.length === 0) {
                    showNotification("No charts available to export", "warning");
                    return;
                }
                exportUtils.exportAllAsZip(charts);
            },
        },
        {
            icon: "🔗",
            text: "Share URL",
            action: () => exportUtils.shareChartsAsURL(),
        },
        {
            icon: "📸",
            text: "Share Gyazo",
            action: () => {
                if (!exportUtils.isGyazoAuthenticated()) {
                    showNotification("Please connect your Gyazo account first", "warning");
                    exportUtils.showGyazoAccountManager();
                    return;
                }
                exportUtils.shareChartsToGyazo();
            },
        },
        {
            icon: "⚙️",
            text: "Gyazo Settings",
            action: () => exportUtils.showGyazoAccountManager(),
        },
    ];

    exportButtons.forEach((btn) => {
        const button = createActionButton(
            `${btn.icon} ${btn.text}`,
            `${btn.text} for charts`,
            btn.action,
            "export-btn"
        );
        exportGrid.appendChild(button);
    });

    exportSection.appendChild(exportTitle);
    exportSection.appendChild(exportGrid);
    wrapper.appendChild(exportSection);
}
/**
 * Creates the field toggles section for showing/hiding specific metrics
 */

export function createFieldTogglesSection(/** @type {HTMLElement} */ wrapper) {
    // Check if fields section already exists
    if (wrapper.querySelector(".fields-section")) {
        return;
    }

    const fieldsSection = document.createElement("div");
    fieldsSection.className = "fields-section";
    fieldsSection.style.cssText = `
		background: var(--color-glass);
		border-radius: 12px;
		padding: 16px;
		border: 1px solid var(--color-accent-secondary);
		position: relative;
		z-index: 1;
		backdrop-filter: var(--backdrop-blur);
	`;
    const fieldsTitle = document.createElement("div");
    fieldsTitle.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 0 0 12px 0;
    `;

    const titleText = document.createElement("h4");
    titleText.textContent = "Visible Metrics";
    titleText.style.cssText = `
        margin: 0;
        color: var(--color-accent-secondary);
        font-size: 16px;
        font-weight: 600;
    `;

    const toggleAllContainer = document.createElement("div");
    toggleAllContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
    `;

    const enableAllBtn = document.createElement("button");
    enableAllBtn.textContent = "Enable All";
    enableAllBtn.style.cssText = `
        padding: 4px 8px;
        border: 1px solid var(--color-success);
        border-radius: 4px;
        background: var(--color-success);
        color: white;
        font-size: 11px;
        cursor: pointer;
        transition: var(--transition-smooth);
    `;

    const disableAllBtn = document.createElement("button");
    disableAllBtn.textContent = "Disable All";
    disableAllBtn.style.cssText = `
        padding: 4px 8px;
        border: 1px solid var(--color-error);
        border-radius: 4px;
        background: var(--color-error);
        color: white;
        font-size: 11px;
        cursor: pointer;
        transition: var(--transition-smooth);
    `;

    // Add hover effects
    enableAllBtn.addEventListener("mouseenter", () => {
        enableAllBtn.style.opacity = "0.8";
        enableAllBtn.style.transform = "translateY(-1px)";
    });
    enableAllBtn.addEventListener("mouseleave", () => {
        enableAllBtn.style.opacity = "1";
        enableAllBtn.style.transform = "translateY(0)";
    });

    disableAllBtn.addEventListener("mouseenter", () => {
        disableAllBtn.style.opacity = "0.8";
        disableAllBtn.style.transform = "translateY(-1px)";
    });
    disableAllBtn.addEventListener("mouseleave", () => {
        disableAllBtn.style.opacity = "1";
        disableAllBtn.style.transform = "translateY(0)";
    });

    // Add click handlers
    enableAllBtn.addEventListener("click", () => {
        toggleAllFields(true);
    });

    disableAllBtn.addEventListener("click", () => {
        toggleAllFields(false);
    });

    toggleAllContainer.appendChild(enableAllBtn);
    toggleAllContainer.appendChild(disableAllBtn);

    fieldsTitle.appendChild(titleText);
    fieldsTitle.appendChild(toggleAllContainer);

    const fieldsGrid = document.createElement("div");
    fieldsGrid.style.cssText = `
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 12px;
	`; // Add field toggles
    /** @type {string[]} */ (/** @type {unknown} */ (formatChartFields)).forEach((/** @type {string} */ field) => {
        const fieldToggle = createFieldToggle(field);
        fieldsGrid.appendChild(fieldToggle);
    }); // Add GPS track toggle
    const gpsTrackToggle = createFieldToggle("gps_track");
    fieldsGrid.appendChild(gpsTrackToggle);

    // Add performance analysis chart toggles
    const speedVsDistanceToggle = createFieldToggle("speed_vs_distance");
    fieldsGrid.appendChild(speedVsDistanceToggle);

    const powerVsHRToggle = createFieldToggle("power_vs_hr");
    fieldsGrid.appendChild(powerVsHRToggle);
    const altitudeProfileToggle = createFieldToggle("altitude_profile");
    fieldsGrid.appendChild(altitudeProfileToggle); // HR zone toggles will be moved to the HR zone controls section
    const hrZoneDoughnutToggle = createFieldToggle("hr_zone_doughnut");
    fieldsGrid.appendChild(hrZoneDoughnutToggle);

    // Power zone toggles are created separately and moved to the dedicated power zone section
    const powerZoneDoughnutToggle = createFieldToggle("power_zone_doughnut");
    fieldsGrid.appendChild(powerZoneDoughnutToggle);

    // Add lap zone chart toggles if data exists
    if (/** @type {WindowExtensions} */ (window).globalData?.timeInZoneMesgs) {
        const timeInZoneMesgs = /** @type {WindowExtensions} */ (window).globalData.timeInZoneMesgs;
        const lapZoneMsgs = timeInZoneMesgs.filter((/** @type {any} */ msg) => msg.referenceMesg === "lap");

        if (lapZoneMsgs.length > 0) {
            // Check for HR lap zone data
            const hrLapZones = lapZoneMsgs.filter((/** @type {any} */ msg) => msg.timeInHrZone);
            if (hrLapZones.length > 0) {
                const hrLapStackedToggle = createFieldToggle("hr_lap_zone_stacked");
                fieldsGrid.appendChild(hrLapStackedToggle);

                const hrLapIndividualToggle = createFieldToggle("hr_lap_zone_individual");
                fieldsGrid.appendChild(hrLapIndividualToggle);
            }

            // Check for Power lap zone data
            const powerLapZones = lapZoneMsgs.filter((/** @type {any} */ msg) => msg.timeInPowerZone);
            if (powerLapZones.length > 0) {
                const powerLapStackedToggle = createFieldToggle("power_lap_zone_stacked");
                fieldsGrid.appendChild(powerLapStackedToggle);

                const powerLapIndividualToggle = createFieldToggle("power_lap_zone_individual");
                fieldsGrid.appendChild(powerLapIndividualToggle);
            }
        }
    }

    // Add event messages toggle if data exists
    if (
        /** @type {WindowExtensions} */ (window).globalData?.eventMesgs &&
        Array.isArray(/** @type {WindowExtensions} */ (window).globalData.eventMesgs) &&
        /** @type {WindowExtensions} */ (window).globalData.eventMesgs.length > 0
    ) {
        const eventMessagesToggle = createFieldToggle("event_messages");
        fieldsGrid.appendChild(eventMessagesToggle);
    }

    // Add developer fields toggles if data exists
    if (
        /** @type {WindowExtensions} */ (window).globalData &&
        /** @type {WindowExtensions} */ (window).globalData.recordMesgs
    ) {
        const devFields = extractDeveloperFieldsList(/** @type {WindowExtensions} */ (window).globalData.recordMesgs);
        devFields.forEach((field) => {
            const fieldToggle = createFieldToggle(field);
            fieldsGrid.appendChild(fieldToggle);
        });
    }

    fieldsSection.appendChild(fieldsTitle);
    fieldsSection.appendChild(fieldsGrid);
    wrapper.appendChild(fieldsSection);
}
/**
 * Creates individual field toggle controls
 */
function createFieldToggle(/** @type {string} */ field) {
    const themeConfig = getThemeConfig();
    const container = document.createElement("div");
    container.className = "field-toggle";

    // Check if this field has valid data
    let hasValidData = false;
    if (
        /** @type {WindowExtensions} */ (window).globalData &&
        /** @type {WindowExtensions} */ (window).globalData.recordMesgs &&
        /** @type {WindowExtensions} */ (window).globalData.recordMesgs.length > 0
    ) {
        const data = /** @type {WindowExtensions} */ (window).globalData.recordMesgs;

        if (field === "gps_track") {
            hasValidData = data.some((row) => {
                const lat = row.positionLat;
                const long = row.positionLong;
                return (
                    (lat !== undefined && lat !== null && !isNaN(parseFloat(lat))) ||
                    (long !== undefined && long !== null && !isNaN(parseFloat(long)))
                );
            });
        } else if (field === "event_messages") {
            hasValidData = Boolean(
                /** @type {WindowExtensions} */ (window).globalData?.eventMesgs &&
                    Array.isArray(/** @type {WindowExtensions} */ (window).globalData.eventMesgs) &&
                    /** @type {WindowExtensions} */ (window).globalData.eventMesgs.length > 0
            );
        } else if (field === "speed_vs_distance") {
            const hasSpeed = data.some((row) => {
                const speed = row.enhancedSpeed || row.speed;
                return speed !== undefined && speed !== null && !isNaN(parseFloat(speed));
            });
            const hasDistance = data.some((row) => {
                const distance = row.distance;
                return distance !== undefined && distance !== null && !isNaN(parseFloat(distance));
            });
            hasValidData = hasSpeed && hasDistance;
        } else if (field === "power_vs_hr") {
            const hasPower = data.some((row) => {
                const power = row.power;
                return power !== undefined && power !== null && !isNaN(parseFloat(power));
            });
            const hasHeartRate = data.some((row) => {
                const hr = row.heartRate;
                return hr !== undefined && hr !== null && !isNaN(parseFloat(hr));
            });
            hasValidData = hasPower && hasHeartRate;
        } else if (field === "altitude_profile") {
            hasValidData = data.some((row) => {
                const altitude = row.altitude || row.enhancedAltitude;
                return altitude !== undefined && altitude !== null && !isNaN(parseFloat(altitude));
            });
        } else if (field === "hr_lap_zone_stacked" || field === "hr_lap_zone_individual") {
            // Check for HR lap zone data
            if (/** @type {WindowExtensions} */ (window).globalData?.timeInZoneMesgs) {
                const timeInZoneMesgs = /** @type {WindowExtensions} */ (window).globalData.timeInZoneMesgs;
                const lapZoneMsgs = timeInZoneMesgs.filter((/** @type {any} */ msg) => msg.referenceMesg === "lap");
                const hrLapZones = lapZoneMsgs.filter((/** @type {any} */ msg) => msg.timeInHrZone);
                hasValidData = hrLapZones.length > 0;
            }
        } else if (field === "power_lap_zone_stacked" || field === "power_lap_zone_individual") {
            // Check for Power lap zone data
            if (/** @type {WindowExtensions} */ (window).globalData?.timeInZoneMesgs) {
                const timeInZoneMesgs = /** @type {WindowExtensions} */ (window).globalData.timeInZoneMesgs;
                const lapZoneMsgs = timeInZoneMesgs.filter((/** @type {any} */ msg) => msg.referenceMesg === "lap");
                const powerLapZones = lapZoneMsgs.filter((/** @type {any} */ msg) => msg.timeInPowerZone);
                hasValidData = powerLapZones.length > 0;
            }
        } else if (field.includes("hr_zone")) {
            hasValidData = data.some((row) => {
                const hr = row.heartRate;
                return hr !== undefined && hr !== null && !isNaN(parseFloat(hr));
            });
        } else if (field.includes("power_zone")) {
            hasValidData = data.some((row) => {
                const power = row.power;
                return power !== undefined && power !== null && !isNaN(parseFloat(power));
            });
        } else if (/** @type {string[]} */ (/** @type {unknown} */ (formatChartFields)).includes(field)) {
            // Regular chart field
            const numericData = data.map((row) => {
                if (row[field] !== undefined && row[field] !== null) {
                    const value = parseFloat(row[field]);
                    return isNaN(value) ? null : value;
                }
                return null;
            });
            hasValidData = !numericData.every((val) => val === null);
        } else {
            // Developer field
            const numericData = data.map((row) => {
                if (row[field] !== undefined && row[field] !== null) {
                    const value = parseFloat(row[field]);
                    return isNaN(value) ? null : value;
                }
                return null;
            });
            hasValidData = !numericData.every((val) => val === null);
        }
    }

    container.style.cssText = `
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		background: var(--color-glass);
		border-radius: 8px;
		border: 1px solid var(--color-border);
		transition: var(--transition-smooth);
		backdrop-filter: var(--backdrop-blur);
		${!hasValidData ? "opacity: 0.5; filter: grayscale(0.7);" : ""}
	`;

    // Toggle switch
    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.id = `field-toggle-${field}`;
    toggle.checked = localStorage.getItem(`chartjs_field_${field}`) !== "hidden";
    toggle.style.cssText = `
		width: 18px;
		height: 18px;
		cursor: pointer;
	`;

    // Field label
    const label = document.createElement("label");
    label.textContent = fieldLabels[field] || field;
    label.htmlFor = `field-toggle-${field}`;
    label.style.cssText = `
		flex: 1;
		color: var(--color-fg);
		font-size: 14px;
		cursor: pointer;	`; // Check if this is a zone chart - zone charts no longer get individual color pickers
    const isHRZoneChart = field.includes("hr_zone");
    const isPowerZoneChart = field.includes("power_zone");
    const isZoneChart = isHRZoneChart || isPowerZoneChart;
    const isLapZoneChart = field.includes("lap_zone");

    if (isZoneChart) {
        // Zone charts now only get toggle and label - unified color picker is in their dedicated sections
        container.appendChild(toggle);
        container.appendChild(label);
    } else if (isLapZoneChart) {
        // Lap zone charts only get toggle, no color picker (they use the same zone colors)
        container.appendChild(toggle);
        container.appendChild(label);
    } else {
        // Regular color picker for non-zone charts
        const colorPicker = document.createElement("input");
        colorPicker.type = "color";
        colorPicker.value =
            localStorage.getItem(`chartjs_color_${field}`) ||
            /** @type {any} */ (fieldColors)[field] ||
            /** @type {any} */ (themeConfig).colors?.primaryAlpha;
        colorPicker.style.cssText = `
			width: 32px;
			height: 32px;
			border: none;
			border-radius: 6px;
			cursor: pointer;
			background: none;
		`; // Event listeners for color picker
        colorPicker.addEventListener("change", () => {
            localStorage.setItem(`chartjs_color_${field}`, colorPicker.value);

            // Dispatch custom event for color change
            window.dispatchEvent(
                new CustomEvent("fieldToggleChanged", {
                    detail: { field, type: "color", value: colorPicker.value },
                })
            );

            reRenderChartsAfterSettingChange(`${field}_color`, colorPicker.value);
        });

        container.appendChild(toggle);
        container.appendChild(label);
        container.appendChild(colorPicker);
    } // Event listeners for toggle
    toggle.addEventListener("change", () => {
        const visibility = toggle.checked ? "visible" : "hidden";
        localStorage.setItem(`chartjs_field_${field}`, visibility);

        // Dispatch custom event for field toggle change (for real-time updates)
        window.dispatchEvent(
            new CustomEvent("fieldToggleChanged", {
                detail: { field, visibility },
            })
        );

        // Trigger chart re-render through modern state management
        if (chartStateManager) {
            chartStateManager.debouncedRender(`Field toggle: ${field}`);
        } else {
            renderChartJS("all"); // Fallback for compatibility
        }

        // Update status indicators after a short delay to allow charts to render
        setTimeout(function () {
            updateAllChartStatusIndicators();
        }, 100);
    });
    // Hover effects
    container.addEventListener("mouseenter", () => {
        container.style.background = "var(--color-glass-border)";
        container.style.transform = "translateY(-1px)";
    });

    container.addEventListener("mouseleave", () => {
        container.style.background = "var(--color-glass)";
        container.style.transform = "translateY(0)";
    });

    return container;
}
/**
 * Creates styled action buttons
 */
function createActionButton(
    /** @type {string} */ text,
    /** @type {string} */ title,
    /** @type {() => void} */ onClick,
    /** @type {string} */ className = ""
) {
    const button = document.createElement("button");
    button.textContent = text;
    button.title = title;
    button.className = className;
    button.style.cssText = `
		padding: 8px 12px;
		border: none;
		border-radius: 8px;
		background: var(--color-btn-bg);
		color: var(--color-fg-alt);
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: var(--transition-smooth);
		border: 1px solid var(--color-border);
		white-space: nowrap;
		backdrop-filter: var(--backdrop-blur);
	`;

    button.addEventListener("mouseenter", () => {
        button.style.background = "var(--color-btn-hover)";
        button.style.transform = "translateY(-1px)";
        button.style.boxShadow = "var(--color-box-shadow-light)";
    });

    button.addEventListener("mouseleave", () => {
        button.style.background = "var(--color-btn-bg)";
        button.style.transform = "translateY(0)";
        button.style.boxShadow = "none";
    });

    button.addEventListener("click", onClick);
    return button;
} /**
 * Applies modern styling to the settings panel
 */

export function applySettingsPanelStyles(/** @type {HTMLElement} */ wrapper) {
    wrapper.style.cssText = `
		background: var(--color-bg-alt);
		border-radius: var(--border-radius);
		padding: 20px;
		margin: 16px 0;
		box-shadow: var(--color-box-shadow);
		border: 1px solid var(--color-border);
		position: relative;
		overflow: hidden;
		backdrop-filter: var(--backdrop-blur);
	`;

    // Add subtle animated background effect
    const bgEffect = document.createElement("div");
    bgEffect.style.cssText = `
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: radial-gradient(circle at 20% 50%, var(--color-accent) 0%, transparent 50%),
					radial-gradient(circle at 80% 50%, var(--color-accent-secondary) 0%, transparent 50%);
		opacity: 0.05;
		pointer-events: none;
		z-index: 0;
	`;
    wrapper.appendChild(bgEffect);
}

/**
 * Toggles all field visibility at once
 * @param {boolean} enable - Whether to enable or disable all fields
 */
function toggleAllFields(enable) {
    try {
        const visibility = enable ? "visible" : "hidden";

        // Get all possible field keys
        const allFields = [
            .../** @type {string[]} */ (/** @type {unknown} */ (formatChartFields)),
            "gps_track",
            "speed_vs_distance",
            "power_vs_hr",
            "altitude_profile",
            "hr_zone_doughnut",
            "power_zone_doughnut",
            "event_messages",
            "hr_lap_zone_stacked",
            "hr_lap_zone_individual",
            "power_lap_zone_stacked",
            "power_lap_zone_individual",
        ];

        // Add developer fields if they exist
        if (
            /** @type {WindowExtensions} */ (window).globalData &&
            /** @type {WindowExtensions} */ (window).globalData.recordMesgs
        ) {
            const devFields = extractDeveloperFieldsList(
                /** @type {WindowExtensions} */ (window).globalData.recordMesgs
            );
            allFields.push(...devFields);
        } // Update localStorage for all fields
        allFields.forEach((field) => {
            localStorage.setItem(`chartjs_field_${field}`, visibility);
        });

        // Dispatch custom event for bulk field toggle change
        window.dispatchEvent(
            new CustomEvent("fieldToggleChanged", {
                detail: { fields: allFields, visibility },
            })
        );

        // Update all toggle checkboxes in the UI
        const toggles = document.querySelectorAll('.field-toggle input[type="checkbox"]');
        toggles.forEach((toggle) => {
            /** @type {HTMLInputElement} */ (toggle).checked = enable;
        });

        // Show notification
        const action = enable ? "enabled" : "disabled";
        showNotification(`All charts ${action}`, "success");

        // Re-render charts and update status indicators through modern state management
        if (chartStateManager) {
            chartStateManager.debouncedRender(`All fields ${action}`);
        } else {
            renderChartJS("all"); // Fallback for compatibility
        }

        setTimeout(function () {
            updateAllChartStatusIndicators();
        }, 100);
    } catch (error) {
        console.error("[Settings] Error toggling all fields:", error);
        showNotification("Error updating chart visibility", "error");
    }
}
