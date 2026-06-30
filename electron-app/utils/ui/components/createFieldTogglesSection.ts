import { reRenderChartsAfterSettingChange } from "../../app/initialization/getCurrentSettings.js";
import { getRegisteredChartActions } from "../../charts/core/chartActionsRegistry.js";
import { getRegisteredChartStateManager } from "../../charts/core/chartStateManagerRegistry.js";
import { updateAllChartStatusIndicators } from "../../charts/components/chartStatusIndicator.js";
import { extractDeveloperFieldsList } from "../../data/processing/extractDeveloperFieldsList.js";
import {
    fieldColors,
    fieldLabels,
    formatChartFields,
} from "../../formatting/display/formatChartFields.js";
import { getActiveFitActivityData } from "../../state/domain/fitActivityDataState.js";
import {
    getChartFieldVisibility,
    getChartSetting,
    setChartFieldVisibility,
    setChartSetting,
} from "../../state/domain/settingsStateManager.js";
import { getThemeConfig } from "../../theming/core/theme.js";
import { showNotification } from "../notifications/showNotification.js";
import {
    getCreateFieldTogglesSectionRuntime,
    type CreateFieldTogglesSectionRuntime,
    type CreateFieldTogglesSectionTimerHandle,
} from "./createFieldTogglesSectionRuntime.js";

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

type FieldToggleFitData = {
    eventMesgs: LooseRecord[];
    recordMesgs: FitRecord[];
    timeInZoneMesgs: ZoneMessage[];
};

