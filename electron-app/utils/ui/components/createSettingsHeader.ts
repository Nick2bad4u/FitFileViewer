import {
    reRenderChartsAfterSettingChange,
    resetAllSettings,
} from "../../app/initialization/getCurrentSettings.js";
import { createChartStatusIndicator } from "../../charts/components/createChartStatusIndicator.js";
import { getRegisteredChartInstances } from "../../charts/core/chartInstanceRegistry.js";
import { chartOptionsConfig } from "../../charts/plugins/chartOptionsConfig.js";
import { exportAllCharts } from "../../files/export/exportAllCharts.js";
import { exportUtils } from "../../files/export/exportUtils.js";
import {
    getChartSetting,
    setChartSetting,
} from "../../state/domain/settingsStateManager.js";
import { showNotification } from "../notifications/showNotification.js";
import {
    getCreateSettingsHeaderRuntime,
    type CreateSettingsHeaderRuntime,
    type CreateSettingsHeaderTimer,
} from "./createSettingsHeaderRuntime.js";

function createSettingsHeaderRuntime(): CreateSettingsHeaderRuntime {
    return getCreateSettingsHeaderRuntime();
}

type ChartDataPoint = Record<string, unknown> & {
    x?: unknown;
    y?: unknown;
};

type ChartDataset = {
    data?: ChartDataPoint[];
    label?: string;
};

type ChartLike = {
    config?: {
        type?: string;
    };
    data: {
        datasets: ChartDataset[];
    };
    [key: string]: unknown;
};

type SingleChartCallback = (chart: ChartLike) => void;

type CombinedChartsCallback = (charts: ChartLike[]) => void;

type ChartOption = {
    default?: unknown;
    defaultValue?: unknown;
    description?: string;
    id: string;
    label: string;
    max?: number;
    min?: number;
    options?: readonly (boolean | number | string)[];
    step?: number;
    type: string;
};

type HTMLDivElementExtended = HTMLDivElement & {
    _updateFromReset?: () => void;
};

type ExtendedExportUtils = typeof exportUtils & {
    copyChartToClipboard: (chart: ChartLike) => unknown;
    copyCombinedChartsToClipboard: (charts: ChartLike[]) => unknown;
    createCombinedChartsImage: (
        charts: ChartLike[],
        filename: string
    ) => unknown;
    exportAllAsZip: (charts: ChartLike[]) => unknown;
    exportChartDataAsCSV: (
        data: unknown,
        fieldName: string,
        filename: string
    ) => unknown;
    exportChartDataAsJSON: (
        data: unknown,
        fieldName: string,
        filename: string
    ) => unknown;
    exportCombinedChartsDataAsCSV: (
        charts: ChartLike[],
        filename: string
    ) => unknown;
    isGyazoAuthenticated: () => boolean;
    isValidChart: (chart: ChartLike) => boolean;
    printChart: (chart: ChartLike) => unknown;
    printCombinedCharts: (charts: ChartLike[]) => unknown;
    shareChartsAsURL: () => unknown;
    shareChartsToGyazo: () => unknown;
    showGyazoAccountManager: () => unknown;
    showImgurAccountManager: () => unknown;
};

function getExtendedExportUtils(): ExtendedExportUtils {
    return exportUtils as ExtendedExportUtils;
}

function getChartInstances(): ChartLike[] | undefined {
    return getRegisteredChartInstances().filter(isChartLike);
}

function isChartLike(value: unknown): value is ChartLike {
    const chartData =
        value !== null && typeof value === "object"
            ? (value as { data?: unknown }).data
            : undefined;

    return (
        chartData !== null &&
        typeof chartData === "object" &&
        Array.isArray((chartData as { datasets?: unknown }).datasets)
    );
}

function stringifyPrimitiveSetting(value: unknown, fallback = ""): string {
    if (typeof value === "string") {
        return value;
    }

    if (typeof value === "boolean" || typeof value === "number") {
        return String(value);
    }

    return fallback;
}

