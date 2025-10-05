import { formatCapitalize } from "../../formatting/display/formatCapitalize.js";
import { formatHeight } from "../../formatting/formatters/formatHeight.js";
import { formatManufacturer } from "../../formatting/formatters/formatManufacturer.js";
import { formatSensorName } from "../../formatting/formatters/formatSensorName.js";
import { formatWeight } from "../../formatting/formatters/formatWeight.js";
import { getThemeConfig } from "../../theming/core/theme.js";

/**
 * @typedef {Object} UserProfileData
 * @property {string} [friendlyName] - Friendly name or device name
 * @property {string} [gender] - User gender
 * @property {number} [age] - User age in years
 * @property {number} [height] - User height in centimeters
 * @property {number} [weight] - User weight in kilograms
 * @property {string} [language] - User language setting
 * @property {string} [elevSetting] - Elevation setting preference
 * @property {string} [weightSetting] - Weight unit setting
 * @property {number} [restingHeartRate] - Resting heart rate in BPM
 * @property {number} [defaultMaxHeartRate] - Maximum heart rate in BPM
 * @property {number} [defaultMaxRunningHeartRate] - Max running heart rate in BPM
 * @property {number} [defaultMaxBikingHeartRate] - Max biking heart rate in BPM
 * @property {string} [hrSetting] - Heart rate setting preference
 * @property {string} [speedSetting] - Speed unit setting
 * @property {string} [distSetting] - Distance unit setting
 * @property {string} [powerSetting] - Power unit setting
 * @property {string} [activityClass] - Activity class setting
 * @property {string} [positionSetting] - Position setting preference
 * @property {string} [temperatureSetting] - Temperature unit setting
 * @property {number} [localId] - Local identifier
 * @property {string} [globalId] - Global identifier
 * @property {string} [wakeTime] - Wake time setting
 * @property {string} [sleepTime] - Sleep time setting
 * @property {string} [heightSetting] - Height unit setting
 * @property {number} [userRunningStepLength] - Running step length in millimeters
 * @property {number} [userWalkingStepLength] - Walking step length in millimeters
 * @property {string} [depthSetting] - Depth unit setting
 * @property {number} [diveCount] - Number of dives recorded
 */

/**
 * @typedef {Object} DeviceInfo
 * @property {string|number} [deviceIndex] - Device index
 * @property {string} [deviceType] - Type of device
 * @property {string} [manufacturer] - Device manufacturer
 * @property {string} [product] - Product name
 * @property {string} [serialNumber] - Device serial number
 * @property {string} [productName] - Human readable product name
 * @property {number} [softwareVersion] - Software version number
 * @property {number} [hardwareVersion] - Hardware version number
 * @property {string} [antNetwork] - ANT network type
 * @property {string} [sourceType] - Source type identifier
 * @property {string} [descriptor] - Device descriptor
 * @property {string} [batteryStatus] - Battery status
 * @property {number} [batteryVoltage] - Battery voltage
 * @property {string} [garminProduct] - Garmin product identifier
 */

/**
 * @typedef {Object} FitGlobalData
 * @property {UserProfileData[]} [userProfileMesgs] - Array of user profile messages
 * @property {DeviceInfo[]} [deviceInfoMesgs] - Array of device info messages
 * @property {Object[]} [recordMesgs] - Array of record messages
 * @property {string} [cachedFilePath] - Cached file path
 */

/**
 * @typedef {Object} ThemeColors
 * @property {string} primary - Primary theme color
 * @property {string} accent - Accent theme color
 * @property {string} background - Background color
 * @property {string} surface - Surface color
 * @property {string} surfaceSecondary - Secondary surface color
 * @property {string} text - Primary text color
 * @property {string} textPrimary - Primary text color
 * @property {string} textSecondary - Secondary text color
 * @property {string} border - Border color
 * @property {string} shadow - Shadow color
 * @property {string} shadowLight - Light shadow color
 * @property {string} shadowMedium - Medium shadow color
 * @property {string} shadowHeavy - Heavy shadow color
 * @property {string} primaryShadowLight - Light primary shadow
 * @property {string} primaryShadowHeavy - Heavy primary shadow
 * @property {string} [primaryShadow] - Primary shadow color
 * @property {string} [borderLight] - Light border color
 */

