import { chartFields, fieldLabels, fieldColors } from "./chartFields.js";
import { chartOptionsConfig } from "./chartOptionsConfig.js";
import { ExportUtils } from "./ExportUtils.js";
import { renderChartJS } from "./renderChartJS.js";
import { exportAllCharts } from "./exportAllCharts.js";
import { extractDeveloperFieldsList } from "./extractDeveloperFieldsList.js";
import { openZoneColorPicker } from "./openZoneColorPicker.js";
import { resetAllSettings } from "./getCurrentSettings.js";
import { showNotification } from "./showNotification.js";
import { getThemeConfig } from "./theme.js";

/**
 * Creates the settings header with title and global actions
 */

export function createSettingsHeader(wrapper) {
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
	`;

    const title = document.createElement("h3");
    title.textContent = "Chart Controls";
    title.style.cssText = `
		margin: 0;
		color: var(--color-fg-alt);
		font-size: 20px;
		font-weight: 600;
		text-shadow: 0 2px 4px var(--color-shadow);
	`;

    const globalActions = document.createElement("div");
    globalActions.className = "global-actions";
    globalActions.style.cssText = `
		display: flex;
		gap: 8px;
	`;

    // Reset to defaults button
    const resetBtn = createActionButton("↻ Reset", "Reset all settings to defaults", () => {
        resetAllSettings();
        // Force re-render all charts after reset with proper cleanup
        const chartsContainer = document.getElementById("chart-container");
        if (chartsContainer && window.globalData) {
            // Clear existing chart instances
            if (window._chartjsInstances) {
                window._chartjsInstances.forEach((chart) => {
                    if (chart && typeof chart.destroy === "function") {
                        try {
                            chart.destroy();
                        } catch (error) {
                            console.warn("[ResetBtn] Error destroying chart:", error);
                        }
                    }
                });
                window._chartjsInstances = [];
            }

            // Force complete re-render
            setTimeout(() => {
                renderChartJS(chartsContainer);
            }, 50);
        }
        showNotification("Settings reset to defaults", "success");
    });

    // Export all charts button
    const exportAllBtn = createActionButton("📦 Export All", "Export all charts as images", () => {
        exportAllCharts();
    });

    globalActions.appendChild(resetBtn);
    globalActions.appendChild(exportAllBtn);
    header.appendChild(title);
    header.appendChild(globalActions);
    wrapper.appendChild(header);
}
/**
 * Creates the main controls section with dropdowns and sliders
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
 */
function createRangeControl(option) {
    const container = document.createElement("div");
    container.style.cssText = `
		position: relative;
	`;

    const slider = document.createElement("input");
    slider.type = "range";
    slider.id = `chartjs-${option.id}-slider`;
    slider.min = option.min;
    slider.max = option.max;
    slider.step = option.step;
    slider.value = localStorage.getItem(`chartjs_${option.id}`) || option.default;

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

    slider.addEventListener("input", (e) => {
        valueDisplay.textContent = e.target.value;
        localStorage.setItem(`chartjs_${option.id}`, e.target.value);

        // Update slider background
        const percentage = ((e.target.value - option.min) / (option.max - option.min)) * 100;
        slider.style.background = `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${percentage}%, var(--color-border) ${percentage}%, var(--color-border) 100%)`;

        // Debounced re-render
        clearTimeout(slider.timeout);
        slider.timeout = setTimeout(() => {
            renderChartJS();
        }, 300);
    });

    // Initialize slider background
    const initialPercentage = ((slider.value - option.min) / (option.max - option.min)) * 100;
    slider.style.background = `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${initialPercentage}%, var(--color-border) ${initialPercentage}%, var(--color-border) 100%)`;

    container.appendChild(valueDisplay);
    container.appendChild(slider);
    return container;
}
/**
 * Creates a toggle switch control
 */
function createToggleControl(option) {
    const container = document.createElement("div");
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

    const currentValue = localStorage.getItem(`chartjs_${option.id}`) || option.default;
    const isOn = currentValue === "on";

    if (isOn) {
        toggle.style.background = "var(--color-success)";
        toggleThumb.style.left = "26px";
    }

    const statusText = document.createElement("span");
    statusText.textContent = isOn ? "On" : "Off";
    statusText.style.cssText = `
		color: ${isOn ? "var(--color-success)" : "var(--color-fg)"};
		font-weight: 600;
		font-size: 14px;
		min-width: 24px;
		opacity: ${isOn ? "1" : "0.7"};
	`;

    toggle.appendChild(toggleThumb);

    toggle.addEventListener("click", () => {
        const currentValue = localStorage.getItem(`chartjs_${option.id}`) || option.default;
        const newValue = currentValue === "on" ? "off" : "on";
        const isOn = newValue === "on";

        localStorage.setItem(`chartjs_${option.id}`, newValue);

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

        renderChartJS();
    });

    container.appendChild(toggle);
    container.appendChild(statusText);
    return container;
}
/**
 * Creates a select dropdown control
 */
function createSelectControl(option) {
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

    option.options.forEach((val) => {
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
                const idx = option.options.indexOf(select.value === "all" ? "all" : Number(select.value));
                let newIdx = idx + (e.deltaY > 0 ? 1 : -1);
                if (newIdx < 0) newIdx = 0;
                if (newIdx >= option.options.length) newIdx = option.options.length - 1;
                select.value = option.options[newIdx];
                select.dispatchEvent(new Event("change"));
            },
            { passive: false }
        );
    }

    select.addEventListener("change", (e) => {
        localStorage.setItem(`chartjs_${option.id}`, e.target.value);
        renderChartJS();
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
    const charts = window._chartjsInstances;
    if (!charts || charts.length === 0) {
        showNotification("No charts available", "warning");
        return;
    }

    // Filter out invalid charts using ExportUtils validation
    const validCharts = charts.filter((chart) => ExportUtils.isValidChart(chart));

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

    validCharts.forEach((chart, index) => {
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
    const handleEscape = (e) => {
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

export function createExportSection(wrapper) {
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
                    (chart) => {
                        const dataset = chart.data.datasets[0];
                        const fieldName = dataset?.label || "chart";
                        const filename = `${fieldName.replace(/\s+/g, "-").toLowerCase()}-chart.png`;
                        ExportUtils.downloadChartAsPNG(chart, filename);
                    },
                    (charts) => ExportUtils.createCombinedChartsImage(charts, "combined-charts.png")
                ),
        },
        {
            icon: "📋",
            text: "Copy Image",
            action: () =>
                showChartSelectionModal(
                    "Copy to Clipboard",
                    (chart) => ExportUtils.copyChartToClipboard(chart),
                    (charts) => ExportUtils.copyCombinedChartsToClipboard(charts)
                ),
        },
        {
            icon: "📊",
            text: "Export CSV",
            action: () =>
                showChartSelectionModal(
                    "Export as CSV",
                    (chart) => {
                        const dataset = chart.data.datasets[0];
                        if (dataset && dataset.data) {
                            const fieldName = dataset.label || "chart";
                            const filename = `${fieldName.replace(/\s+/g, "-").toLowerCase()}-data.csv`;
                            ExportUtils.exportChartDataAsCSV(dataset.data, fieldName, filename);
                        }
                    },
                    (charts) => ExportUtils.exportCombinedChartsDataAsCSV(charts, "combined-charts-data.csv")
                ),
        },
        {
            icon: "📄",
            text: "Export JSON",
            action: () =>
                showChartSelectionModal(
                    "Export as JSON",
                    (chart) => {
                        const dataset = chart.data.datasets[0];
                        if (dataset && dataset.data) {
                            const fieldName = dataset.label || "chart";
                            const filename = `${fieldName.replace(/\s+/g, "-").toLowerCase()}-data.json`;
                            ExportUtils.exportChartDataAsJSON(dataset.data, fieldName, filename);
                        }
                    },
                    (charts) => {
                        const allChartsData = {
                            exportedAt: new Date().toISOString(),
                            charts: charts.map((chart, index) => {
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
                    (chart) => ExportUtils.printChart(chart),
                    (charts) => ExportUtils.printCombinedCharts(charts)
                ),
        },
        {
            icon: "�",
            text: "Export ZIP",
            action: () => {
                const charts = window._chartjsInstances;
                if (!charts || charts.length === 0) {
                    showNotification("No charts available to export", "warning");
                    return;
                }
                ExportUtils.exportAllAsZip(charts);
            },
        },
        {
            icon: "🔗",
            text: "Share URL",
            action: () => ExportUtils.shareChartsAsURL(),
        },
        {
            icon: "📸",
            text: "Share Gyazo",
            action: () => {
                if (!ExportUtils.isGyazoAuthenticated()) {
                    showNotification("Please connect your Gyazo account first", "warning");
                    ExportUtils.showGyazoAccountManager();
                    return;
                }
                ExportUtils.shareChartsToGyazo();
            },
        },
        {
            icon: "⚙️",
            text: "Gyazo Settings",
            action: () => ExportUtils.showGyazoAccountManager(),
        },
    ];

    exportButtons.forEach((btn) => {
        const button = createActionButton(`${btn.icon} ${btn.text}`, `${btn.text} for charts`, btn.action, "export-btn");
        exportGrid.appendChild(button);
    });

    exportSection.appendChild(exportTitle);
    exportSection.appendChild(exportGrid);
    wrapper.appendChild(exportSection);
}
/**
 * Creates the field toggles section for showing/hiding specific metrics
 */

export function createFieldTogglesSection(wrapper) {
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

    const fieldsTitle = document.createElement("h4");
    fieldsTitle.textContent = "Visible Metrics";
    fieldsTitle.style.cssText = `
		margin: 0 0 12px 0;
		color: var(--color-accent-secondary);
		font-size: 16px;
		font-weight: 600;
	`;

    const fieldsGrid = document.createElement("div");
    fieldsGrid.style.cssText = `
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 12px;
	`; // Add field toggles
    chartFields.forEach((field) => {
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
    fieldsGrid.appendChild(altitudeProfileToggle); // Add zone chart toggles
    const hrZoneDoughnutToggle = createFieldToggle("hr_zone_doughnut");
    fieldsGrid.appendChild(hrZoneDoughnutToggle);

    const hrZoneBarToggle = createFieldToggle("hr_zone_bar");
    fieldsGrid.appendChild(hrZoneBarToggle);

    const powerZoneDoughnutToggle = createFieldToggle("power_zone_doughnut");
    fieldsGrid.appendChild(powerZoneDoughnutToggle);

    const powerZoneBarToggle = createFieldToggle("power_zone_bar");
    fieldsGrid.appendChild(powerZoneBarToggle);

    // Add developer fields toggles if data exists
    if (window.globalData && window.globalData.recordMesgs) {
        const devFields = extractDeveloperFieldsList(window.globalData.recordMesgs);
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
function createFieldToggle(field) {
    const themeConfig = getThemeConfig();
    const container = document.createElement("div");
    container.className = "field-toggle";
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
		cursor: pointer;
	`;
    // Check if this is a zone chart - but only show zone color button for the first of each type
    const isHRZoneChart = field.includes("hr_zone");
    const showZoneColorButton = field === "hr_zone_doughnut" || field === "power_zone_doughnut"; // Only show on doughnut charts

    if (showZoneColorButton) {
        // Create zone color picker button for zone charts
        const zoneColorBtn = document.createElement("button");
        const zoneType = isHRZoneChart ? "HR" : "Power";
        zoneColorBtn.textContent = `🎨 ${zoneType} Zones`;
        zoneColorBtn.style.cssText = `
			padding: 6px 12px;
			background: var(--color-btn-bg);
			color: var(--color-fg-alt);
			border: none;
			border-radius: 6px;
			cursor: pointer;
			font-size: 12px;
			font-weight: 600;
			transition: var(--transition-smooth);
		`;

        zoneColorBtn.addEventListener("click", () => {
            // Use a generic field name for the zone color picker
            const genericField = isHRZoneChart ? "hr_zone" : "power_zone";
            openZoneColorPicker(genericField);
        });

        zoneColorBtn.addEventListener("mouseenter", () => {
            zoneColorBtn.style.transform = "scale(1.05)";
            zoneColorBtn.style.boxShadow = "var(--color-box-shadow)";
        });

        zoneColorBtn.addEventListener("mouseleave", () => {
            zoneColorBtn.style.transform = "scale(1)";
            zoneColorBtn.style.boxShadow = "none";
        });

        container.appendChild(toggle);
        container.appendChild(label);
        container.appendChild(zoneColorBtn);
    } else {
        // Regular color picker for non-zone charts
        const colorPicker = document.createElement("input");
        colorPicker.type = "color";
        colorPicker.value = localStorage.getItem(`chartjs_color_${field}`) || fieldColors[field] || themeConfig.colors.primaryAlpha;
        colorPicker.style.cssText = `
			width: 32px;
			height: 32px;
			border: none;
			border-radius: 6px;
			cursor: pointer;
			background: none;
		`;

        // Event listeners for color picker
        colorPicker.addEventListener("change", () => {
            localStorage.setItem(`chartjs_color_${field}`, colorPicker.value);
            renderChartJS();
        });

        container.appendChild(toggle);
        container.appendChild(label);
        container.appendChild(colorPicker);
    }

    // Event listeners for toggle
    toggle.addEventListener("change", () => {
        const visibility = toggle.checked ? "visible" : "hidden";
        localStorage.setItem(`chartjs_field_${field}`, visibility);
        renderChartJS();
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
function createActionButton(text, title, onClick, className = "") {
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

export function applySettingsPanelStyles(wrapper) {
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