/** Applies inline styles to the chart settings panel wrapper. */
export function applySettingsPanelStyles(wrapper: HTMLElement): void {
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
    const bgEffect = createSettingsHeaderRuntime().createElement("div");
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
    wrapper.append(bgEffect);
}
/*
 * Creates the main controls section with dropdowns and sliders
 *
 * @param {HTMLElement} wrapper - The wrapper element to add the controls to
 */

/** Creates the chart option controls section inside the settings panel. */
export function createControlsSection(wrapper: HTMLElement): void {
    // Check if controls section already exists
    if (wrapper.querySelector(".controls-section")) {
        return;
    }

    const controlsSection = createSettingsHeaderRuntime().createElement("div");
    controlsSection.className = "controls-section";
    controlsSection.style.cssText = `
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 16px;
		margin-bottom: 20px;
		position: relative;
		z-index: 1;
	`;

    for (const opt of chartOptionsConfig) {
        const controlGroup = createControlGroup(opt);
        controlsSection.append(controlGroup);
    }

    wrapper.append(controlsSection);
}
/** Creates the chart export controls section inside the settings panel. */
export function createExportSection(wrapper: HTMLElement): void {
    // Check if export section already exists
    if (wrapper.querySelector(".export-section")) {
        return;
    }

    const exportSection = createSettingsHeaderRuntime().createElement("div");
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
    const exportTitle = createSettingsHeaderRuntime().createElement("h4");
    exportTitle.textContent = "Export & Share";
    exportTitle.style.cssText = `
		margin: 0 0 12px 0;
		color: var(--color-accent);
		font-size: 16px;
		font-weight: 600;
	`;

    const exportGrid = createSettingsHeaderRuntime().createElement("div");
    exportGrid.style.cssText = `
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 8px;
	`;

    const exportButtons = [
        {
            action: () =>
                showChartSelectionModal(
                    "Save as PNG",
                    (chart) => {
                        const [dataset] = chart.data.datasets,
                            fieldName = dataset?.label || "chart",
                            filename = `${fieldName.replaceAll(/\s+/g, "-").toLowerCase()}-chart.png`;
                        getExtendedExportUtils().downloadChartAsPNG(
                            chart,
                            filename
                        );
                    },
                    (charts) =>
                        getExtendedExportUtils().createCombinedChartsImage(
                            charts,
                            "combined-charts.png"
                        )
                ),
            icon: "📷",
            text: "Save PNG",
        },
        {
            action: () =>
                showChartSelectionModal(
                    "Copy to Clipboard",
                    (chart) =>
                        getExtendedExportUtils().copyChartToClipboard(chart),
                    (charts) =>
                        getExtendedExportUtils().copyCombinedChartsToClipboard(
                            charts
                        )
                ),
            icon: "📋",
            text: "Copy Image",
        },
        {
            action: () =>
                showChartSelectionModal(
                    "Export as CSV",
                    (chart) => {
                        const [dataset] = chart.data.datasets;
                        if (dataset && dataset.data) {
                            const fieldName = dataset.label || "chart",
                                filename = `${fieldName.replaceAll(/\s+/g, "-").toLowerCase()}-data.csv`;
                            getExtendedExportUtils().exportChartDataAsCSV(
                                dataset.data,
                                fieldName,
                                filename
                            );
                        }
                    },
                    (charts) =>
                        getExtendedExportUtils().exportCombinedChartsDataAsCSV(
                            charts,
                            "combined-charts-data.csv"
                        )
                ),
            icon: "📊",
            text: "Export CSV",
        },
        {
            action: () =>
                showChartSelectionModal(
                    "Export as JSON",
                    (chart) => {
                        const [dataset] = chart.data.datasets;
                        if (dataset && dataset.data) {
                            const fieldName = dataset.label || "chart",
                                filename = `${fieldName.replaceAll(/\s+/g, "-").toLowerCase()}-data.json`;
                            getExtendedExportUtils().exportChartDataAsJSON(
                                dataset.data,
                                fieldName,
                                filename
                            );
                        }
                    },
                    (charts) => {
                        const allChartsData = {
                                charts: charts.map((chart, index) => {
                                    const [dataset] = chart.data.datasets;
                                    return {
                                        data: dataset?.data || [],
                                        field:
                                            dataset?.label || `chart-${index}`,
                                        totalPoints: dataset?.data
                                            ? dataset.data.length
                                            : 0,
                                        type: chart.config?.type,
                                    };
                                }),
                                exportedAt: new Date().toISOString(),
                            },
                            blob = new Blob(
                                [JSON.stringify(allChartsData, null, 2)],
                                {
                                    type: "application/json;charset=utf-8;",
                                }
                            ),
                            link =
                                createSettingsHeaderRuntime().createElement(
                                    "a"
                                );
                        link.href = URL.createObjectURL(blob);
                        link.download = "combined-charts-data.json";
                        createSettingsHeaderRuntime().appendToBody(link);
                        link.click();
                        link.remove();
                        void showNotification(
                            "Combined chart data exported as JSON",
                            "success"
                        );
                    }
                ),
            icon: "📄",
            text: "Export JSON",
        },
        {
            action: () =>
                showChartSelectionModal(
                    "Print",
                    (chart) => getExtendedExportUtils().printChart(chart),
                    (charts) =>
                        getExtendedExportUtils().printCombinedCharts(charts)
                ),
            icon: "🖨️",
            text: "Print",
        },
        {
            action: () => {
                const charts = getChartInstances();
                if (!charts || charts.length === 0) {
                    void showNotification(
                        "No charts available to export",
                        "warning"
                    );
                    return;
                }
                getExtendedExportUtils().exportAllAsZip(charts);
            },
            icon: "📁",
            text: "Export ZIP",
        },
        {
            action: () => getExtendedExportUtils().shareChartsAsURL(),
            icon: "🔗",
            text: "Share URL",
        },
        {
            action: () => {
                if (!getExtendedExportUtils().isGyazoAuthenticated()) {
                    void showNotification(
                        "Please connect your Gyazo account first",
                        "warning"
                    );
                    getExtendedExportUtils().showGyazoAccountManager();
                    return;
                }
                getExtendedExportUtils().shareChartsToGyazo();
            },
            icon: "📸",
            text: "Share Gyazo",
        },
        {
            action: () => getExtendedExportUtils().showGyazoAccountManager(),
            icon: "⚙️",
            text: "Gyazo Settings",
        },
        {
            action: () => getExtendedExportUtils().showImgurAccountManager(),
            icon: "🔧",
            text: "Imgur Settings",
        },
    ];

    for (const btn of exportButtons) {
        const button = createActionButton(
            `${btn.icon} ${btn.text}`,
            `${btn.text} for charts`,
            btn.action,
            "export-btn"
        );
        exportGrid.append(button);
    }

    exportSection.append(exportTitle);
    exportSection.append(exportGrid);
    wrapper.append(exportSection);
}
/*
 * Creates the settings header with title and global actions
 *
 * @param {HTMLElement} wrapper - The wrapper element to add the header to
 */
