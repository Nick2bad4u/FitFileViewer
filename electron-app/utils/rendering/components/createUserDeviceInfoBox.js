import { formatCapitalize } from "../../formatting/display/formatCapitalize.js";
import { formatHeight } from "../../formatting/formatters/formatHeight.js";
import { formatManufacturer } from "../../formatting/formatters/formatManufacturer.js";
import { formatSensorName } from "../../formatting/formatters/formatSensorName.js";
import { formatWeight } from "../../formatting/formatters/formatWeight.js";
import { getGlobalData } from "../../state/domain/globalDataState.js";
import { getThemeConfig } from "../../theming/core/theme.js";
import { createIconElement } from "../../ui/icons/iconMappings.js";

/**
 * @typedef {import("../../formatting/formatters/formatManufacturer.js").ManufacturerInfo} ManufacturerInfo
 */

const PROFILE_FIELDS = [
    {
        label: "Device or Name",
        getValue(profile) {
            return typeof profile?.friendlyName === "string" && profile.friendlyName.trim().length > 0
                ? formatCapitalize(profile.friendlyName)
                : null;
        },
    },
    {
        label: "Gender",
        getValue(profile) {
            return typeof profile?.gender === "string" ? formatCapitalize(profile.gender) : null;
        },
    },
    {
        label: "Age",
        getValue(profile) {
            return Number.isFinite(profile?.age) ? `${profile.age} years` : null;
        },
    },
    {
        label: "Height",
        getValue(profile) {
            return Number.isFinite(profile?.height) ? formatHeight(profile.height) : null;
        },
    },
    {
        label: "Weight",
        getValue(profile) {
            return Number.isFinite(profile?.weight) ? formatWeight(profile.weight) : null;
        },
    },
    {
        label: "Resting HR",
        getValue(profile) {
            return Number.isFinite(profile?.restingHeartRate) ? `${profile.restingHeartRate} bpm` : null;
        },
    },
    {
        label: "Max HR",
        getValue(profile) {
            return Number.isFinite(profile?.defaultMaxHeartRate) ? `${profile.defaultMaxHeartRate} bpm` : null;
        },
    },
    {
        label: "Max Running HR",
        getValue(profile) {
            return Number.isFinite(profile?.defaultMaxRunningHeartRate)
                ? `${profile.defaultMaxRunningHeartRate} bpm`
                : null;
        },
    },
    {
        label: "Max Biking HR",
        getValue(profile) {
            return Number.isFinite(profile?.defaultMaxBikingHeartRate)
                ? `${profile.defaultMaxBikingHeartRate} bpm`
                : null;
        },
    },
    {
        label: "Language",
        getValue(profile) {
            return typeof profile?.language === "string" ? formatCapitalize(profile.language) : null;
        },
    },
    {
        label: "Elevation Setting",
        getValue(profile) {
            return typeof profile?.elevSetting === "string" ? formatCapitalize(profile.elevSetting) : null;
        },
    },
    {
        label: "Weight Setting",
        getValue(profile) {
            return typeof profile?.weightSetting === "string"
                ? formatCapitalize(profile.weightSetting)
                : null;
        },
    },
    {
        label: "Distance Setting",
        getValue(profile) {
            return typeof profile?.distSetting === "string" ? formatCapitalize(profile.distSetting) : null;
        },
    },
    {
        label: "Speed Setting",
        getValue(profile) {
            return typeof profile?.speedSetting === "string" ? formatCapitalize(profile.speedSetting) : null;
        },
    },
    {
        label: "Power Setting",
        getValue(profile) {
            return typeof profile?.powerSetting === "string" ? formatCapitalize(profile.powerSetting) : null;
        },
    },
    {
        label: "HR Setting",
        getValue(profile) {
            return typeof profile?.hrSetting === "string" ? formatCapitalize(profile.hrSetting) : null;
        },
    },
    {
        label: "Activity Class",
        getValue(profile) {
            return typeof profile?.activityClass === "string"
                ? formatCapitalize(profile.activityClass)
                : null;
        },
    },
    {
        label: "Position Setting",
        getValue(profile) {
            return typeof profile?.positionSetting === "string"
                ? formatCapitalize(profile.positionSetting)
                : null;
        },
    },
    {
        label: "Temperature Setting",
        getValue(profile) {
            return typeof profile?.temperatureSetting === "string"
                ? formatCapitalize(profile.temperatureSetting)
                : null;
        },
    },
    {
        label: "Running Step Length",
        getValue(profile) {
            return Number.isFinite(profile?.userRunningStepLength)
                ? formatStepLength(profile.userRunningStepLength)
                : null;
        },
    },
    {
        label: "Walking Step Length",
        getValue(profile) {
            return Number.isFinite(profile?.userWalkingStepLength)
                ? formatStepLength(profile.userWalkingStepLength)
                : null;
        },
    },
    {
        label: "Local ID",
        getValue(profile) {
            return typeof profile?.localId === "number" || typeof profile?.localId === "string"
                ? String(profile.localId)
                : null;
        },
    },
    {
        label: "Global ID",
        getValue(profile) {
            return typeof profile?.globalId === "number" || typeof profile?.globalId === "string"
                ? String(profile.globalId)
                : null;
        },
    },
    {
        label: "Wake Time",
        getValue(profile) {
            return typeof profile?.wakeTime === "string" && profile.wakeTime.trim().length > 0
                ? profile.wakeTime
                : null;
        },
    },
    {
        label: "Sleep Time",
        getValue(profile) {
            return typeof profile?.sleepTime === "string" && profile.sleepTime.trim().length > 0
                ? profile.sleepTime
                : null;
        },
    },
    {
        label: "Height Setting",
        getValue(profile) {
            return typeof profile?.heightSetting === "string" && profile.heightSetting.trim().length > 0
                ? formatCapitalize(profile.heightSetting)
                : null;
        },
    },
    {
        label: "Depth Setting",
        getValue(profile) {
            return typeof profile?.depthSetting === "string" && profile.depthSetting.trim().length > 0
                ? formatCapitalize(profile.depthSetting)
                : null;
        },
    },
    {
        label: "Dive Count",
        getValue(profile) {
            return Number.isFinite(profile?.diveCount) ? String(profile.diveCount) : null;
        },
    },
];