function isLooseRecord(value: unknown): value is LooseRecord {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeFieldToggleMessages<TMessage extends LooseRecord>(
    messages: unknown
): TMessage[] {
    return Array.isArray(messages)
        ? messages.filter((message): message is TMessage =>
              isLooseRecord(message)
          )
        : [];
}

function getManagedFieldToggleFitData(): FieldToggleFitData {
    const activityData = getActiveFitActivityData();
    return {
        eventMesgs: normalizeFieldToggleMessages(activityData.eventMesgs),
        recordMesgs: normalizeFieldToggleMessages(activityData.recordMesgs),
        timeInZoneMesgs: normalizeFieldToggleMessages(
            activityData.timeInZoneMesgs
        ),
    };
}

function requestChartRerenderFallback(reason: string): void {
    getRegisteredChartActions()?.requestRerender?.(reason);
}

function requestManagedChartRerender(
    reason: string,
    fallbackReason: string,
    eventReason: string,
    runtime: CreateFieldTogglesSectionRuntime
): void {
    const registeredChartStateManager = getRegisteredChartStateManager();
    if (registeredChartStateManager) {
        registeredChartStateManager.debouncedRender(reason);
        return;
    }

    requestChartRerenderFallback(fallbackReason);
    runtime.dispatchEvent(
        runtime.createCustomEvent("ffv:request-render-charts", {
            detail: { reason: eventReason },
        })
    );
}

function parseFiniteNumber(value: unknown): number | null {
    if (value === null || value === undefined) {
        return null;
    }

    let parsed = Number.NaN;

    if (typeof value === "number") {
        parsed = value;
    } else if (typeof value === "string") {
        parsed = Number.parseFloat(value);
    }

    return Number.isFinite(parsed) ? parsed : null;
}

function normalizeColorInputHex(value: unknown): string | null {
    if (typeof value !== "string") {
        return null;
    }

    const normalized = value.trim();
    if (/^#[\da-f]{6}$/iu.test(normalized)) {
        return normalized;
    }

    if (/^#[\da-f]{8}$/iu.test(normalized)) {
        return normalized.slice(0, 7);
    }

    if (/^#[\da-f]{3,4}$/iu.test(normalized)) {
        const r = normalized.charAt(1),
            g = normalized.charAt(2),
            b = normalized.charAt(3);
        return `#${r}${r}${g}${g}${b}${b}`;
    }

    return null;
}

/** Creates the per-field chart visibility toggles section. */
export function createFieldTogglesSection(wrapper: HTMLElement): void {
    // Check if fields section already exists
    if (wrapper.querySelector(".fields-section")) {
        return;
    }

    const runtime = getCreateFieldTogglesSectionRuntime();
    const fieldsSection = runtime.createElement("div");
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
    const fieldsTitle = runtime.createElement("div");
    fieldsTitle.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 0 0 12px 0;
    `;

    const titleText = runtime.createElement("h4");
    titleText.textContent = "Visible Metrics";
    titleText.style.cssText = `
        margin: 0;
        color: var(--color-accent-secondary);
        font-size: 16px;
        font-weight: 600;
    `;

    const toggleAllContainer = runtime.createElement("div");
    toggleAllContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
    `;

    const enableAllBtn = runtime.createElement("button");
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

    const disableAllBtn = runtime.createElement("button");
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

    const toggleButtonsController = runtime.createAbortController();
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
            toggleAllFields(true, runtime);
        },
        { signal: toggleButtonsSignal }
    );

    disableAllBtn.addEventListener(
        "click",
        () => {
            toggleAllFields(false, runtime);
        },
        { signal: toggleButtonsSignal }
    );

    toggleAllContainer.append(enableAllBtn);
    toggleAllContainer.append(disableAllBtn);

    fieldsTitle.append(titleText);
    fieldsTitle.append(toggleAllContainer);

    const fieldsGrid = runtime.createElement("div");
    fieldsGrid.style.cssText = `
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 12px;
	`; // Add field toggles
    for (const field of formatChartFields) {
        const fieldToggle = createFieldToggle(field, runtime);
        fieldsGrid.append(fieldToggle);
    } // Add GPS track toggle
    const gpsTrackToggle = createFieldToggle("gps_track", runtime);
    fieldsGrid.append(gpsTrackToggle);

    // Add performance analysis chart toggles
    const speedVsDistanceToggle = createFieldToggle(
        "speed_vs_distance",
        runtime
    );
    fieldsGrid.append(speedVsDistanceToggle);

    const powerVsHRToggle = createFieldToggle("power_vs_hr", runtime);
    fieldsGrid.append(powerVsHRToggle);
    const altitudeProfileToggle = createFieldToggle(
        "altitude_profile",
        runtime
    );
    fieldsGrid.append(altitudeProfileToggle); // HR zone toggles will be moved to the HR zone controls section
    const hrZoneDoughnutToggle = createFieldToggle("hr_zone_doughnut", runtime);
    fieldsGrid.append(hrZoneDoughnutToggle);

    // Power zone toggles are created separately and moved to the dedicated power zone section
    const powerZoneDoughnutToggle = createFieldToggle(
        "power_zone_doughnut",
        runtime
    );
    fieldsGrid.append(powerZoneDoughnutToggle);

    // Add lap zone chart toggles if data exists
    const managedFitData = getManagedFieldToggleFitData();

    if (managedFitData.timeInZoneMesgs.length > 0) {
        const lapZoneMsgs = managedFitData.timeInZoneMesgs.filter(
            (msg) => msg.referenceMesg === "lap"
        );

        if (lapZoneMsgs.length > 0) {
            // Check for HR lap zone data
            const hrLapZones = lapZoneMsgs.filter((msg) => msg.timeInHrZone);
            if (hrLapZones.length > 0) {
                const hrLapStackedToggle = createFieldToggle(
                    "hr_lap_zone_stacked",
                    runtime
                );
                fieldsGrid.append(hrLapStackedToggle);

                const hrLapIndividualToggle = createFieldToggle(
                    "hr_lap_zone_individual",
                    runtime
                );
                fieldsGrid.append(hrLapIndividualToggle);
            }

            // Check for Power lap zone data
            const powerLapZones = lapZoneMsgs.filter(
                (msg) => msg.timeInPowerZone
            );
            if (powerLapZones.length > 0) {
                const powerLapStackedToggle = createFieldToggle(
                    "power_lap_zone_stacked",
                    runtime
                );
                fieldsGrid.append(powerLapStackedToggle);

                const powerLapIndividualToggle = createFieldToggle(
                    "power_lap_zone_individual",
                    runtime
                );
                fieldsGrid.append(powerLapIndividualToggle);
            }
        }
    }

    // Add event messages toggle if data exists
    if (managedFitData.eventMesgs.length > 0) {
        const eventMessagesToggle = createFieldToggle(
            "event_messages",
            runtime
        );
        fieldsGrid.append(eventMessagesToggle);
    }

    // Add developer fields toggles if data exists
    if (managedFitData.recordMesgs.length > 0) {
        const devFields = extractDeveloperFieldsList(
            managedFitData.recordMesgs
        );
        for (const field of devFields) {
            const fieldToggle = createFieldToggle(field, runtime);
            fieldsGrid.append(fieldToggle);
        }
    }

    fieldsSection.append(fieldsTitle);
    fieldsSection.append(fieldsGrid);
    wrapper.append(fieldsSection);
}

/*
 * Creates individual field toggle controls
 */
function hasNumericData(data: FitRecord[], field: string): boolean {
    return data.some((row) => parseFiniteNumber(row[field]) !== null);
}

function hasLapZoneData(
    field: string,
    timeInZoneMesgs: ZoneMessage[]
): boolean {
    const lapZoneMsgs = timeInZoneMesgs.filter(
        (msg) => msg.referenceMesg === "lap"
    );

    if (field.startsWith("hr_lap_zone_")) {
        return lapZoneMsgs.some((msg) => Boolean(msg.timeInHrZone));
    }

    if (field.startsWith("power_lap_zone_")) {
        return lapZoneMsgs.some((msg) => Boolean(msg.timeInPowerZone));
    }

    return false;
}