/** Creates the settings panel header and global chart actions. */
export function createSettingsHeader(wrapper: HTMLElement): void {
    // Check if header already exists
    if (wrapper.querySelector(".settings-header")) {
        return;
    }
    const header = createSettingsHeaderRuntime().createElement("div");
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

    const leftSection = createSettingsHeaderRuntime().createElement("div");
    leftSection.style.cssText = `
		display: flex;
		align-items: center;
		gap: 16px;
		flex: 1;
		min-width: 200px;
	`;

    const title = createSettingsHeaderRuntime().createElement("h3");
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

    leftSection.append(title);
    if (statusIndicator) {
        leftSection.append(statusIndicator);
    }

    const globalActions = createSettingsHeaderRuntime().createElement("div");
    globalActions.className = "global-actions";
    globalActions.style.cssText = `
		display: flex;		gap: 8px;
	`;

    // Reset to defaults button
    const // Export all charts button
        exportAllBtn = createActionButton(
            "📦 Export All",
            "Export all charts as images",
            () => {
                exportAllCharts();
            }
        ),
        resetBtn = createActionButton(
            "↻ Reset",
            "Reset all settings to defaults",
            () => {
                // Provide immediate visual feedback
                resetBtn.style.opacity = "0.6";
                resetBtn.disabled = true;

                // Perform the reset
                const success = resetAllSettings();

                // Re-enable button after reset completes
                const resetTimer = createSettingsHeaderRuntime().setTimeout(
                    () => {
                        resetBtn.style.opacity = "1";
                        resetBtn.disabled = false;
                    },
                    200
                );
                void resetTimer;

                if (!success) {
                    console.error("[ResetBtn] Reset failed");
                }
            }
        );

    globalActions.append(resetBtn);
    globalActions.append(exportAllBtn);
    header.append(leftSection);
    header.append(globalActions);
    wrapper.append(header);
}
/** Shows the chart selection modal for export actions. */
export function showChartSelectionModal(
    actionType: string,
    singleCallback: SingleChartCallback,
    combinedCallback: CombinedChartsCallback
): void {
    const charts = getChartInstances();
    if (!charts || charts.length === 0) {
        void showNotification("No charts available", "warning");
        return;
    }

    // Filter out invalid charts using exportUtils validation
    const validCharts = charts.filter((chart) =>
        getExtendedExportUtils().isValidChart(chart)
    );

    if (validCharts.length === 0) {
        void showNotification("No valid charts available", "warning");
        return;
    }

    if (validCharts.length === 1) {
        // Only one valid chart, execute single callback directly
        const [chart] = validCharts;
        if (chart) {
            singleCallback(chart);
        }
        return;
    }

    // Create modal overlay
    const overlay = createSettingsHeaderRuntime().createElement("div");
    const modalAbortController =
        createSettingsHeaderRuntime().createAbortController();
    const closeModal = () => {
        modalAbortController.abort();
        overlay.remove();
    };
    overlay.className = "chart-selection-modal-overlay";
    overlay.dataset["ffvModal"] = "chart-selection";
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
    const modal = createSettingsHeaderRuntime().createElement("div");
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
    const title = createSettingsHeaderRuntime().createElement("h3");
    title.textContent = `Select Chart to ${actionType}`;
    title.style.cssText = `
		margin: 0 0 16px 0;
		color: var(--color-modal-fg);
		text-align: center;
	`;

    // Chart selection list
    const chartList = createSettingsHeaderRuntime().createElement("div");
    chartList.style.cssText = `
		margin-bottom: 20px;
	`;

    for (const [index, chart] of validCharts.entries()) {
        const chartItem = createSettingsHeaderRuntime().createElement("button"),
            [dataset] = chart.data.datasets,
            fieldName = dataset?.label || `Chart ${index + 1}`;
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

        chartItem.addEventListener(
            "mouseenter",
            () => {
                chartItem.style.background = "var(--color-accent-hover)";
            },
            { signal: modalAbortController.signal }
        );

        chartItem.addEventListener(
            "mouseleave",
            () => {
                chartItem.style.background = "var(--color-glass)";
            },
            { signal: modalAbortController.signal }
        );

        chartItem.addEventListener(
            "click",
            () => {
                closeModal();
                singleCallback(chart); // Pass the actual chart object, not the index
            },
            { signal: modalAbortController.signal }
        );

        chartList.append(chartItem);
    }

    // Combined option
    const combinedItem = createSettingsHeaderRuntime().createElement("button");
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

    combinedItem.addEventListener(
        "mouseenter",
        () => {
            combinedItem.style.background = "var(--color-accent-hover)";
        },
        { signal: modalAbortController.signal }
    );

    combinedItem.addEventListener(
        "mouseleave",
        () => {
            combinedItem.style.background = "var(--color-accent-hover)";
        },
        { signal: modalAbortController.signal }
    );

    combinedItem.addEventListener(
        "click",
        () => {
            closeModal();
            combinedCallback(validCharts);
        },
        { signal: modalAbortController.signal }
    );

    // Cancel button
    const cancelButton = createSettingsHeaderRuntime().createElement("button");
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

    cancelButton.addEventListener(
        "click",
        () => {
            closeModal();
        },
        { signal: modalAbortController.signal }
    );

    // ESC key handler
    const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
            closeModal();
        }
    };
    createSettingsHeaderRuntime().addDocumentKeydownListener(handleEscape, {
        signal: modalAbortController.signal,
    });

    // Click outside to close
    overlay.addEventListener(
        "click",
        (e) => {
            if (e.target === overlay) {
                closeModal();
            }
        },
        { signal: modalAbortController.signal }
    );

    // Assemble modal
    modal.append(title);
    modal.append(chartList);
    modal.append(combinedItem);
    modal.append(cancelButton);
    overlay.append(modal);
    createSettingsHeaderRuntime().appendToBody(overlay);
}
/*
 * Shows a modal to select which chart(s) to use for an action
 *
 * @param {string} actionType - Type of action (copy, save, print, etc.)
 * @param {Function} singleCallback - Callback for single chart selection
 * @param {Function} combinedCallback - Callback for combined charts action
 */