/**
 * Narrow unknown values to a record-like object.
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isRecord(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

const DEVICE_FIELDS = [
    {
        label: "Manufacturer",
        getValue(device) {
            if (device?.manufacturer === undefined || device.manufacturer === null) {
                return null;
            }
            return formatManufacturer(device.manufacturer);
        },
    },
    {
        label: "Device Model",
        getValue(device) {
            return typeof device?.garminProduct === "string" && device.garminProduct.trim().length > 0
                ? formatCapitalize(device.garminProduct)
                : null;
        },
    },
    {
        label: "Software Version",
        getValue(device) {
            if (!Number.isFinite(device?.softwareVersion)) {
                return null;
            }
            const version = Number(device.softwareVersion);
            return `v${version.toFixed(version % 1 === 0 ? 0 : 1)}`;
        },
    },
    {
        label: "Hardware Version",
        getValue(device) {
            return Number.isFinite(device?.hardwareVersion) ? `v${device.hardwareVersion}` : null;
        },
    },
    {
        label: "Serial Number",
        getValue(device) {
            if (typeof device?.serialNumber !== "string" || device.serialNumber.trim().length === 0) {
                return null;
            }
            const serial = device.serialNumber.trim();
            if (serial.length <= 12) {
                return { text: serial, full: serial };
            }
            return { text: `${serial.slice(0, 11)}…`, full: serial };
        },
    },
    {
        label: "Battery Status",
        getValue(device) {
            return typeof device?.batteryStatus === "string" && device.batteryStatus.trim().length > 0
                ? formatCapitalize(device.batteryStatus)
                : null;
        },
    },
];

/**
 * Render the theme-aware user & device info box into the provided container.
 * @param {HTMLElement} container
 */
export function createUserDeviceInfoBox(container) {
    try {
        const stateData = getGlobalData();
        const host = /** @type {Record<string, unknown>} */ (
            typeof globalThis === "object" && globalThis ? /** @type {any} */ (globalThis) : {}
        );
        const legacyData = host.globalData;
        const globalData = /** @type {Record<string, unknown>} */ (
            isRecord(stateData) ? stateData : isRecord(legacyData) ? legacyData : {}
        );
        const userProfiles = Array.isArray(globalData.userProfileMesgs) ? globalData.userProfileMesgs : [];
        const userProfile = /** @type {Record<string, unknown>} */ (userProfiles[0] ?? {});
        const deviceInfos = Array.isArray(globalData.deviceInfoMesgs) ? globalData.deviceInfoMesgs : [];
        const infoBox = document.createElement("section");
        infoBox.className = "user-device-info-box chart-info-section";
        infoBox.dataset.themeName = getThemeConfig()?.name ?? "default";

        const profileSection = buildProfileSection(userProfile);
        const deviceSection = buildDeviceSection(deviceInfos);

        if (profileSection) {
            infoBox.append(profileSection);
        }

        if (deviceSection) {
            infoBox.append(deviceSection);
        }

        if (!profileSection && !deviceSection) {
            infoBox.classList.add("user-device-info-box--empty");
            infoBox.append(createEmptyState());
        }

        container.append(infoBox);

        // Listen for theme changes and update the data attribute
        const updateTheme = () => {
            const currentTheme = getThemeConfig()?.name ?? "default";
            infoBox.dataset.themeName = currentTheme;
            console.log("[ChartJS] User device info box theme updated:", currentTheme);
        };

        document.body.addEventListener("themechange", updateTheme);

        // Store cleanup function for potential future use
        infoBox.dataset.themeCleanup = "registered";

        console.log(
            "[ChartJS] User and device info box rendered with theme:",
            infoBox.dataset.themeName ?? "unknown"
        );
    } catch (error) {
        console.error("[ChartJS] Failed to render user & device info", error);
    }
}

