import { sanitizeHtmlAllowlist } from "../../dom/index.js";
import { formatCapitalize } from "../../formatting/display/formatCapitalize.js";
import { formatHeight } from "../../formatting/formatters/formatHeight.js";
import { formatManufacturer } from "../../formatting/formatters/formatManufacturer.js";
import { formatSensorName } from "../../formatting/formatters/formatSensorName.js";
import { formatWeight } from "../../formatting/formatters/formatWeight.js";
import {
    getActiveFitUserDeviceData,
    type FitDeviceInfo,
    type FitUserProfileData,
} from "../../state/domain/fitUserDeviceDataState.js";
import {
    getThemeConfig,
    type ThemeColorMap,
} from "../../theming/core/theme.js";
import {
    getUserDeviceInfoBoxRuntime,
    type UserDeviceInfoBoxRuntime,
} from "./createUserDeviceInfoBoxRuntime.js";

type InfoBoxThemeColors = {
    readonly accent: string;
    readonly border: string;
    readonly borderLight: string;
    readonly primary: string;
    readonly primaryShadow: string;
    readonly primaryShadowHeavy: string;
    readonly primaryShadowLight: string;
    readonly shadow: string;
    readonly shadowHeavy: string;
    readonly shadowLight: string;
    readonly shadowMedium: string;
    readonly surface: string;
    readonly surfaceSecondary: string;
    readonly text: string;
    readonly textPrimary: string;
    readonly textSecondary: string;
};

const ALLOWED_INFO_BOX_ATTRIBUTES = [
    "aria-label",
    "class",
    "id",
    "role",
    "style",
    "tabindex",
    "title",
] as const;

const ALLOWED_INFO_BOX_TAGS = [
    "DIV",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "SPAN",
    "STRONG",
] as const;

const INFO_BOX_THEME_FALLBACKS = {
    accent: "#3b82f6",
    border: "#e5e7eb",
    borderLight: "rgba(0, 0, 0, 0.05)",
    primary: "#3b82f6",
    primaryShadow: "#2563eb4d",
    primaryShadowHeavy: "#2563eb33",
    primaryShadowLight: "#2563eb0d",
    shadow: "rgba(0, 0, 0, 0.15)",
    shadowHeavy: "rgba(0, 0, 0, 0.15)",
    shadowLight: "rgba(0, 0, 0, 0.05)",
    shadowMedium: "rgba(0, 0, 0, 0.1)",
    surface: "#f8f9fa",
    surfaceSecondary: "#e9ecef",
    text: "#1e293b",
    textPrimary: "#0f172a",
    textSecondary: "#6b7280",
} as const satisfies InfoBoxThemeColors;

function userDeviceInfoBoxRuntime(): UserDeviceInfoBoxRuntime {
    return getUserDeviceInfoBoxRuntime();
}

function getStringThemeColor(
    colors: ThemeColorMap,
    colorKey: keyof InfoBoxThemeColors
): string {
    const color = colors[colorKey];
    return typeof color === "string" && color
        ? color
        : INFO_BOX_THEME_FALLBACKS[colorKey];
}

function getInfoBoxThemeColors(colors: ThemeColorMap): InfoBoxThemeColors {
    return {
        accent: getStringThemeColor(colors, "accent"),
        border: getStringThemeColor(colors, "border"),
        borderLight: getStringThemeColor(colors, "borderLight"),
        primary: getStringThemeColor(colors, "primary"),
        primaryShadow: getStringThemeColor(colors, "primaryShadow"),
        primaryShadowHeavy: getStringThemeColor(colors, "primaryShadowHeavy"),
        primaryShadowLight: getStringThemeColor(colors, "primaryShadowLight"),
        shadow: getStringThemeColor(colors, "shadow"),
        shadowHeavy: getStringThemeColor(colors, "shadowHeavy"),
        shadowLight: getStringThemeColor(colors, "shadowLight"),
        shadowMedium: getStringThemeColor(colors, "shadowMedium"),
        surface: getStringThemeColor(colors, "surface"),
        surfaceSecondary: getStringThemeColor(colors, "surfaceSecondary"),
        text: getStringThemeColor(colors, "text"),
        textPrimary: getStringThemeColor(colors, "textPrimary"),
        textSecondary: getStringThemeColor(colors, "textSecondary"),
    };
}