function hasValidDataForField(field: string): boolean {
    const rawFitData = getManagedFieldToggleFitData();
    if (rawFitData.recordMesgs.length === 0) {
        return false;
    }

    const data = rawFitData.recordMesgs;
    switch (field) {
        case "altitude_profile": {
            return data.some((row) => {
                const altitude = row.altitude || row.enhancedAltitude;
                return parseFiniteNumber(altitude) !== null;
            });
        }
        case "event_messages": {
            return rawFitData.eventMesgs.length > 0;
        }
        case "gps_track": {
            return data.some(
                (row) =>
                    parseFiniteNumber(row.positionLat) !== null ||
                    parseFiniteNumber(row.positionLong) !== null
            );
        }
        case "hr_lap_zone_individual":
        case "hr_lap_zone_stacked":
        case "power_lap_zone_individual":
        case "power_lap_zone_stacked": {
            return hasLapZoneData(field, rawFitData.timeInZoneMesgs);
        }
        case "power_vs_hr": {
            return (
                hasNumericData(data, "power") &&
                hasNumericData(data, "heartRate")
            );
        }
        case "speed_vs_distance": {
            return (
                hasNumericData(data, "distance") &&
                data.some((row) => {
                    const speed = row.enhancedSpeed || row.speed;
                    return parseFiniteNumber(speed) !== null;
                })
            );
        }
        default: {
            if (field.includes("hr_zone")) {
                return hasNumericData(data, "heartRate");
            }

            if (field.includes("power_zone")) {
                return hasNumericData(data, "power");
            }

            return hasNumericData(data, field);
        }
    }
}

function createFieldToggle(
    field: string,
    runtime: CreateFieldTogglesSectionRuntime
): HTMLDivElement {
    const container = runtime.createElement("div"),
        themeConfig = getThemeConfig();
    const fieldToggleController = runtime.createAbortController();
    const fieldToggleSignal = fieldToggleController.signal;
    container.className = "field-toggle";

    const hasValidData = hasValidDataForField(field);

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
    const toggle = runtime.createElement("input");
    toggle.type = "checkbox";
    toggle.id = `field-toggle-${field}`;
    toggle.checked = getChartFieldVisibility(field) !== "hidden";
    toggle.style.cssText = `
		width: 18px;
		height: 18px;
		cursor: pointer;
	`;

    // Field label
    const label = runtime.createElement("label");
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
        const colorPicker = runtime.createElement("input");
        colorPicker.type = "color";

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
                runtime.dispatchEvent(
                    runtime.createCustomEvent("fieldToggleChanged", {
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
    let statusUpdateTimer: CreateFieldTogglesSectionTimerHandle | undefined;
    toggle.addEventListener(
        "change",
        () => {
            const visibility = toggle.checked ? "visible" : "hidden";
            setChartFieldVisibility(field, visibility);

            // Dispatch custom event for field toggle change (for real-time updates)
            runtime.dispatchEvent(
                runtime.createCustomEvent("fieldToggleChanged", {
                    detail: { field, visibility },
                })
            );

            requestManagedChartRerender(
                `Field toggle: ${field}`,
                "Field toggle fallback",
                "field-toggle",
                runtime
            );

            // Update status indicators after a short delay to allow charts to render
            if (statusUpdateTimer) {
                runtime.clearTimeout(statusUpdateTimer);
            }
            statusUpdateTimer = runtime.setTimeout(() => {
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
 * Toggles all field visibility at once
 *
 * @param {boolean} enable - Whether to enable or disable all fields
 */
function toggleAllFields(
    enable: boolean,
    runtime: CreateFieldTogglesSectionRuntime
): void {
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
        const managedFitData = getManagedFieldToggleFitData();
        if (managedFitData.recordMesgs.length > 0) {
            const devFields = extractDeveloperFieldsList(
                managedFitData.recordMesgs
            );
            allFields.push(...devFields);
        } // Update localStorage for all fields
        for (const field of allFields) {
            setChartFieldVisibility(field, visibility);
        }

        // Dispatch custom event for bulk field toggle change
        runtime.dispatchEvent(
            runtime.createCustomEvent("fieldToggleChanged", {
                detail: { fields: allFields, visibility },
            })
        );

        // Update all toggle checkboxes in the UI
        const toggles = runtime.queryFieldCheckboxToggles();
        for (const toggle of toggles) {
            if (runtime.isHTMLInputElement(toggle)) {
                toggle.checked = enable;
            }
        }

        // Show notification
        const action = enable ? "enabled" : "disabled";
        void showNotification(`All charts ${action}`, "success");

        requestManagedChartRerender(
            `All fields ${action}`,
            "Settings change fallback",
            "settings-change",
            runtime
        );

        runtime.setTimeout(() => {
            updateAllChartStatusIndicators();
        }, 100);
    } catch (error) {
        console.error("[Settings] Error toggling all fields:", error);
        void showNotification("Error updating chart visibility", "error");
    }
}