function buildDeviceSection(deviceInfos) {
    if (!Array.isArray(deviceInfos) || deviceInfos.length === 0) {
        return null;
    }

    const primaryDevice = selectPrimaryDevice(deviceInfos);
    const sensors = deviceInfos.filter((device) => device !== primaryDevice);

    const section = document.createElement("section");
    section.className = "user-device-info-box__section user-device-info-box__section--device";

    const header = document.createElement("header");
    header.className = "user-device-info-box__header";
    const deviceIconWrapper = document.createElement("span");
    deviceIconWrapper.className = "user-device-info-box__header-icon";
    deviceIconWrapper.setAttribute("aria-hidden", "true");
    deviceIconWrapper.append(createIconElement("mdi:watch-variant", 18));
    const deviceTitle = document.createElement("h3");
    deviceTitle.className = "user-device-info-box__title";
    deviceTitle.textContent = "Device";
    header.append(deviceIconWrapper, deviceTitle);

    const detailsCard = document.createElement("div");
    detailsCard.className = "user-device-info-box__card";

    const detailsTitle = document.createElement("h4");
    detailsTitle.className = "user-device-info-box__card-title";
    detailsTitle.textContent = "Primary Device";

    const fieldList = document.createElement("dl");
    fieldList.className = "user-device-info-box__fields";

    for (const config of DEVICE_FIELDS) {
        const value = config.getValue(primaryDevice);
        if (!value) {
            continue;
        }
        fieldList.append(createFieldRow(config.label, value));
    }

    detailsCard.append(detailsTitle, fieldList);

    const sensorsCard = buildSensorsGroup(sensors);

    section.append(header, detailsCard);
    if (sensorsCard) {
        section.append(sensorsCard);
    }

    return section;
}

function buildProfileSection(profile) {
    const fragment = document.createDocumentFragment();
    const fields = PROFILE_FIELDS.map((config) => ({ config, value: config.getValue(profile) })).filter((entry) => entry.value !== null);

    if (fields.length === 0) {
        return null;
    }

    const section = document.createElement("section");
    section.className = "user-device-info-box__section user-device-info-box__section--profile";

    const header = document.createElement("header");
    header.className = "user-device-info-box__header";
    const profileIconWrapper = document.createElement("span");
    profileIconWrapper.className = "user-device-info-box__header-icon";
    profileIconWrapper.setAttribute("aria-hidden", "true");
    profileIconWrapper.append(createIconElement("mdi:account-badge", 18));
    const profileTitle = document.createElement("h3");
    profileTitle.className = "user-device-info-box__title";
    profileTitle.textContent = "Profile";
    header.append(profileIconWrapper, profileTitle);

    const fieldList = document.createElement("dl");
    fieldList.className = "user-device-info-box__fields";

    for (const { config, value } of fields) {
        fieldList.append(createFieldRow(config.label, value ?? ""));
    }

    fragment.append(header, fieldList);
    section.append(fragment);
    return section;
}

function buildSensorsGroup(sensors) {
    if (!sensors || sensors.length === 0) {
        return null;
    }

    const card = document.createElement("div");
    card.className = "user-device-info-box__card user-device-info-box__card--sensors";

    const heading = document.createElement("h4");
    heading.className = "user-device-info-box__card-title";
    heading.textContent = `Connected Sensors (${sensors.length})`;

    const list = document.createElement("ul");
    list.className = "sensor-pill-list";

    for (const sensor of sensors) {
        const pill = document.createElement("li");
        pill.className = "sensor-pill";
        pill.textContent = formatSensorName(sensor);
        list.append(pill);
    }

    card.append(heading, list);
    return card;
}

function createEmptyState() {
    const empty = document.createElement("p");
    empty.className = "user-device-info-box__empty";
    empty.textContent = "No profile or device metadata detected in this FIT file.";
    return empty;
}

/**
 * @param {string} label
 * @param {string | { text: string; full?: string }} value
 * @returns {HTMLDivElement}
 */
function createFieldRow(label, value) {
    const row = document.createElement("div");
    row.className = "user-device-info-box__field";

    const term = document.createElement("dt");
    term.className = "user-device-info-box__field-label";
    term.textContent = label;

    const description = document.createElement("dd");
    description.className = "user-device-info-box__field-value";
    if (typeof value === "string") {
        description.textContent = value;
    } else if (value && typeof value === "object") {
        const text = value.text ?? "";
        description.textContent = text;
        if (value.full && value.full !== text) {
            description.title = value.full;
        }
    }

    row.append(term, description);
    return row;
}

function formatStepLength(rawValue) {
    const meters = Number(rawValue) / 1000;
    if (!Number.isFinite(meters) || meters <= 0) {
        return null;
    }

    return `${meters.toFixed(2)} m`;
}

function selectPrimaryDevice(deviceInfos) {
    const sorted = [...deviceInfos].sort((a, b) => {
        const aSource = typeof a?.sourceType === "string" ? a.sourceType : "";
        const bSource = typeof b?.sourceType === "string" ? b.sourceType : "";
        if (aSource === bSource) {
            return 0;
        }
        if (aSource === "local") {
            return -1;
        }
        if (bSource === "local") {
            return 1;
        }
        return 0;
    });

    return sorted[0] ?? deviceInfos[0] ?? {};
}