/*
 * Creates styled action buttons
 */
function createActionButton(
    text: string,
    title: string,
    onClick: () => void,
    className = ""
): HTMLButtonElement {
    const button = createSettingsHeaderRuntime().createElement("button");
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

    const buttonController =
        createSettingsHeaderRuntime().createAbortController();
    const buttonSignal = buttonController.signal;

    button.addEventListener(
        "mouseenter",
        () => {
            button.style.background = "var(--color-btn-hover)";
            button.style.transform = "translateY(-1px)";
            button.style.boxShadow = "var(--color-box-shadow-light)";
        },
        { signal: buttonSignal }
    );

    button.addEventListener(
        "mouseleave",
        () => {
            button.style.background = "var(--color-btn-bg)";
            button.style.transform = "translateY(0)";
            button.style.boxShadow = "none";
        },
        { signal: buttonSignal }
    );

    button.addEventListener("click", onClick, { signal: buttonSignal });
    return button;
}
/*
 * Creates the export section with various export options
 */

/*
 * Creates individual control groups for each setting
 */
function createControlGroup(option: ChartOption): HTMLElement {
    const group = createSettingsHeaderRuntime().createElement("div");
    group.className = "control-group";
    group.style.cssText = `
		background: var(--color-glass);
		border-radius: 12px;
		padding: 16px;
		border: 1px solid var(--color-border);
		transition: var(--transition-smooth);
		backdrop-filter: var(--backdrop-blur);
	`;

    const groupController =
        createSettingsHeaderRuntime().createAbortController();
    const groupSignal = groupController.signal;

    // Add hover effect
    group.addEventListener(
        "mouseenter",
        () => {
            group.style.background = "var(--color-glass-border)";
            group.style.transform = "translateY(-2px)";
            group.style.boxShadow = "var(--color-box-shadow)";
        },
        { signal: groupSignal }
    );

    group.addEventListener(
        "mouseleave",
        () => {
            group.style.background = "var(--color-glass)";
            group.style.transform = "translateY(0)";
            group.style.boxShadow = "none";
        },
        { signal: groupSignal }
    );

    const label = createSettingsHeaderRuntime().createElement("label");
    label.textContent = option.label;
    label.style.cssText = `
		display: block;
		color: var(--color-fg-alt);
		font-weight: 600;
		margin-bottom: 8px;
		font-size: 14px;
	`;

    if (option.description) {
        const description = createSettingsHeaderRuntime().createElement("div");
        description.textContent = option.description;
        description.style.cssText = `
			color: var(--color-fg);
			font-size: 12px;
			margin-bottom: 12px;
			line-height: 1.4;
			opacity: 0.8;
		`;
        group.append(description);
    }

    let control;
    if (option.type === "range") {
        control = createRangeControl(option);
    } else if (option.type === "toggle") {
        control = createToggleControl(option);
    } else {
        control = createSelectControl(option);
    }

    group.append(label);
    group.append(control);
    return group;
}
/*
 * Creates a range slider control
 *
 * @param {ChartOption} option - The range control option configuration
 */