function sanitizeInfoBoxHtml(html: string): DocumentFragment {
    return sanitizeHtmlAllowlist(html, {
        allowedAttributes: ALLOWED_INFO_BOX_ATTRIBUTES,
        allowedTags: ALLOWED_INFO_BOX_TAGS,
        stripUrlInStyle: true,
    });
}

/**
 * Creates an info box displaying user profile and device information.
 *
 * @param container - Container to append the info box to.
 */
export function createUserDeviceInfoBox(container: HTMLElement): void {
    try {
        const {
                deviceInfos,
                userProfile,
            }: {
                deviceInfos: FitDeviceInfo[];
                userProfile: FitUserProfileData;
            } = getActiveFitUserDeviceData(),
            infoBox = userDeviceInfoBoxRuntime().createElement("div"),
            themeConfig = getThemeConfig(),
            colors = getInfoBoxThemeColors(themeConfig.colors);
        const { signal } = userDeviceInfoBoxRuntime().createAbortController();

        // Create info box container with theme-aware styling and hover effects.
        infoBox.className = "user-device-info-box chart-info-section";
        infoBox.style.cssText = `
            border: 2px solid ${colors.border};
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 24px;
            display: flex;
            flex-wrap: wrap;
            gap: 28px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 4px 20px ${colors.shadowMedium},
                        0 2px 8px ${colors.primaryShadowLight};
            color: ${colors.text};
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        `;

        // Add hover effects using event listeners
        infoBox.addEventListener(
            "mouseenter",
            () => {
                infoBox.style.transform = "translateY(-4px) scale(1.01)";
                infoBox.style.boxShadow = `0 8px 40px ${colors.shadowHeavy},
                                       0 4px 16px ${colors.primaryShadowHeavy}`;
                infoBox.style.borderColor = colors.primary;
            },
            { signal }
        );

        infoBox.addEventListener(
            "mouseleave",
            () => {
                infoBox.style.transform = "translateY(0) scale(1)";
                infoBox.style.boxShadow = `0 4px 20px ${colors.shadowMedium},
                                       0 2px 8px ${colors.primaryShadowLight}`;
                infoBox.style.borderColor = colors.border;
            },
            { signal }
        );

        // Add animated border glow effect
        const glowOverlay = userDeviceInfoBoxRuntime().createElement("div");
        glowOverlay.style.cssText = `
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            border-radius: 18px;
            opacity: 0;
            z-index: -1;
            transition: opacity 0.4s ease;
        `;
        infoBox.append(glowOverlay);

        infoBox.addEventListener(
            "mouseenter",
            () => {
                glowOverlay.style.opacity = "0.3";
            },
            { signal }
        );

        infoBox.addEventListener(
            "mouseleave",
            () => {
                glowOverlay.style.opacity = "0";
            },
            { signal }
        ); // User Profile Section with enhanced styling
        const userSection = userDeviceInfoBoxRuntime().createElement("div");
        userSection.className = "user-profile-section";
        userSection.style.cssText = `
            flex: 1;
            min-width: 320px;
            background: ${colors.surface};
            border: 1px solid ${colors.border};
            border-radius: 12px;
            padding: 20px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        `;

        // Add hover effects to user section
        userSection.addEventListener(
            "mouseenter",
            () => {
                userSection.style.transform = "translateY(-2px)";
                userSection.style.boxShadow = `0 6px 20px ${colors.shadow}`;
                userSection.style.borderColor = colors.primary;
            },
            { signal }
        );

        userSection.addEventListener(
            "mouseleave",
            () => {
                userSection.style.transform = "translateY(0)";
                userSection.style.boxShadow = "none";
                userSection.style.borderColor = colors.border;
            },
            { signal }
        );

        // User Profile Section with enhanced styling and more fields
        const rawUserSectionHtml = `
            <div class="user-profile-card" style="margin-bottom: 20px; padding: 16px; background: linear-gradient(135deg, ${colors.surfaceSecondary}, ${colors.surface}); border-radius: 12px; border: 2px solid ${colors.border}; transition: all 0.3s ease; position: relative; overflow: hidden;" onmouseenter="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 25px ${colors.shadow}'; this.style.borderColor='${colors.primary}'" onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='none'; this.style.borderColor='${colors.border}'">
            <div class="user-profile-heading" style="font-weight: 700; margin-bottom: 12px; color: ${colors.text}; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                <span style="background: ${colors.primary}; color: ${colors.textPrimary}; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px;">👤</span>
                User Profile
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 14px; color: ${colors.text};">
                ${userProfile.friendlyName ? `<div style="padding: 8px; border-radius: 8px; background: ${colors.surfaceSecondary}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surfaceSecondary}'"><strong style="color: ${colors.primary};">Device or Name:</strong> ${formatCapitalize(userProfile.friendlyName)}</div>` : ""}
                ${userProfile.gender ? `<div style="padding: 8px; border-radius: 8px; background: ${colors.surfaceSecondary}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surfaceSecondary}'"><strong style="color: ${colors.primary};">Gender:</strong> ${formatCapitalize(userProfile.gender)}</div>` : ""}
                ${userProfile.age ? `<div style="padding: 8px; border-radius: 8px; background: ${colors.surfaceSecondary}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surfaceSecondary}'"><strong style="color: ${colors.primary};">Age:</strong> ${userProfile.age} years</div>` : ""}
                ${userProfile.height ? `<div style="padding: 8px; border-radius: 8px; background: ${colors.surfaceSecondary}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surfaceSecondary}'"><strong style="color: ${colors.primary};">Height:</strong> ${formatHeight(userProfile.height)}</div>` : ""}
                ${userProfile.weight ? `<div style="padding: 8px; border-radius: 8px; background: ${colors.surfaceSecondary}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surfaceSecondary}'"><strong style="color: ${colors.primary};">Weight:</strong> ${formatWeight(userProfile.weight)}</div>` : ""}
                ${userProfile.language ? `<div style="padding: 8px; border-radius: 8px; background: ${colors.surfaceSecondary}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surfaceSecondary}'"><strong style="color: ${colors.primary};">Language:</strong> ${formatCapitalize(userProfile.language)}</div>` : ""}
                ${userProfile.elevSetting ? `<div style="padding: 8px; border-radius: 8px; background: ${colors.surfaceSecondary}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surfaceSecondary}'"><strong style="color: ${colors.primary};">Elevation Setting:</strong> ${formatCapitalize(userProfile.elevSetting)}</div>` : ""}
                ${userProfile.weightSetting ? `<div style="padding: 8px; border-radius: 8px; background: ${colors.surfaceSecondary}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surfaceSecondary}'"><strong style="color: ${colors.primary};">Weight Setting:</strong> ${formatCapitalize(userProfile.weightSetting)}</div>` : ""}
                ${userProfile.restingHeartRate ? `<div style="padding: 8px; border-radius: 8px; background: ${colors.surfaceSecondary}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surfaceSecondary}'"><strong style="color: ${colors.primary};">Resting HR:</strong> ${userProfile.restingHeartRate} bpm</div>` : ""}
                ${userProfile.defaultMaxHeartRate ? `<div style="padding: 8px; border-radius: 8px; background: ${colors.surfaceSecondary}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surfaceSecondary}'"><strong style="color: ${colors.primary};">Max HR:</strong> ${userProfile.defaultMaxHeartRate} bpm</div>` : ""}
                ${userProfile.defaultMaxRunningHeartRate ? `<div style="padding: 8px; border-radius: 8px; background: ${colors.surfaceSecondary}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surfaceSecondary}'"><strong style="color: ${colors.primary};">Max Running HR:</strong> ${userProfile.defaultMaxRunningHeartRate} bpm</div>` : ""}
                ${userProfile.defaultMaxBikingHeartRate ? `<div style="padding: 8px; border-radius: 8px; background: ${colors.surfaceSecondary}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surfaceSecondary}'"><strong style="color: ${colors.primary};">Max Biking HR:</strong> ${userProfile.defaultMaxBikingHeartRate} bpm</div>` : ""}
                ${userProfile.hrSetting ? `<div style="padding: 8px; border-radius: 8px; background: ${colors.surfaceSecondary}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surfaceSecondary}'"><strong style="color: ${colors.primary};">HR Setting:</strong> ${formatCapitalize(userProfile.hrSetting)}</div>` : ""}
                ${userProfile.speedSetting ? `<div style="padding: 8px; border-radius: 8px; background: ${colors.surfaceSecondary}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surfaceSecondary}'"><strong style="color: ${colors.primary};">Speed Setting:</strong> ${formatCapitalize(userProfile.speedSetting)}</div>` : ""}
                ${userProfile.distSetting ? `<div style="padding: 8px; border-radius: 8px; background: ${colors.surfaceSecondary}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surfaceSecondary}'"><strong style="color: ${colors.primary};">Distance Setting:</strong> ${formatCapitalize(userProfile.distSetting)}</div>` : ""}
                ${userProfile.powerSetting ? `<div style="padding: 8px; border-radius: 8px; background: ${colors.surfaceSecondary}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surfaceSecondary}'"><strong style="color: ${colors.primary};">Power Setting:</strong> ${formatCapitalize(userProfile.powerSetting)}</div>` : ""}
                ${userProfile.activityClass ? `<div style="padding: 8px; border-radius: 8px; background: ${colors.surfaceSecondary}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surfaceSecondary}'"><strong style="color: ${colors.primary};">Activity Class:</strong> ${formatCapitalize(userProfile.activityClass)}</div>` : ""}
                ${userProfile.positionSetting ? `<div style="padding: 8px; border-radius: 8px; background: ${colors.surfaceSecondary}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surfaceSecondary}'"><strong style="color: ${colors.primary};">Position Setting:</strong> ${formatCapitalize(userProfile.positionSetting)}</div>` : ""}
                ${userProfile.temperatureSetting ? `<div style="padding: 8px; border-radius: 8px; background: ${colors.surfaceSecondary}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surfaceSecondary}'"><strong style="color: ${colors.primary};">Temperature Setting:</strong> ${formatCapitalize(userProfile.temperatureSetting)}</div>` : ""}
                ${userProfile.localId ? `<div style="padding: 8px; border-radius: 8px; background: ${colors.surfaceSecondary}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surfaceSecondary}'"><strong style="color: ${colors.primary};">Local ID:</strong> ${userProfile.localId}</div>` : ""}
                ${userProfile.globalId ? `<div style="padding: 8px; border-radius: 8px; background: ${colors.surfaceSecondary}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surfaceSecondary}'"><strong style="color: ${colors.primary};">Global ID:</strong> ${userProfile.globalId}</div>` : ""}
                ${userProfile.wakeTime ? `<div style="padding: 8px; border-radius: 8px; background: ${colors.surfaceSecondary}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surfaceSecondary}'"><strong style="color: ${colors.primary};">Wake Time:</strong> ${userProfile.wakeTime}</div>` : ""}
                ${userProfile.sleepTime ? `<div style="padding: 8px; border-radius: 8px; background: ${colors.surfaceSecondary}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surfaceSecondary}'"><strong style="color: ${colors.primary};">Sleep Time:</strong> ${userProfile.sleepTime}</div>` : ""}
                ${userProfile.heightSetting ? `<div style="padding: 8px; border-radius: 8px; background: ${colors.surfaceSecondary}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surfaceSecondary}'"><strong style="color: ${colors.primary};">Height Setting:</strong> ${formatCapitalize(userProfile.heightSetting)}</div>` : ""}
                ${userProfile.userRunningStepLength ? `<div style="padding: 8px; border-radius: 8px; background: ${colors.surfaceSecondary}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surfaceSecondary}'"><strong style="color: ${colors.primary};">Running Step Length:</strong> ${(userProfile.userRunningStepLength / 1000).toFixed(2)} m</div>` : ""}
                ${userProfile.userWalkingStepLength ? `<div style="padding: 8px; border-radius: 8px; background: ${colors.surfaceSecondary}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surfaceSecondary}'"><strong style="color: ${colors.primary};">Walking Step Length:</strong> ${(userProfile.userWalkingStepLength / 1000).toFixed(2)} m</div>` : ""}
                ${userProfile.depthSetting ? `<div style="padding: 8px; border-radius: 8px; background: ${colors.surfaceSecondary}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surfaceSecondary}'"><strong style="color: ${colors.primary};">Depth Setting:</strong> ${formatCapitalize(userProfile.depthSetting)}</div>` : ""}
                ${userProfile.diveCount ? `<div style="padding: 8px; border-radius: 8px; background: ${colors.surfaceSecondary}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surfaceSecondary}'"><strong style="color: ${colors.primary};">Dive Count:</strong> ${userProfile.diveCount}</div>` : ""}
            </div>
        `;

        // Security: sanitize HTML because FIT-derived strings can contain markup.
        // Also strips inline onmouseenter/onmouseleave attributes used in the template string.
        userSection.replaceChildren(sanitizeInfoBoxHtml(rawUserSectionHtml));
        const deviceSection = userDeviceInfoBoxRuntime().createElement("div");
        deviceSection.className = "device-info-section";
        deviceSection.style.cssText = `
            flex: 1;
            min-width: 320px;
            background: ${colors.surface};
            border: 1px solid ${colors.border};
            border-radius: 12px;
            padding: 20px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        `;

        // Add hover effects to device section
        deviceSection.addEventListener(
            "mouseenter",
            () => {
                deviceSection.style.transform = "translateY(-2px)";
                deviceSection.style.boxShadow = `0 6px 20px ${colors.shadow}`;
                deviceSection.style.borderColor = colors.primary;
            },
            { signal }
        );

        deviceSection.addEventListener(
            "mouseleave",
            () => {
                deviceSection.style.transform = "translateY(0)";
                deviceSection.style.boxShadow = "none";
                deviceSection.style.borderColor = colors.border;
            },
            { signal }
        );

        // Process device info to get primary device and sensors
        const primaryDevice =
                deviceInfos.find(
                    (d) =>
                        d.sourceType === "local" && d.deviceIndex === "creator"
                ) || deviceInfos[0],
            sensors = deviceInfos.filter(
                (d) =>
                    d.sourceType === "antplus" ||
                    (d.sourceType === "local" && d.deviceIndex !== "creator")
            );
        let deviceHtml = `
            <h3 class="device-info-heading" style="margin: 0 0 20px 0; color: ${colors.text}; font-size: 18px; font-weight: 700; border-bottom: 3px solid ${colors.primary}; padding-bottom: 12px; display: flex; align-items: center; gap: 10px; background: linear-gradient(135deg, ${colors.primary}, ${colors.accent}); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                <span style="font-size: 20px; filter: drop-shadow(0 2px 4px ${colors.shadowLight});"></span> Device Information
            </h3>
        `;

        if (primaryDevice) {
            deviceHtml += `
                <div class="primary-device-card" style="margin-bottom: 20px; padding: 16px; background: linear-gradient(135deg, ${colors.surfaceSecondary}, ${colors.surface}); border-radius: 12px; border: 2px solid ${colors.border}; transition: all 0.3s ease; position: relative; overflow: hidden;" onmouseenter="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 25px ${colors.shadow}'; this.style.borderColor='${colors.primary}'" onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='none'; this.style.borderColor='${colors.border}'">
                    <div class="primary-device-heading" style="font-weight: 700; margin-bottom: 12px; color: ${colors.text}; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                        <span style="background: ${colors.primary}; color: ${colors.textPrimary}; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px;">⭐</span>
                        Primary Device
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px; color: ${colors.text};">
                        ${primaryDevice.manufacturer ? `<div style="padding: 10px; border-radius: 8px; background: ${colors.surface}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surface}'"><strong style="color: ${colors.primary};">Brand:</strong> ${formatManufacturer(primaryDevice.manufacturer)}</div>` : ""}
                        ${primaryDevice.garminProduct ? `<div style="padding: 10px; border-radius: 8px; background: ${colors.surface}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surface}'"><strong style="color: ${colors.primary};">Model:</strong> ${formatSensorName(primaryDevice).replace(/^Garmin\s+/, "")}</div>` : ""}
                        ${primaryDevice.softwareVersion ? `<div style="padding: 10px; border-radius: 8px; background: ${colors.surface}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surface}'"><strong style="color: ${colors.primary};">Software:</strong> v${primaryDevice.softwareVersion}</div>` : ""}
                        ${primaryDevice.serialNumber ? `<div style="padding: 10px; border-radius: 8px; background: ${colors.surface}; border-left: 4px solid ${colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${colors.surface}'"><strong style="color: ${colors.primary};">Serial:</strong> ${String(primaryDevice.serialNumber).slice(-6)}</div>` : ""}
                    </div>
                </div>
            `;
        }
        if (sensors.length > 0) {
            deviceHtml += `
                <div>
                    <div class="connected-sensors-heading" style="font-weight: 700; margin-bottom: 16px; color: ${colors.text}; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                        <span style="background: ${colors.accent}; color: ${colors.textPrimary}; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px;">🔗</span>
                        Connected Sensors
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 12px;">
            `;

            for (const sensor of sensors) {
                if (sensor.manufacturer || sensor.garminProduct) {
                    deviceHtml += `
                        <div class="connected-sensor-pill" style="
                            background: linear-gradient(135deg, ${colors.primary}, ${colors.accent});
                            color: ${colors.textPrimary};
                            padding: 10px 16px;
                            border-radius: 25px;
                            font-size: 13px;
                            font-weight: 600;
                            white-space: nowrap;
                            border: 2px solid transparent;
                            box-shadow: 0 4px 15px ${colors.primaryShadow};
                            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                            position: relative;
                            overflow: hidden;
                            transform: translateY(0);
                        "
                        onmouseenter="
                            this.style.transform='translateY(-3px) scale(1.05)';
                            this.style.boxShadow='0 8px 25px ${colors.primaryShadowHeavy}';
                            this.style.background='linear-gradient(135deg, ${colors.accent}, ${colors.primary})';
                        "
                        onmouseleave="
                            this.style.transform='translateY(0) scale(1)';
                            this.style.boxShadow='0 4px 15px ${colors.primaryShadow}';
                            this.style.background='linear-gradient(135deg, ${colors.primary}, ${colors.accent})';
                        ">
                            <span class="connected-sensor-name" style="position: relative; z-index: 2;">
                                ${formatSensorName(sensor)}
                            </span>
                            <div style="
                                position: absolute;
                                top: 0;
                                left: -100%;
                                width: 100%;
                                height: 100%;
                                background: linear-gradient(90deg, transparent, ${colors.borderLight}, transparent);
                                transition: left 0.6s ease;
                                pointer-events: none;
                            "></div>
                        </div>
                    `;
                }
            }

            deviceHtml += `
                    </div>
                </div>
            `;
        }
        if (!primaryDevice && sensors.length === 0) {
            deviceHtml += `
                <div class="device-info-empty-state" style="
                    color: ${colors.textSecondary};
                    font-style: italic;
                    padding: 24px;
                    text-align: center;
                    background: ${colors.surfaceSecondary};
                    border-radius: 12px;
                    border: 2px dashed ${colors.border};
                    transition: all 0.3s ease;
                " onmouseenter="this.style.borderColor='${colors.primary}'; this.style.color='${colors.text}'" onmouseleave="this.style.borderColor='${colors.border}'; this.style.color='${colors.textSecondary}'">
                    <span style="font-size: 24px; display: block; margin-bottom: 8px;">🔍</span>
                    No device information available
                </div>
            `;
        }

        // Security: sanitize HTML before inserting.
        deviceSection.replaceChildren(sanitizeInfoBoxHtml(deviceHtml));

        // Add sections to info box
        infoBox.append(userSection);
        infoBox.append(deviceSection);

        // Add info box to container
        container.append(infoBox);

        console.log(
            "[ChartJS] User and device info box created with theme:",
            themeConfig.theme
        );
    } catch (error) {
        console.error("[ChartJS] Error creating user/device info box:", error);
    }
}