/**
 * @typedef {Object} ThemeConfig
 * @property {ThemeColors} colors - Theme color configuration
 * @property {string} [name] - Theme name
 */

/**
 * Creates an info box displaying user profile and device information
 * @param {HTMLElement} container - Container to append the info box to
 */
export function createUserDeviceInfoBox(container) {
    try {
        /** @type {UserProfileData} */
        const /** @type {DeviceInfo[]} */
            deviceInfos = /** @type {any} */ (globalThis).globalData?.deviceInfoMesgs || [],
            infoBox = document.createElement("div"),
            // Get theme configuration using the established theme system
            /** @type {ThemeConfig} */
            themeConfig = /** @type {ThemeConfig} */ (getThemeConfig()),
            userProfile = /** @type {any} */ (globalThis).globalData?.userProfileMesgs?.[0] || {},
            /** @type {ThemeColors} */
            { colors } = themeConfig; // Create info box container with theme-aware styling and hover effects
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
        infoBox.addEventListener("mouseenter", () => {
            infoBox.style.transform = "translateY(-4px) scale(1.01)";
            infoBox.style.boxShadow = `0 8px 40px ${colors.shadowHeavy},
                                       0 4px 16px ${colors.primaryShadowHeavy}`;
            infoBox.style.borderColor = colors.primary;
        });

        infoBox.addEventListener("mouseleave", () => {
            infoBox.style.transform = "translateY(0) scale(1)";
            infoBox.style.boxShadow = `0 4px 20px ${colors.shadowMedium},
                                       0 2px 8px ${colors.primaryShadowLight}`;
            infoBox.style.borderColor = colors.border;
        });

        // Add animated border glow effect
        const glowOverlay = document.createElement("div");
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

        infoBox.addEventListener("mouseenter", () => {
            glowOverlay.style.opacity = "0.3";
        });

        infoBox.addEventListener("mouseleave", () => {
            glowOverlay.style.opacity = "0";
        }); // User Profile Section with enhanced styling
        const userSection = document.createElement("div");
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
        userSection.addEventListener("mouseenter", () => {
            userSection.style.transform = "translateY(-2px)";
            userSection.style.boxShadow = `0 6px 20px ${colors.shadow}`;
            userSection.style.borderColor = colors.primary;
        });

        userSection.addEventListener("mouseleave", () => {
            userSection.style.transform = "translateY(0)";
            userSection.style.boxShadow = "none";
            userSection.style.borderColor = colors.border;
        });

        // User Profile Section with enhanced styling and more fields
        userSection.innerHTML = `
            <div style="margin-bottom: 20px; padding: 16px; background: linear-gradient(135deg, ${colors.surfaceSecondary}, ${colors.surface}); border-radius: 12px; border: 2px solid ${colors.border}; transition: all 0.3s ease; position: relative; overflow: hidden;" onmouseenter="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 25px ${colors.shadow}'; this.style.borderColor='${colors.primary}'" onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='none'; this.style.borderColor='${colors.border}'">
            <div style="font-weight: 700; margin-bottom: 12px; color: ${colors.text}; font-size: 16px; display: flex; align-items: center; gap: 8px;">
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
        const deviceSection = document.createElement("div");
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
        deviceSection.addEventListener("mouseenter", () => {
            deviceSection.style.transform = "translateY(-2px)";
            deviceSection.style.boxShadow = `0 6px 20px ${colors.shadow}`;
            deviceSection.style.borderColor = colors.primary;
        });

        deviceSection.addEventListener("mouseleave", () => {
            deviceSection.style.transform = "translateY(0)";
            deviceSection.style.boxShadow = "none";
            deviceSection.style.borderColor = colors.border;
        });

        // Process device info to get primary device and sensors
        const primaryDevice =
            deviceInfos.find((d) => d.sourceType === "local" && d.deviceIndex === "creator") || deviceInfos[0],
            sensors = deviceInfos.filter(
                (d) => d.sourceType === "antplus" || (d.sourceType === "local" && d.deviceIndex !== "creator")
            );
        let deviceHtml = `
            <h3 style="margin: 0 0 20px 0; color: ${colors.text}; font-size: 18px; font-weight: 700; border-bottom: 3px solid ${colors.primary}; padding-bottom: 12px; display: flex; align-items: center; gap: 10px; background: linear-gradient(135deg, ${colors.primary}, ${colors.accent}); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                <span style="font-size: 20px; filter: drop-shadow(0 2px 4px ${colors.shadowLight});"></span> Device Information
            </h3>
        `;

        if (primaryDevice) {
            deviceHtml += `
                <div style="margin-bottom: 20px; padding: 16px; background: linear-gradient(135deg, ${colors.surfaceSecondary}, ${colors.surface}); border-radius: 12px; border: 2px solid ${colors.border}; transition: all 0.3s ease; position: relative; overflow: hidden;" onmouseenter="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 25px ${colors.shadow}'; this.style.borderColor='${colors.primary}'" onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='none'; this.style.borderColor='${colors.border}'">
                    <div style="font-weight: 700; margin-bottom: 12px; color: ${colors.text}; font-size: 16px; display: flex; align-items: center; gap: 8px;">
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
                    <div style="font-weight: 700; margin-bottom: 16px; color: ${colors.text}; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                        <span style="background: ${colors.accent}; color: ${colors.textPrimary}; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px;">🔗</span>
                        Connected Sensors
                    </div>
                    <div class="sensor-pill-container" data-role="sensor-chip-container"></div>
                </div>
            `;
        }
        if (!primaryDevice && sensors.length === 0) {
            deviceHtml += `
                <div style="
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

        deviceSection.innerHTML = deviceHtml;

        const sensorContainer = deviceSection.querySelector('[data-role="sensor-chip-container"]');
        /** @type {{ element: HTMLElement; sensor: DeviceInfo }[]} */
        const sensorChipRegistry = [];
        if (sensorContainer instanceof HTMLElement) {
            sensorContainer.textContent = "";
            sensorContainer.style.display = "flex";
            sensorContainer.style.flexWrap = "wrap";
            sensorContainer.style.gap = "12px";
            for (const sensor of sensors) {
                if (!sensor || (!sensor.manufacturer && !sensor.garminProduct)) {
                    continue;
                }
                const chip = createSensorChip(sensor, colors);
                sensorContainer.append(chip);
                sensorChipRegistry.push({ element: chip, sensor });
            }
        }

        const repaintSensorChips = () => {
            if (sensorChipRegistry.length === 0) {
                return;
            }
            const nextTheme = /** @type {ThemeConfig} */ (getThemeConfig());
            const palette = /** @type {ThemeColors} */ (nextTheme?.colors || colors);
            for (const entry of sensorChipRegistry) {
                applySensorChipTheme(entry.element, palette);
                const label = entry.element.querySelector(".sensor-pill__label");
                if (label) {
                    label.textContent = formatSensorName(entry.sensor);
                }
            }
        };

        if (sensorChipRegistry.length > 0) {
            repaintSensorChips();
            const handleThemeChange = () => repaintSensorChips();
            document.body.addEventListener("themechange", handleThemeChange);
            if (typeof MutationObserver === "function") {
                const observer = new MutationObserver(() => {
                    if (!document.body.contains(infoBox)) {
                        document.body.removeEventListener("themechange", handleThemeChange);
                        observer.disconnect();
                    }
                });
                observer.observe(document.body, { childList: true, subtree: true });
            }
        }

        // Add sections to info box
        infoBox.append(userSection);
        infoBox.append(deviceSection);

        // Add info box to container
        container.append(infoBox);

        console.log("[ChartJS] User and device info box created with theme:", themeConfig.name || "default");
    } catch (error) {
        console.error("[ChartJS] Error creating user/device info box:", error);
    }
}