function createRangeControl(option: ChartOption): HTMLDivElement {
    const container = createSettingsHeaderRuntime().createElement("div");
    const rangeController =
        createSettingsHeaderRuntime().createAbortController();
    const rangeSignal = rangeController.signal;
    container.style.cssText = `
		position: relative;
	`;

    const defaultRaw = option.defaultValue ?? option.default ?? 0;
    const defaultNumber =
        typeof defaultRaw === "number" ? defaultRaw : Number(defaultRaw);
    const fallbackValue = Number.isFinite(defaultNumber) ? defaultNumber : 0;
    const storedValue = getChartSetting(option.id);
    const resolvedValue = (() => {
        if (storedValue === null || storedValue === undefined) {
            return fallbackValue;
        }
        if (typeof storedValue === "number" && Number.isFinite(storedValue)) {
            return storedValue;
        }
        if (typeof storedValue === "string") {
            const parsed = Number(storedValue);
            return Number.isFinite(parsed) ? parsed : fallbackValue;
        }
        return fallbackValue;
    })();

    const slider = createSettingsHeaderRuntime().createElement(
        "input"
    ) as HTMLInputElement & {
        timeout?: CreateSettingsHeaderTimer;
    };
    slider.type = "range";
    slider.id = `chartjs-${option.id}-slider`;
    slider.min = String(option.min || 0);
    slider.max = String(option.max || 100);
    slider.step = String(option.step || 1);

    const minVal = typeof option.min === "number" ? option.min : 0;
    const maxVal = typeof option.max === "number" ? option.max : 100;
    const clamped = Math.min(maxVal, Math.max(minVal, resolvedValue));
    slider.value = String(clamped);

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
    const style = createSettingsHeaderRuntime().createElement("style");
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
    createSettingsHeaderRuntime().appendToHead(style);

    const valueDisplay = createSettingsHeaderRuntime().createElement("span");
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

    slider.addEventListener(
        "input",
        (e) => {
            const target = e.target as HTMLInputElement | null;
            if (target) {
                // input[type=range] should always produce a numeric string within min/max,
                // but we clamp defensively in case of stored-state corruption or unexpected DOM.
                const current = Number(target.value);
                const safeCurrent = Number.isFinite(current)
                    ? Math.min(maxVal, Math.max(minVal, current))
                    : clamped;
                const safeValue = String(safeCurrent);

                valueDisplay.textContent = safeValue;
                setChartSetting(option.id, safeCurrent);

                // Update slider background
                const range = maxVal - minVal;
                const percentage =
                    range > 0 ? ((safeCurrent - minVal) / range) * 100 : 0;
                slider.style.background = `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${percentage}%, var(--color-border) ${percentage}%, var(--color-border) 100%)`;

                // Debounced re-render using the same approach as the reset button
                createSettingsHeaderRuntime().clearTimeout(slider.timeout);
                slider.timeout = createSettingsHeaderRuntime().setTimeout(
                    () => {
                        reRenderChartsAfterSettingChange(option.id, safeValue);
                    },
                    300
                );
            }
        },
        { signal: rangeSignal }
    );

    // Initialize slider background
    // Set initial background
    const range = maxVal - minVal;
    const initialPercentage =
        range > 0 ? ((Number(slider.value) - minVal) / range) * 100 : 0;
    slider.style.background = `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${initialPercentage}%, var(--color-border) ${initialPercentage}%, var(--color-border) 100%)`;

    container.append(valueDisplay);
    container.append(slider);
    return container;
}
/*
 * Creates a select dropdown control
 */
