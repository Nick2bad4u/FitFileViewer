import {
    reRenderChartsAfterSettingChange,
    resetAllSettings,
} from "../../app/initialization/getCurrentSettings.js";
import { updateAllChartStatusIndicators } from "../../charts/components/chartStatusIndicator.js";
import { createChartStatusIndicator } from "../../charts/components/createChartStatusIndicator.js";
import { chartStateManager } from "../../charts/core/chartStateManager.js";
import { chartOptionsConfig } from "../../charts/plugins/chartOptionsConfig.js";
import { extractDeveloperFieldsList } from "../../data/processing/extractDeveloperFieldsList.js";
import { exportAllCharts } from "../../files/export/exportAllCharts.js";
import { exportUtils } from "../../files/export/exportUtils.js";
import {
    fieldColors,
    fieldLabels,
    formatChartFields,
} from "../../formatting/display/formatChartFields.js";
import {
    getChartFieldVisibility,
    getChartSetting,
    setChartFieldVisibility,
    setChartSetting,
} from "../../state/domain/settingsStateManager.js";
import { getThemeConfig } from "../../theming/core/theme.js";
import { showNotification } from "../notifications/showNotification.js";

type LooseRecord = Record<string, unknown>;

type FitRecord = LooseRecord & {
    altitude?: unknown;
    distance?: unknown;
    enhancedAltitude?: unknown;
    enhancedSpeed?: unknown;
    heartRate?: unknown;
    positionLat?: unknown;
    positionLong?: unknown;
    power?: unknown;
    speed?: unknown;
};

type ZoneMessage = LooseRecord & {
    referenceMesg?: string;
    timeInHrZone?: unknown;
    timeInPowerZone?: unknown;
};

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

type GlobalData = {
    eventMesgs: LooseRecord[];
    recordMesgs: FitRecord[];
    timeInZoneMesgs: ZoneMessage[];
};

type WindowExtensions = typeof globalThis & {
    _chartjsInstances?: ChartLike[];
    globalData?: Partial<GlobalData>;
};