/**
 * @param {HTMLElement} chip
 * @param {ThemeColors} colors
 */
function applySensorChipTheme(chip, colors) {
    const primary = colors?.primary || "#3b82f6";
    const accent = colors?.accent || primary;
    const shadow = colors?.primaryShadow || "rgba(59, 130, 246, 0.35)";
    const heavyShadow = colors?.primaryShadowHeavy || "rgba(59, 130, 246, 0.55)";
    const textColor = colors?.textPrimary || "#f8fafc";
    const borderLight = colors?.borderLight || "rgba(255, 255, 255, 0.45)";

    chip.dataset.primaryColor = primary;
    chip.dataset.accentColor = accent;
    chip.dataset.shadowColor = shadow;
    chip.dataset.shadowHeavyColor = heavyShadow;
    chip.dataset.borderLightColor = borderLight;
    chip.dataset.textPrimary = textColor;
    chip.style.color = textColor;

    const shine = chip.querySelector(".sensor-pill__shine");
    if (shine instanceof HTMLElement) {
        shine.style.position = "absolute";
        shine.style.top = "0";
        shine.style.left = "-100%";
        shine.style.width = "100%";
        shine.style.height = "100%";
        shine.style.background = `linear-gradient(90deg, transparent, ${borderLight}, transparent)`;
        shine.style.transition = "left 0.6s ease";
        shine.style.pointerEvents = "none";
    }

    setSensorChipHoverState(chip, chip.matches(":hover"));
}