function createSelectControl(option: ChartOption): HTMLSelectElement {
    const select = createSettingsHeaderRuntime().createElement("select");
    const selectController =
        createSettingsHeaderRuntime().createAbortController();
    const selectSignal = selectController.signal;
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

    select.addEventListener(
        "focus",
        () => {
            select.style.borderColor = "var(--color-accent)";
            select.style.boxShadow = "0 0 0 2px var(--color-accent-secondary)";
        },
        { signal: selectSignal }
    );

    select.addEventListener(
        "blur",
        () => {
            select.style.borderColor = "var(--color-border)";
            select.style.boxShadow = "none";
        },
        { signal: selectSignal }
    );

    if (option.options)
        for (const val of option.options) {
            const optionEl =
                createSettingsHeaderRuntime().createElement("option");
            optionEl.value = String(val);
            optionEl.textContent =
                val === "all"
                    ? "All Points"
                    : val === "on"
                      ? "Enabled"
                      : val === "off"
                        ? "Disabled"
                        : String(val).charAt(0).toUpperCase() +
                          String(val).slice(1);
            optionEl.style.background = "var(--color-bg-solid)";
            optionEl.style.color = "var(--color-fg)";
            select.append(optionEl);
        }

    const storedValue = getChartSetting(option.id);
    const allowed = Array.isArray(option.options)
        ? new Set(option.options.map(String))
        : null;
    const fallback =
        option.default === undefined
            ? stringifyPrimitiveSetting(option.options?.[0])
            : stringifyPrimitiveSetting(option.default);
    const candidate =
        storedValue === null || storedValue === undefined
            ? fallback
            : stringifyPrimitiveSetting(storedValue, fallback);
    select.value = allowed && !allowed.has(candidate) ? fallback : candidate;

    // Mouse wheel support for maxpoints
    if (option.id === "maxpoints") {
        select.addEventListener(
            "wheel",
            (e) => {
                e.preventDefault();
                const idx =
                    option.options?.indexOf(
                        select.value === "all" ? "all" : Number(select.value)
                    ) ?? -1;
                let newIdx = idx + (e.deltaY > 0 ? 1 : -1);
                if (newIdx < 0) {
                    newIdx = 0;
                }
                if (newIdx >= (option.options?.length ?? 0)) {
                    newIdx = (option.options?.length ?? 1) - 1;
                }
                select.value = String(option.options?.[newIdx] ?? "");
                select.dispatchEvent(
                    createSettingsHeaderRuntime().createChangeEvent()
                );
            },
            { passive: false, signal: selectSignal }
        );
    }

    select.addEventListener(
        "change",
        (e) => {
            const target = e.target as HTMLSelectElement | null;
            if (target) {
                const nextValue =
                    option.id === "maxpoints" && target.value !== "all"
                        ? Number(target.value)
                        : target.value;
                setChartSetting(option.id, nextValue);
                reRenderChartsAfterSettingChange(option.id, nextValue);
            }
        },
        { signal: selectSignal }
    );

    return select;
}

