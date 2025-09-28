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
export function createUserDeviceInfoBox(container: HTMLElement): void;
export type UserProfileData = {
    /**
     * - Friendly name or device name
     */
    friendlyName?: string;
    /**
     * - User gender
     */
    gender?: string;
    /**
     * - User age in years
     */
    age?: number;
    /**
     * - User height in centimeters
     */
    height?: number;
    /**
     * - User weight in kilograms
     */
    weight?: number;
    /**
     * - User language setting
     */
    language?: string;
    /**
     * - Elevation setting preference
     */
    elevSetting?: string;
    /**
     * - Weight unit setting
     */
    weightSetting?: string;
    /**
     * - Resting heart rate in BPM
     */
    restingHeartRate?: number;
    /**
     * - Maximum heart rate in BPM
     */
    defaultMaxHeartRate?: number;
    /**
     * - Max running heart rate in BPM
     */
    defaultMaxRunningHeartRate?: number;
    /**
     * - Max biking heart rate in BPM
     */
    defaultMaxBikingHeartRate?: number;
    /**
     * - Heart rate setting preference
     */
    hrSetting?: string;
    /**
     * - Speed unit setting
     */
    speedSetting?: string;
    /**
     * - Distance unit setting
     */
    distSetting?: string;
    /**
     * - Power unit setting
     */
    powerSetting?: string;
    /**
     * - Activity class setting
     */
    activityClass?: string;
    /**
     * - Position setting preference
     */
    positionSetting?: string;
    /**
     * - Temperature unit setting
     */
    temperatureSetting?: string;
    /**
     * - Local identifier
     */
    localId?: number;
    /**
     * - Global identifier
     */
    globalId?: string;
    /**
     * - Wake time setting
     */
    wakeTime?: string;
    /**
     * - Sleep time setting
     */
    sleepTime?: string;
    /**
     * - Height unit setting
     */
    heightSetting?: string;
    /**
     * - Running step length in millimeters
     */
    userRunningStepLength?: number;
    /**
     * - Walking step length in millimeters
     */
    userWalkingStepLength?: number;
    /**
     * - Depth unit setting
     */
    depthSetting?: string;
    /**
     * - Number of dives recorded
     */
    diveCount?: number;
};
export type DeviceInfo = {
    /**
     * - Device index
     */
    deviceIndex?: string | number;
    /**
     * - Type of device
     */
    deviceType?: string;
    /**
     * - Device manufacturer
     */
    manufacturer?: string;
    /**
     * - Product name
     */
    product?: string;
    /**
     * - Device serial number
     */
    serialNumber?: string;
    /**
     * - Human readable product name
     */
    productName?: string;
    /**
     * - Software version number
     */
    softwareVersion?: number;
    /**
     * - Hardware version number
     */
    hardwareVersion?: number;
    /**
     * - ANT network type
     */
    antNetwork?: string;
    /**
     * - Source type identifier
     */
    sourceType?: string;
    /**
     * - Device descriptor
     */
    descriptor?: string;
    /**
     * - Battery status
     */
    batteryStatus?: string;
    /**
     * - Battery voltage
     */
    batteryVoltage?: number;
    /**
     * - Garmin product identifier
     */
    garminProduct?: string;
};
export type FitGlobalData = {
    /**
     * - Array of user profile messages
     */
    userProfileMesgs?: UserProfileData[];
    /**
     * - Array of device info messages
     */
    deviceInfoMesgs?: DeviceInfo[];
    /**
     * - Array of record messages
     */
    recordMesgs?: Object[];
    /**
     * - Cached file path
     */
    cachedFilePath?: string;
};
export type ThemeColors = {
    /**
     * - Primary theme color
     */
    primary: string;
    /**
     * - Accent theme color
     */
    accent: string;
    /**
     * - Background color
     */
    background: string;
    /**
     * - Surface color
     */
    surface: string;
    /**
     * - Secondary surface color
     */
    surfaceSecondary: string;
    /**
     * - Primary text color
     */
    text: string;
    /**
     * - Primary text color
     */
    textPrimary: string;
    /**
     * - Secondary text color
     */
    textSecondary: string;
    /**
     * - Border color
     */
    border: string;
    /**
     * - Shadow color
     */
    shadow: string;
    /**
     * - Light shadow color
     */
    shadowLight: string;
    /**
     * - Medium shadow color
     */
    shadowMedium: string;
    /**
     * - Heavy shadow color
     */
    shadowHeavy: string;
    /**
     * - Light primary shadow
     */
    primaryShadowLight: string;
    /**
     * - Heavy primary shadow
     */
    primaryShadowHeavy: string;
    /**
     * - Primary shadow color
     */
    primaryShadow?: string;
    /**
     * - Light border color
     */
    borderLight?: string;
};
export type ThemeConfig = {
    /**
     * - Theme color configuration
     */
    colors: ThemeColors;
    /**
     * - Theme name
     */
    name?: string;
};
//# sourceMappingURL=createUserDeviceInfoBox.d.ts.map