type ChartDevGlobal = typeof globalThis & {
    __chartjs_dev?: { requestRerender?: (reason: string) => void };
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

function getWindowExtensions(): WindowExtensions {
    return globalThis as WindowExtensions;
}

function getExtendedExportUtils(): ExtendedExportUtils {
    return exportUtils as ExtendedExportUtils;
}

function getGlobalData(): GlobalData {
    const globalData = getWindowExtensions().globalData ?? {};
    return {
        eventMesgs: globalData.eventMesgs ?? [],
        recordMesgs: globalData.recordMesgs ?? [],
        timeInZoneMesgs: globalData.timeInZoneMesgs ?? [],
    };
}

function getChartDev():
    | { requestRerender?: (reason: string) => void }
    | undefined {
    return (globalThis as ChartDevGlobal).__chartjs_dev;
}

/*
 * Resolve chart instances from the renderer global. In Electron's renderer,
 * `globalThis` and `window` normally point at the same object; Vitest's jsdom
 * environment can keep them separate.
 *
 * @returns {unknown[] | undefined}
 */
function getChartInstances(): ChartLike[] | undefined {
    const globalScope = getWindowExtensions();
    if (Array.isArray(globalScope._chartjsInstances)) {
        return globalScope._chartjsInstances;
    }

    if (typeof window !== "undefined") {
        const windowScope = window as WindowExtensions;
        if (Array.isArray(windowScope._chartjsInstances)) {
            return windowScope._chartjsInstances;
        }
    }

    return undefined;
}

function parseFiniteNumber(value: unknown): number | null {
    if (value === null || value === undefined) {
        return null;
    }

    const parsed =
        typeof value === "number" ? value : Number.parseFloat(String(value));
    return Number.isFinite(parsed) ? parsed : null;
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
                            link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        link.download = "combined-charts-data.json";
                        document.body.append(link);
                        link.click();
                        link.remove();
                        showNotification(
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
                    showNotification(
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
                    showNotification(
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
/** Creates the per-field chart visibility toggles section. */
export function createFieldTogglesSection(wrapper: HTMLElement): void {
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

    const toggleButtonsController = new AbortController();
    const toggleButtonsSignal = toggleButtonsController.signal;

    // Add hover effects
    enableAllBtn.addEventListener(
        "mouseenter",
        () => {
            enableAllBtn.style.opacity = "0.8";
            enableAllBtn.style.transform = "translateY(-1px)";
        },
        { signal: toggleButtonsSignal }
    );
    enableAllBtn.addEventListener(
        "mouseleave",
        () => {
            enableAllBtn.style.opacity = "1";
            enableAllBtn.style.transform = "translateY(0)";
        },
        { signal: toggleButtonsSignal }
    );

    disableAllBtn.addEventListener(
        "mouseenter",
        () => {
            disableAllBtn.style.opacity = "0.8";
            disableAllBtn.style.transform = "translateY(-1px)";
        },
        { signal: toggleButtonsSignal }
    );
    disableAllBtn.addEventListener(
        "mouseleave",
        () => {
            disableAllBtn.style.opacity = "1";
            disableAllBtn.style.transform = "translateY(0)";
        },
        { signal: toggleButtonsSignal }
    );

    // Add click handlers
    enableAllBtn.addEventListener(
        "click",
        () => {
            toggleAllFields(true);
        },
        { signal: toggleButtonsSignal }
    );

    disableAllBtn.addEventListener(
        "click",
        () => {
            toggleAllFields(false);
        },
        { signal: toggleButtonsSignal }
    );

    toggleAllContainer.append(enableAllBtn);
    toggleAllContainer.append(disableAllBtn);

    fieldsTitle.append(titleText);
    fieldsTitle.append(toggleAllContainer);

    const fieldsGrid = document.createElement("div");
    fieldsGrid.style.cssText = `
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 12px;
	`; // Add field toggles
    for (const field of formatChartFields) {
        const fieldToggle = createFieldToggle(field);
        fieldsGrid.append(fieldToggle);
    } // Add GPS track toggle
    const gpsTrackToggle = createFieldToggle("gps_track");
    fieldsGrid.append(gpsTrackToggle);

    // Add performance analysis chart toggles
    const speedVsDistanceToggle = createFieldToggle("speed_vs_distance");
    fieldsGrid.append(speedVsDistanceToggle);

    const powerVsHRToggle = createFieldToggle("power_vs_hr");
    fieldsGrid.append(powerVsHRToggle);
    const altitudeProfileToggle = createFieldToggle("altitude_profile");
    fieldsGrid.append(altitudeProfileToggle); // HR zone toggles will be moved to the HR zone controls section
    const hrZoneDoughnutToggle = createFieldToggle("hr_zone_doughnut");
    fieldsGrid.append(hrZoneDoughnutToggle);

    // Power zone toggles are created separately and moved to the dedicated power zone section
    const powerZoneDoughnutToggle = createFieldToggle("power_zone_doughnut");
    fieldsGrid.append(powerZoneDoughnutToggle);

    // Add lap zone chart toggles if data exists
    if (getGlobalData().timeInZoneMesgs) {
        const { timeInZoneMesgs } = getGlobalData(),
            lapZoneMsgs = timeInZoneMesgs.filter(
                (msg) => msg.referenceMesg === "lap"
            );

        if (lapZoneMsgs.length > 0) {
            // Check for HR lap zone data
            const hrLapZones = lapZoneMsgs.filter((msg) => msg.timeInHrZone);
            if (hrLapZones.length > 0) {
                const hrLapStackedToggle = createFieldToggle(
                    "hr_lap_zone_stacked"
                );
                fieldsGrid.append(hrLapStackedToggle);

                const hrLapIndividualToggle = createFieldToggle(
                    "hr_lap_zone_individual"
                );
                fieldsGrid.append(hrLapIndividualToggle);
            }

            // Check for Power lap zone data
            const powerLapZones = lapZoneMsgs.filter(
                (msg) => msg.timeInPowerZone
            );
            if (powerLapZones.length > 0) {
                const powerLapStackedToggle = createFieldToggle(
                    "power_lap_zone_stacked"
                );
                fieldsGrid.append(powerLapStackedToggle);

                const powerLapIndividualToggle = createFieldToggle(
                    "power_lap_zone_individual"
                );
                fieldsGrid.append(powerLapIndividualToggle);
            }
        }
    }

    // Add event messages toggle if data exists
    if (
        getGlobalData()?.eventMesgs &&
        Array.isArray(getGlobalData().eventMesgs) &&
        getGlobalData().eventMesgs.length > 0
    ) {
        const eventMessagesToggle = createFieldToggle("event_messages");
        fieldsGrid.append(eventMessagesToggle);
    }

    // Add developer fields toggles if data exists
    if (getGlobalData() && getGlobalData().recordMesgs) {
        const devFields = extractDeveloperFieldsList(
            getGlobalData().recordMesgs
        );
        for (const field of devFields) {
            const fieldToggle = createFieldToggle(field);
            fieldsGrid.append(fieldToggle);
        }
    }

    fieldsSection.append(fieldsTitle);
    fieldsSection.append(fieldsGrid);
    wrapper.append(fieldsSection);
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

    leftSection.append(title);
    if (statusIndicator) {
        leftSection.append(statusIndicator);
    }

    const globalActions = document.createElement("div");
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
                const resetTimer = setTimeout(() => {
                    resetBtn.style.opacity = "1";
                    resetBtn.disabled = false;
                }, 200);
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
        showNotification("No charts available", "warning");
        return;
    }

    // Filter out invalid charts using exportUtils validation
    const validCharts = charts.filter((chart) =>
        getExtendedExportUtils().isValidChart(chart)
    );

    if (validCharts.length === 0) {
        showNotification("No valid charts available", "warning");
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
    const overlay = document.createElement("div");
    const modalAbortController = new AbortController();
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

    for (const [index, chart] of validCharts.entries()) {
        const chartItem = document.createElement("button"),
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
    document.addEventListener("keydown", handleEscape, {
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
    document.body.append(overlay);
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

    const buttonController = new AbortController();
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

    const groupController = new AbortController();
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
 * Creates the field toggles section for showing/hiding specific metrics
 */

/*
 * Creates individual field toggle controls
 */
function createFieldToggle(field: string): HTMLDivElement {
    const container = document.createElement("div"),
        themeConfig = getThemeConfig();
    const fieldToggleController = new AbortController();
    const fieldToggleSignal = fieldToggleController.signal;
    container.className = "field-toggle";

    // Check if this field has valid data
    let hasValidData = false;
    if (
        getGlobalData() &&
        getGlobalData().recordMesgs &&
        getGlobalData().recordMesgs.length > 0
    ) {
        const data = getGlobalData().recordMesgs;

        switch (field) {
            case "altitude_profile": {
                hasValidData = data.some((row) => {
                    const altitude = row.altitude || row.enhancedAltitude;
                    return parseFiniteNumber(altitude) !== null;
                });

                break;
            }
            case "event_messages": {
                hasValidData = Boolean(
                    getGlobalData()?.eventMesgs &&
                    Array.isArray(getGlobalData().eventMesgs) &&
                    getGlobalData().eventMesgs.length > 0
                );

                break;
            }
            case "gps_track": {
                hasValidData = data.some((row) => {
                    const lat = row.positionLat,
                        long = row.positionLong;
                    return (
                        parseFiniteNumber(lat) !== null ||
                        parseFiniteNumber(long) !== null
                    );
                });

                break;
            }
            case "hr_lap_zone_individual":
            case "hr_lap_zone_stacked": {
                // Check for HR lap zone data
                if (getGlobalData().timeInZoneMesgs) {
                    const { timeInZoneMesgs } = getGlobalData(),
                        lapZoneMsgs = timeInZoneMesgs.filter(
                            (msg) => msg.referenceMesg === "lap"
                        ),
                        hrLapZones = lapZoneMsgs.filter(
                            (msg) => msg.timeInHrZone
                        );
                    hasValidData = hrLapZones.length > 0;
                }

                break;
            }
            case "power_lap_zone_individual":
            case "power_lap_zone_stacked": {
                // Check for Power lap zone data
                if (getGlobalData().timeInZoneMesgs) {
                    const { timeInZoneMesgs } = getGlobalData(),
                        lapZoneMsgs = timeInZoneMesgs.filter(
                            (msg) => msg.referenceMesg === "lap"
                        ),
                        powerLapZones = lapZoneMsgs.filter(
                            (msg) => msg.timeInPowerZone
                        );
                    hasValidData = powerLapZones.length > 0;
                }

                break;
            }
            case "power_vs_hr": {
                const hasHeartRate = data.some((row) => {
                        const hr = row.heartRate;
                        return parseFiniteNumber(hr) !== null;
                    }),
                    hasPower = data.some((row) => {
                        const { power } = row;
                        return parseFiniteNumber(power) !== null;
                    });
                hasValidData = hasPower && hasHeartRate;

                break;
            }
            case "speed_vs_distance": {
                const hasDistance = data.some((row) => {
                        const { distance } = row;
                        return parseFiniteNumber(distance) !== null;
                    }),
                    hasSpeed = data.some((row) => {
                        const speed = row.enhancedSpeed || row.speed;
                        return parseFiniteNumber(speed) !== null;
                    });
                hasValidData = hasSpeed && hasDistance;

                break;
            }
            default: {
                if (field.includes("hr_zone")) {
                    hasValidData = data.some((row) => {
                        const hr = row.heartRate;
                        return parseFiniteNumber(hr) !== null;
                    });
                } else if (field.includes("power_zone")) {
                    hasValidData = data.some((row) => {
                        const { power } = row;
                        return parseFiniteNumber(power) !== null;
                    });
                } else if (formatChartFields.includes(field)) {
                    // Regular chart field
                    const numericData = data.map((row) => {
                        if (row[field] !== undefined && row[field] !== null) {
                            return parseFiniteNumber(row[field]);
                        }
                        return null;
                    });
                    hasValidData = !numericData.every((val) => val === null);
                } else {
                    // Developer field
                    const numericData = data.map((row) => {
                        if (row[field] !== undefined && row[field] !== null) {
                            return parseFiniteNumber(row[field]);
                        }
                        return null;
                    });
                    hasValidData = !numericData.every((val) => val === null);
                }
            }
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
		${hasValidData ? "" : "opacity: 0.5; filter: grayscale(0.7);"}
	`;

    // Toggle switch
    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.id = `field-toggle-${field}`;
    toggle.checked = getChartFieldVisibility(field) !== "hidden";
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
    const isHRZoneChart = field.includes("hr_zone"),
        isLapZoneChart = field.includes("lap_zone"),
        isPowerZoneChart = field.includes("power_zone"),
        isZoneChart = isHRZoneChart || isPowerZoneChart;

    if (isZoneChart) {
        // Zone charts now only get toggle and label - unified color picker is in their dedicated sections
        container.append(toggle);
        container.append(label);
    } else if (isLapZoneChart) {
        // Lap zone charts only get toggle, no color picker (they use the same zone colors)
        container.append(toggle);
        container.append(label);
    } else {
        // Regular color picker for non-zone charts
        const colorPicker = document.createElement("input");
        colorPicker.type = "color";

        /*
         * Normalize potentially-corrupted stored color values into a hex6
         * string that <input type="color"> can accept.
         *
         * @param {unknown} value
         *
         * @returns {string | null}
         */
        const normalizeColorInputHex = (value: unknown): string | null => {
            if (typeof value !== "string") return null;
            const v = value.trim();
            if (/^#[\da-f]{6}$/iu.test(v)) return v;
            // #RRGGBBAA -> strip alpha
            if (/^#[\da-f]{8}$/iu.test(v)) return v.slice(0, 7);
            // #RGB / #RGBA -> expand and strip alpha
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
            return null;
        };

        const storedColor = getChartSetting(`color_${field}`);
        const candidate =
            storedColor ||
            fieldColors[field] ||
            (themeConfig as { colors?: { accent?: string } }).colors?.accent;
        colorPicker.value = normalizeColorInputHex(candidate) || "#3b82f6";
        colorPicker.style.cssText = `
			width: 32px;
			height: 32px;
			border: none;
			border-radius: 6px;
			cursor: pointer;
			background: none;
		`; // Event listeners for color picker
        colorPicker.addEventListener(
            "change",
            () => {
                setChartSetting(`color_${field}`, colorPicker.value);

                // Dispatch custom event for color change
                globalThis.dispatchEvent(
                    new CustomEvent("fieldToggleChanged", {
                        detail: {
                            field,
                            type: "color",
                            value: colorPicker.value,
                        },
                    })
                );

                reRenderChartsAfterSettingChange(
                    `${field}_color`,
                    colorPicker.value
                );
            },
            { signal: fieldToggleSignal }
        );

        container.append(toggle);
        container.append(label);
        container.append(colorPicker);
    } // Event listeners for toggle
    let statusUpdateTimer: ReturnType<typeof setTimeout> | undefined;
    toggle.addEventListener(
        "change",
        () => {
            const visibility = toggle.checked ? "visible" : "hidden";
            setChartFieldVisibility(field, visibility);

            // Dispatch custom event for field toggle change (for real-time updates)
            globalThis.dispatchEvent(
                new CustomEvent("fieldToggleChanged", {
                    detail: { field, visibility },
                })
            );

            // Trigger chart re-render through modern state management
            if (chartStateManager) {
                chartStateManager.debouncedRender(`Field toggle: ${field}`);
            } else {
                // Fallback without importing renderChartJS to avoid circular deps
                getChartDev()?.requestRerender?.("Field toggle fallback");
                globalThis.dispatchEvent(
                    new CustomEvent("ffv:request-render-charts", {
                        detail: { reason: "field-toggle" },
                    })
                );
            }

            // Update status indicators after a short delay to allow charts to render
            if (statusUpdateTimer) {
                clearTimeout(statusUpdateTimer);
            }
            statusUpdateTimer = setTimeout(() => {
                updateAllChartStatusIndicators();
            }, 100);
        },
        { signal: fieldToggleSignal }
    );
    // Hover effects
    container.addEventListener(
        "mouseenter",
        () => {
            container.style.background = "var(--color-glass-border)";
            container.style.transform = "translateY(-1px)";
        },
        { signal: fieldToggleSignal }
    );

    container.addEventListener(
        "mouseleave",
        () => {
            container.style.background = "var(--color-glass)";
            container.style.transform = "translateY(0)";
        },
        { signal: fieldToggleSignal }
    );

    return container;
}
/*
 * Creates a range slider control
 *
 * @param {ChartOption} option - The range control option configuration
 */
function createRangeControl(option: ChartOption): HTMLDivElement {
    const container = document.createElement("div");
    const rangeController = new AbortController();
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

    const slider = document.createElement("input") as HTMLInputElement & {
        timeout?: ReturnType<typeof setTimeout>;
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
    document.head.append(style);

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
                clearTimeout(slider.timeout);
                slider.timeout = setTimeout(() => {
                    reRenderChartsAfterSettingChange(option.id, safeValue);
                }, 300);
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
    const select = document.createElement("select");
    const selectController = new AbortController();
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
            const optionEl = document.createElement("option");
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
            ? String(option.options?.[0] ?? "")
            : String(option.default);
    const candidate =
        storedValue === null || storedValue === undefined
            ? fallback
            : String(storedValue);
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
                select.dispatchEvent(new Event("change"));
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
    const container = document.createElement("div") as HTMLDivElementExtended;
    const toggleController = new AbortController();
    const toggleSignal = toggleController.signal;
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

    const statusText = document.createElement("span");
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
    container._updateFromReset = function () {
        isOn = getCurrentValue();
        updateVisualState(isOn);
    };

    container.append(toggle);
    container.append(statusText);
    return container;
}

/*
 * Toggles all field visibility at once
 *
 * @param {boolean} enable - Whether to enable or disable all fields
 */
function toggleAllFields(enable: boolean): void {
    try {
        const // Get all possible field keys
            allFields = [
                ...formatChartFields,
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
            ],
            visibility = enable ? "visible" : "hidden";

        // Add developer fields if they exist
        if (getGlobalData() && getGlobalData().recordMesgs) {
            const devFields = extractDeveloperFieldsList(
                getGlobalData().recordMesgs
            );
            allFields.push(...devFields);
        } // Update localStorage for all fields
        for (const field of allFields) {
            setChartFieldVisibility(field, visibility);
        }

        // Dispatch custom event for bulk field toggle change
        globalThis.dispatchEvent(
            new CustomEvent("fieldToggleChanged", {
                detail: { fields: allFields, visibility },
            })
        );

        // Update all toggle checkboxes in the UI
        const toggles = document.querySelectorAll(
            '.field-toggle input[type="checkbox"]'
        );
        for (const toggle of toggles) {
            if (toggle instanceof HTMLInputElement) {
                toggle.checked = enable;
            }
        }

        // Show notification
        const action = enable ? "enabled" : "disabled";
        showNotification(`All charts ${action}`, "success");

        // Re-render charts and update status indicators through modern state management
        if (chartStateManager) {
            chartStateManager.debouncedRender(`All fields ${action}`);
        } else {
            getChartDev()?.requestRerender?.("Settings change fallback");
            globalThis.dispatchEvent(
                new CustomEvent("ffv:request-render-charts", {
                    detail: { reason: "settings-change" },
                })
            );
        }

        const statusTimer = setTimeout(() => {
            updateAllChartStatusIndicators();
        }, 100);
        void statusTimer;
    } catch (error) {
        console.error("[Settings] Error toggling all fields:", error);
        showNotification("Error updating chart visibility", "error");
    }
}
