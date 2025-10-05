import { formatCapitalize } from "../../formatting/display/formatCapitalize.js";
import { formatHeight } from "../../formatting/formatters/formatHeight.js";
import { formatManufacturer } from "../../formatting/formatters/formatManufacturer.js";
import { formatSensorName } from "../../formatting/formatters/formatSensorName.js";
import { formatWeight } from "../../formatting/formatters/formatWeight.js";
import { getThemeConfig } from "../../theming/core/theme.js";

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
        label: "Heart Rate Setting",
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
];

const DEVICE_FIELDS = [
    {
        label: "Manufacturer",
        getValue(device) {
            return formatManufacturer(device);
        },
    },
    {
        label: "Product",
        getValue(device) {
            const parts = [device?.productName, device?.product].filter(Boolean);
            return parts.length > 0 ? parts.join(" · ") : null;
        },
    },
    {
        label: "Software Version",
        getValue(device) {
            return Number.isFinite(device?.softwareVersion)
                ? `v${Number(device.softwareVersion).toFixed(1)}`
                : null;
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

            return device.serialNumber.length > 16
                ? `${device.serialNumber.slice(0, 12)}…`
                : device.serialNumber;
        },
    },
    {
        label: "Battery Status",
        getValue(device) {
            return typeof device?.batteryStatus === "string" ? formatCapitalize(device.batteryStatus) : null;
        },
    },
];

/**
 * Render the theme-aware user & device info box into the provided container.
 * @param {HTMLElement} container
 */
export function createUserDeviceInfoBox(container) {
    try {
        const globalData = /** @type {Record<string, unknown>} */ (globalThis).globalData ?? {};
        const userProfile = (globalData.userProfileMesgs?.[0]) ?? {};
        const deviceInfos = Array.isArray(globalData.deviceInfoMesgs)
            ? globalData.deviceInfoMesgs
            : [];
        const infoBox = document.createElement("section");
        infoBox.className = "user-device-info-box";
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
    const sensors = deviceInfos.filter((device) => device !== primaryDevice && (device?.descriptor || device?.deviceType || device?.productName));

    const section = document.createElement("section");
    section.className = "user-device-info-box__section user-device-info-box__section--device";

    const header = document.createElement("header");
    header.className = "user-device-info-box__header";
    header.innerHTML = `
        <span class="user-device-info-box__header-icon" aria-hidden="true">�</span>
        <h3 class="user-device-info-box__title">Device</h3>
    `;

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
    header.innerHTML = `
        <span class="user-device-info-box__header-icon" aria-hidden="true">�</span>
        <h3 class="user-device-info-box__title">Profile</h3>
    `;

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

function createFieldRow(label, value) {
    const row = document.createElement("div");
    row.className = "user-device-info-box__field";

    const term = document.createElement("dt");
    term.className = "user-device-info-box__field-label";
    term.textContent = label;

    const description = document.createElement("dd");
    description.className = "user-device-info-box__field-value";
    description.textContent = value;

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
