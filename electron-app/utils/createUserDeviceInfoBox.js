import { getThemeConfig } from "./theme.js";
import { formatHeight } from "./formatHeight.js";
import { formatWeight } from "./formatWeight.js";
import { formatSensorName } from "./formatSensorName.js";
import { formatManufacturer } from "./formatManufacturer.js";
import { capitalize } from "./capitalize.js";

/**
 * Creates an info box displaying user profile and device information
 * @param {HTMLElement} container - Container to append the info box to
 */
export function createUserDeviceInfoBox(container) {
    try {
        const userProfile = window.globalData?.userProfileMesgs?.[0] || {};
        const deviceInfos = window.globalData?.deviceInfoMesgs || [];

        // Get theme configuration using the established theme system
        const themeConfig = getThemeConfig(); // Create info box container with theme-aware styling and hover effects
        const infoBox = document.createElement("div");
        infoBox.className = "user-device-info-box chart-info-section";
        infoBox.style.cssText = `
            border: 2px solid ${themeConfig.colors.border};
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 24px;
            display: flex;
            flex-wrap: wrap;
            gap: 28px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 4px 20px ${themeConfig.colors.shadowMedium}, 
                        0 2px 8px ${themeConfig.colors.primaryShadowLight};
            color: ${themeConfig.colors.text};
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        `;

        // Add hover effects using event listeners
        infoBox.addEventListener("mouseenter", () => {
            infoBox.style.transform = "translateY(-4px) scale(1.01)";
            infoBox.style.boxShadow = `0 8px 40px ${themeConfig.colors.shadowHeavy}, 
                                       0 4px 16px ${themeConfig.colors.primaryShadowHeavy}`;
            infoBox.style.borderColor = themeConfig.colors.primary;
        });

        infoBox.addEventListener("mouseleave", () => {
            infoBox.style.transform = "translateY(0) scale(1)";
            infoBox.style.boxShadow = `0 4px 20px ${themeConfig.colors.shadowMedium}, 
                                       0 2px 8px ${themeConfig.colors.primaryShadowLight}`;
            infoBox.style.borderColor = themeConfig.colors.border;
        });

        // Add animated border glow effect
        const glowOverlay = document.createElement("div");
        glowOverlay.style.cssText = `
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, ${themeConfig.colors.primary}, ${themeConfig.colors.accent}, ${themeConfig.colors.primary});
            border-radius: 18px;
            opacity: 0;
            z-index: -1;
            transition: opacity 0.4s ease;
        `;
        infoBox.appendChild(glowOverlay);

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
            background: ${themeConfig.colors.surface};
            border: 1px solid ${themeConfig.colors.border};
            border-radius: 12px;
            padding: 20px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        `;

        // Add hover effects to user section
        userSection.addEventListener("mouseenter", () => {
            userSection.style.transform = "translateY(-2px)";
            userSection.style.boxShadow = `0 6px 20px ${themeConfig.colors.shadow}`;
            userSection.style.borderColor = themeConfig.colors.primary;
        });

        userSection.addEventListener("mouseleave", () => {
            userSection.style.transform = "translateY(0)";
            userSection.style.boxShadow = "none";
            userSection.style.borderColor = themeConfig.colors.border;
        });

        userSection.innerHTML = `
                <div style="margin-bottom: 20px; padding: 16px; background: linear-gradient(135deg, ${themeConfig.colors.surfaceSecondary}, ${themeConfig.colors.surface}); border-radius: 12px; border: 2px solid ${themeConfig.colors.border}; transition: all 0.3s ease; position: relative; overflow: hidden;" onmouseenter="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 25px ${themeConfig.colors.shadow}'; this.style.borderColor='${themeConfig.colors.primary}'" onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='none'; this.style.borderColor='${themeConfig.colors.border}'">
                    <div style="font-weight: 700; margin-bottom: 12px; color: ${themeConfig.colors.text}; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                        <span style="background: ${themeConfig.colors.primary}; color: ${themeConfig.colors.textPrimary}; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px;">👤 </span>
                        User Profile
                    </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 14px; color: ${themeConfig.colors.text};">
                ${userProfile.friendlyName ? `<div style="padding: 8px; border-radius: 8px; background: ${themeConfig.colors.surfaceSecondary}; border-left: 4px solid ${themeConfig.colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${themeConfig.colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${themeConfig.colors.surfaceSecondary}'"><strong style="color: ${themeConfig.colors.primary};">Name:</strong> ${userProfile.friendlyName}</div>` : ""}
                ${userProfile.age ? `<div style="padding: 8px; border-radius: 8px; background: ${themeConfig.colors.surfaceSecondary}; border-left: 4px solid ${themeConfig.colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${themeConfig.colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${themeConfig.colors.surfaceSecondary}'"><strong style="color: ${themeConfig.colors.primary};">Age:</strong> ${userProfile.age} years</div>` : ""}
                ${userProfile.gender ? `<div style="padding: 8px; border-radius: 8px; background: ${themeConfig.colors.surfaceSecondary}; border-left: 4px solid ${themeConfig.colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${themeConfig.colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${themeConfig.colors.surfaceSecondary}'"><strong style="color: ${themeConfig.colors.primary};">Gender:</strong> ${capitalize(userProfile.gender)}</div>` : ""}
                ${userProfile.weight ? `<div style="padding: 8px; border-radius: 8px; background: ${themeConfig.colors.surfaceSecondary}; border-left: 4px solid ${themeConfig.colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${themeConfig.colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${themeConfig.colors.surfaceSecondary}'"><strong style="color: ${themeConfig.colors.primary};">Weight:</strong> ${formatWeight(userProfile.weight)}</div>` : ""}
                ${userProfile.height ? `<div style="padding: 8px; border-radius: 8px; background: ${themeConfig.colors.surfaceSecondary}; border-left: 4px solid ${themeConfig.colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${themeConfig.colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${themeConfig.colors.surfaceSecondary}'"><strong style="color: ${themeConfig.colors.primary};">Height:</strong> ${formatHeight(userProfile.height)}</div>` : ""}
                ${userProfile.restingHeartRate ? `<div style="padding: 8px; border-radius: 8px; background: ${themeConfig.colors.surfaceSecondary}; border-left: 4px solid ${themeConfig.colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${themeConfig.colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${themeConfig.colors.surfaceSecondary}'"><strong style="color: ${themeConfig.colors.primary};">Resting HR:</strong> ${userProfile.restingHeartRate} bpm</div>` : ""}
                ${userProfile.defaultMaxHeartRate ? `<div style="padding: 8px; border-radius: 8px; background: ${themeConfig.colors.surfaceSecondary}; border-left: 4px solid ${themeConfig.colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${themeConfig.colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${themeConfig.colors.surfaceSecondary}'"><strong style="color: ${themeConfig.colors.primary};">Max HR:</strong> ${userProfile.defaultMaxHeartRate} bpm</div>` : ""}
                ${userProfile.activityClass ? `<div style="padding: 8px; border-radius: 8px; background: ${themeConfig.colors.surfaceSecondary}; border-left: 4px solid ${themeConfig.colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${themeConfig.colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${themeConfig.colors.surfaceSecondary}'"><strong style="color: ${themeConfig.colors.primary};">Activity Class:</strong> ${userProfile.activityClass}</div>` : ""}
            </div>
        `; // Device Info Section with enhanced styling
        const deviceSection = document.createElement("div");
        deviceSection.style.cssText = `
            flex: 1;
            min-width: 320px;
            background: ${themeConfig.colors.surface};
            border: 1px solid ${themeConfig.colors.border};
            border-radius: 12px;
            padding: 20px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        `;

        // Add hover effects to device section
        deviceSection.addEventListener("mouseenter", () => {
            deviceSection.style.transform = "translateY(-2px)";
            deviceSection.style.boxShadow = `0 6px 20px ${themeConfig.colors.shadow}`;
            deviceSection.style.borderColor = themeConfig.colors.primary;
        });

        deviceSection.addEventListener("mouseleave", () => {
            deviceSection.style.transform = "translateY(0)";
            deviceSection.style.boxShadow = "none";
            deviceSection.style.borderColor = themeConfig.colors.border;
        });

        // Process device info to get primary device and sensors
        const primaryDevice =
            deviceInfos.find((d) => d.sourceType === "local" && d.deviceIndex === "creator") || deviceInfos[0];
        const sensors = deviceInfos.filter(
            (d) => d.sourceType === "antplus" || (d.sourceType === "local" && d.deviceIndex !== "creator")
        );
        let deviceHtml = `
            <h3 style="margin: 0 0 20px 0; color: ${themeConfig.colors.text}; font-size: 18px; font-weight: 700; border-bottom: 3px solid ${themeConfig.colors.primary}; padding-bottom: 12px; display: flex; align-items: center; gap: 10px; background: linear-gradient(135deg, ${themeConfig.colors.primary}, ${themeConfig.colors.accent}); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                <span style="font-size: 20px; filter: drop-shadow(0 2px 4px ${themeConfig.colors.shadowLight});"></span> Device Information
            </h3>
        `;

        if (primaryDevice) {
            deviceHtml += `
                <div style="margin-bottom: 20px; padding: 16px; background: linear-gradient(135deg, ${themeConfig.colors.surfaceSecondary}, ${themeConfig.colors.surface}); border-radius: 12px; border: 2px solid ${themeConfig.colors.border}; transition: all 0.3s ease; position: relative; overflow: hidden;" onmouseenter="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 25px ${themeConfig.colors.shadow}'; this.style.borderColor='${themeConfig.colors.primary}'" onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='none'; this.style.borderColor='${themeConfig.colors.border}'">
                    <div style="font-weight: 700; margin-bottom: 12px; color: ${themeConfig.colors.text}; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                        <span style="background: ${themeConfig.colors.primary}; color: ${themeConfig.colors.textPrimary}; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px;">⭐</span>
                        Primary Device
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 14px; color: ${themeConfig.colors.text};">
                        ${primaryDevice.manufacturer ? `<div style="padding: 10px; border-radius: 8px; background: ${themeConfig.colors.surface}; border-left: 4px solid ${themeConfig.colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${themeConfig.colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${themeConfig.colors.surface}'"><strong style="color: ${themeConfig.colors.primary};">Brand:</strong> ${formatManufacturer(primaryDevice.manufacturer)}</div>` : ""}
                        ${primaryDevice.garminProduct ? `<div style="padding: 10px; border-radius: 8px; background: ${themeConfig.colors.surface}; border-left: 4px solid ${themeConfig.colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${themeConfig.colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${themeConfig.colors.surface}'"><strong style="color: ${themeConfig.colors.primary};">Model:</strong> ${formatSensorName(primaryDevice).replace(/^Garmin\s+/, "")}</div>` : ""}
                        ${primaryDevice.softwareVersion ? `<div style="padding: 10px; border-radius: 8px; background: ${themeConfig.colors.surface}; border-left: 4px solid ${themeConfig.colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${themeConfig.colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${themeConfig.colors.surface}'"><strong style="color: ${themeConfig.colors.primary};">Software:</strong> v${primaryDevice.softwareVersion}</div>` : ""}
                        ${primaryDevice.serialNumber ? `<div style="padding: 10px; border-radius: 8px; background: ${themeConfig.colors.surface}; border-left: 4px solid ${themeConfig.colors.primary}; transition: all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.backgroundColor='${themeConfig.colors.accent}'" onmouseleave="this.style.transform='translateX(0)'; this.style.backgroundColor='${themeConfig.colors.surface}'"><strong style="color: ${themeConfig.colors.primary};">Serial:</strong> ${String(primaryDevice.serialNumber).slice(-6)}</div>` : ""}
                    </div>
                </div>
            `;
        }
        if (sensors.length > 0) {
            deviceHtml += `
                <div>
                    <div style="font-weight: 700; margin-bottom: 16px; color: ${themeConfig.colors.text}; font-size: 16px; display: flex; align-items: center; gap: 8px;">
                        <span style="background: ${themeConfig.colors.accent}; color: ${themeConfig.colors.textPrimary}; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px;">🔗</span>
                        Connected Sensors
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 12px;">
            `;

            sensors.forEach((sensor) => {
                if (sensor.manufacturer || sensor.garminProduct) {
                    deviceHtml += `
                        <div style="
                            background: linear-gradient(135deg, ${themeConfig.colors.primary}, ${themeConfig.colors.accent}); 
                            color: ${themeConfig.colors.textPrimary}; 
                            padding: 10px 16px; 
                            border-radius: 25px; 
                            font-size: 13px; 
                            font-weight: 600;
                            white-space: nowrap; 
                            border: 2px solid transparent;
                            box-shadow: 0 4px 15px ${themeConfig.colors.primaryShadow};
                            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                            position: relative;
                            overflow: hidden;
                            transform: translateY(0);
                        " 
                        onmouseenter="
                            this.style.transform='translateY(-3px) scale(1.05)'; 
                            this.style.boxShadow='0 8px 25px ${themeConfig.colors.primaryShadowHeavy}';
                            this.style.background='linear-gradient(135deg, ${themeConfig.colors.accent}, ${themeConfig.colors.primary})';
                        " 
                        onmouseleave="
                            this.style.transform='translateY(0) scale(1)'; 
                            this.style.boxShadow='0 4px 15px ${themeConfig.colors.primaryShadow}';
                            this.style.background='linear-gradient(135deg, ${themeConfig.colors.primary}, ${themeConfig.colors.accent})';
                        ">
                            <span style="position: relative; z-index: 2;">
                                ${formatSensorName(sensor)}
                            </span>
                            <div style="
                                position: absolute;
                                top: 0;
                                left: -100%;
                                width: 100%;
                                height: 100%;
                                background: linear-gradient(90deg, transparent, ${themeConfig.colors.borderLight}, transparent);
                                transition: left 0.6s ease;
                                pointer-events: none;
                            "></div>
                        </div>
                    `;
                }
            });

            deviceHtml += `
                    </div>
                </div>
            `;
        }
        if (!primaryDevice && sensors.length === 0) {
            deviceHtml += `
                <div style="
                    color: ${themeConfig.colors.textSecondary}; 
                    font-style: italic; 
                    padding: 24px; 
                    text-align: center;
                    background: ${themeConfig.colors.surfaceSecondary};
                    border-radius: 12px;
                    border: 2px dashed ${themeConfig.colors.border};
                    transition: all 0.3s ease;
                " onmouseenter="this.style.borderColor='${themeConfig.colors.primary}'; this.style.color='${themeConfig.colors.text}'" onmouseleave="this.style.borderColor='${themeConfig.colors.border}'; this.style.color='${themeConfig.colors.textSecondary}'">
                    <span style="font-size: 24px; display: block; margin-bottom: 8px;">🔍</span>
                    No device information available
                </div>
            `;
        }

        deviceSection.innerHTML = deviceHtml;

        // Add sections to info box
        infoBox.appendChild(userSection);
        infoBox.appendChild(deviceSection);

        // Add info box to container
        container.appendChild(infoBox);

        console.log("[ChartJS] User and device info box created with theme:", themeConfig.theme);
    } catch (error) {
        console.error("[ChartJS] Error creating user/device info box:", error);
    }
}