/*
 * Applies modern styling to the settings panel
 */

/*
 * Creates a toggle switch control
 */
function createToggleControl(option: ChartOption): HTMLDivElementExtended {
    const container = createSettingsHeaderRuntime().createElement(
        "div"
    ) as HTMLDivElementExtended;
    const toggleController =
        createSettingsHeaderRuntime().createAbortController();
    const toggleSignal = toggleController.signal;
    container.style.cssText = `
		display: flex;
		align-items: center;
		gap: 8px;
	`;

    const toggle = createSettingsHeaderRuntime().createElement("div");
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

    const toggleThumb = createSettingsHeaderRuntime().createElement("div");
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
    function getCurrentValue(): boolean {
        const stored = getChartSetting(option.id);
        if (stored === null || stored === undefined) {
            return Boolean(option.default); // Use default from config (boolean)
        }
        if (typeof stored === "boolean") {
            return stored;
        }
        if (typeof stored === "string") {
            return stored === "true" || stored === "on";
        }
        return Boolean(stored);
    }

    const statusText = createSettingsHeaderRuntime().createElement("span");
    statusText.style.cssText = `
		font-weight: 600;
		font-size: 14px;
		min-width: 24px;
		transition: all 0.3s ease;
	`;

    // Set visual state based on boolean value
    function updateVisualState(isOn: boolean): void {
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

    // Initialize with current value
    let isOn = getCurrentValue();
    updateVisualState(isOn);

    toggle.append(toggleThumb);

    toggle.addEventListener(
        "click",
        () => {
            // Toggle the current state
            isOn = !isOn;

            // Store as string for consistency with existing system
            setChartSetting(option.id, isOn);

            // Update visual state
            updateVisualState(isOn);

            // Re-render charts using the same approach as the reset button
            reRenderChartsAfterSettingChange(option.id, isOn);
        },
        { signal: toggleSignal }
    );

    // Add method to update from external reset
    container._updateFromReset = function _updateFromReset() {
        isOn = getCurrentValue();
        updateVisualState(isOn);
    };

    container.append(toggle);
    container.append(statusText);
    return container;
}