/**
 * @param {DeviceInfo} sensor
 * @param {ThemeColors} colors
 * @returns {HTMLElement}
 */
function createSensorChip(sensor, colors) {
    const chip = document.createElement("div");
    chip.className = "sensor-pill";
    chip.style.position = "relative";
    chip.style.overflow = "hidden";
    chip.style.padding = "10px 16px";
    chip.style.borderRadius = "25px";
    chip.style.fontSize = "13px";
    chip.style.fontWeight = "600";
    chip.style.whiteSpace = "nowrap";
    chip.style.border = "2px solid transparent";
    chip.style.display = "inline-flex";
    chip.style.alignItems = "center";
    chip.style.justifyContent = "center";
    chip.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    chip.style.transform = "translateY(0)";

    const label = document.createElement("span");
    label.className = "sensor-pill__label";
    label.style.position = "relative";
    label.style.zIndex = "2";
    label.textContent = formatSensorName(sensor);
    chip.append(label);

    const shine = document.createElement("div");
    shine.className = "sensor-pill__shine";
    chip.append(shine);

    applySensorChipTheme(chip, colors);

    chip.addEventListener("mouseenter", () => setSensorChipHoverState(chip, true));
    chip.addEventListener("mouseleave", () => setSensorChipHoverState(chip, false));

    return chip;
}

/**
 * @param {HTMLElement} chip
 * @param {boolean} hovered
 */
function setSensorChipHoverState(chip, hovered) {
    const primary = chip.dataset.primaryColor || "#3b82f6";
    const accent = chip.dataset.accentColor || primary;
    const shadow = chip.dataset.shadowColor || "rgba(59, 130, 246, 0.35)";
    const heavyShadow = chip.dataset.shadowHeavyColor || "rgba(59, 130, 246, 0.55)";

    if (hovered) {
        chip.style.transform = "translateY(-3px) scale(1.05)";
        chip.style.boxShadow = `0 8px 25px ${heavyShadow}`;
        chip.style.background = `linear-gradient(135deg, ${accent}, ${primary})`;
    } else {
        chip.style.transform = "translateY(0) scale(1)";
        chip.style.boxShadow = `0 4px 15px ${shadow}`;
        chip.style.background = `linear-gradient(135deg, ${primary}, ${accent})`;
    }

    const shine = chip.querySelector(".sensor-pill__shine");
    if (shine instanceof HTMLElement) {
        shine.style.left = hovered ? "100%" : "-100%";
    }
}
