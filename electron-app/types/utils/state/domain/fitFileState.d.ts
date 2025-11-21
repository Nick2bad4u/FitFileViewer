/**
 * Record message from FIT file (highly simplified subset)
 * @typedef {Object} RecordMessage
 * @property {number} [position_lat]
 * @property {number} [position_long]
 * @property {number} [heart_rate]
 * @property {number} [power]
 * @property {number} [cadence]
 * @property {number} [altitude]
 */
/**
 * Session message subset
 * @typedef {Object} SessionMessage
 * @property {number} [start_time]
 * @property {number} [total_elapsed_time]
 * @property {number} [total_distance]
 * @property {number} [total_calories]
 * @property {string} [sport]
 * @property {string} [sub_sport]
 */
/**
 * Device info message subset
 * @typedef {Object} DeviceInfoMessage
 * @property {string|number} [manufacturer]
 * @property {string|number} [product]
 * @property {string|number} [serial_number]
 * @property {number} [software_version]
 * @property {number} [hardware_version]
 */
/**
 * Activity message subset
 * @typedef {Object} ActivityMessage
 * @property {number} [timestamp]
 * @property {number} [total_timer_time]
 * @property {number} [local_timestamp]
 * @property {number} [num_sessions]
 */
/**
 * Raw FIT data structure (minimal, optional arrays)
 * @typedef {Object} RawFitData
 * @property {RecordMessage[]} [recordMesgs]
 * @property {SessionMessage[]} [sessionMesgs]
 * @property {DeviceInfoMessage[]} [device_infos]
 * @property {ActivityMessage[]} [activities]
 * @property {Object[]} [fileIdMesgs]
 */
/**
 * Extracted session info
 * @typedef {Object} SessionInfo
 * @property {number|undefined} startTime
 * @property {number|undefined} totalElapsedTime
 * @property {number|undefined} totalDistance
 * @property {number|undefined} totalCalories
 * @property {string|undefined} sport
 * @property {string|undefined} subSport
 */
/**
 * Extracted device info
 * @typedef {Object} DeviceInfo
 * @property {string|number|undefined} manufacturer
 * @property {string|number|undefined} product
 * @property {string|number|undefined} serialNumber
 * @property {number|undefined} softwareVersion
 * @property {number|undefined} hardwareVersion
 */
/**
 * Extracted activity info
 * @typedef {Object} ActivityInfo
 * @property {number|undefined} timestamp
 * @property {number|undefined} totalTimerTime
 * @property {number|undefined} localTimestamp
 * @property {number|undefined} numSessions
 */
/**
 * Data quality coverage breakdown
 * @typedef {Object} DataCoverage
 * @property {number} gps
 * @property {number} heartRate
 * @property {number} power
 * @property {number} cadence
 * @property {number} altitude
 */
/**
 * Data quality assessment
 * @typedef {Object} DataQuality
 * @property {boolean} hasGPS
 * @property {boolean} hasHeartRate
 * @property {boolean} hasPower
 * @property {boolean} hasCadence
 * @property {boolean} hasAltitude
 * @property {number} completeness
 * @property {string[]} issues
 * @property {DataCoverage} [coverage]
 */
/**
 * Processed FIT file data
 * @typedef {Object} ProcessedData
 * @property {number} recordCount
 * @property {SessionInfo|null} sessionInfo
 * @property {DeviceInfo|null} deviceInfo
 * @property {ActivityInfo|null} activityInfo
 * @property {DataQuality} dataQuality
 */
/**
 * Validation result structure
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid
 * @property {string[]} errors
 * @property {string[]} warnings
 */
/**
 * File metrics structure
 * @typedef {Object} FileMetrics
 * @property {number} lastUpdated
 * @property {number} recordCount
 * @property {boolean} hasSession
 * @property {boolean} hasDevice
 * @property {number} dataQualityScore
 */
/**
 * FIT File State Manager - handles FIT file specific state operations
 */
export class FitFileStateManager {
    /**
     * Assess data quality
     * @param {RawFitData} data
     * @returns {DataQuality}
     */
    assessDataQuality(data: RawFitData): DataQuality;
    /**
     * Clear all file-related state
     */
    clearFileState(): void;
    /**
     * Extract activity information
     * @param {RawFitData} data
     * @returns {ActivityInfo|null}
     */
    extractActivityInfo(data: RawFitData): ActivityInfo | null;
    /**
     * Extract device information
     * @param {RawFitData} data
     * @returns {DeviceInfo|null}
     */
    extractDeviceInfo(data: RawFitData): DeviceInfo | null;
    extractSessionInfo(data: any): {
        sport: any;
        startTime: any;
        subSport: any;
        totalCalories: any;
        totalDistance: any;
        totalElapsedTime: any;
    } | null;
    /**
    /**
     * Get record count from file data
     * @param {RawFitData} data - File data
     * @returns {number}
     */
    getRecordCount(data: RawFitData): number;
    /**
     * Handle successful file loading
     * @param {Object} fileData - Loaded file data
     */
    handleFileLoaded(fileData: RawFitData, options?: {}): void;
    /**
     * Handle file loading errors
     * @param {Error} error - Loading error
     */
    handleFileLoadingError(error: unknown): void;
    /**
     * Initialize FIT file state management
     */
    initialize(): void; /**
     * Process file data and extract useful information
     * @param {Object} data - Raw file data
     */
    processFileData(data: RawFitData): void;
    /**
     * Extract session information
     * @param {RawFitData} data
     * @returns {SessionInfo|null}
     */ /**
     * Set up listeners for data processing events
     */
    setupDataProcessingListeners(): void;
    /**
     * Set up listeners for file loading events
     */
    setupFileLoadingListeners(): void;
    /**
     * Set up data validation listeners
     */
    setupValidationListeners(): void;
    /**
     * Start file loading process
     * @param {string} filePath - Path to the FIT file
     */
    startFileLoading(filePath: string): void;
    /**
     * Update file metrics display
     * @param {Object} processedData - Processed file data
     */
    updateFileMetrics(processedData: ProcessedData | null): void;
    /**
     * Update file loading progress
     * @param {number} progress - Progress percentage (0-100)
     */
    updateLoadingProgress(progress: number): void;
    /**
     * Validate file data
     * @param {RawFitData} data
     */
    validateFileData(data: RawFitData): void;
}
export namespace FitFileSelectors {
    /**
     * Get current file path
     * @returns {string|null} Current file path
     */
    function getCurrentFile(): string | null;
    /**
     * Get data quality assessment
     * @returns {Object|null} Data quality object
     */
    function getDataQuality(): Object | null;
    /**
     * Get loading error if any
     * @returns {string|null} Error message
     */
    function getLoadingError(): string | null;
    /**
     * Get loading progress
     * @returns {number} Loading progress (0-100)
     */
    function getLoadingProgress(): number;
    /**
     * Get file metrics
     * @returns {Object|null} File metrics
     */
    function getMetrics(): Object | null;
    /**
     * Get processed file data
     * @returns {Object|null} Processed data
     */
    function getProcessedData(): Object | null;
    /**
     * Get processing error if any
     * @returns {string|null} Error message
     */
    function getProcessingError(): string | null;
    /**
     * Get file validation status
     * @returns {Object|null} Validation object
     */
    function getValidation(): Object | null;
    /**
     * Check if file has GPS data
     * @returns {boolean} True if has GPS
     */
    function hasGPS(): boolean;
    /**
     * Check if file has heart rate data
     * @returns {boolean} True if has heart rate
     */
    function hasHeartRate(): boolean;
    /**
     * Check if file has power data
     * @returns {boolean} True if has power
     */
    function hasPower(): boolean;
    /**
     * Check if file data is valid
     * @returns {boolean} True if valid
     */
    function isFileValid(): boolean;
    /**
     * Check if a file is currently loading
     * @returns {boolean} True if loading
     */
    function isLoading(): boolean;
}
export const fitFileStateManager: FitFileStateManager;
/**
 * Record message from FIT file (highly simplified subset)
 */
export type RecordMessage = {
    position_lat?: number;
    position_long?: number;
    heart_rate?: number;
    power?: number;
    cadence?: number;
    altitude?: number;
};
/**
 * Session message subset
 */
export type SessionMessage = {
    start_time?: number;
    total_elapsed_time?: number;
    total_distance?: number;
    total_calories?: number;
    sport?: string;
    sub_sport?: string;
};
/**
 * Device info message subset
 */
export type DeviceInfoMessage = {
    manufacturer?: string | number;
    product?: string | number;
    serial_number?: string | number;
    software_version?: number;
    hardware_version?: number;
};
/**
 * Activity message subset
 */
export type ActivityMessage = {
    timestamp?: number;
    total_timer_time?: number;
    local_timestamp?: number;
    num_sessions?: number;
};
/**
 * Raw FIT data structure (minimal, optional arrays)
 */
export type RawFitData = {
    recordMesgs?: RecordMessage[];
    sessionMesgs?: SessionMessage[];
    device_infos?: DeviceInfoMessage[];
    activities?: ActivityMessage[];
    fileIdMesgs?: Object[];
};
/**
 * Extracted session info
 */
export type SessionInfo = {
    startTime: number | undefined;
    totalElapsedTime: number | undefined;
    totalDistance: number | undefined;
    totalCalories: number | undefined;
    sport: string | undefined;
    subSport: string | undefined;
};
/**
 * Extracted device info
 */
export type DeviceInfo = {
    manufacturer: string | number | undefined;
    product: string | number | undefined;
    serialNumber: string | number | undefined;
    softwareVersion: number | undefined;
    hardwareVersion: number | undefined;
};
/**
 * Extracted activity info
 */
export type ActivityInfo = {
    timestamp: number | undefined;
    totalTimerTime: number | undefined;
    localTimestamp: number | undefined;
    numSessions: number | undefined;
};
/**
 * Data quality coverage breakdown
 */
export type DataCoverage = {
    gps: number;
    heartRate: number;
    power: number;
    cadence: number;
    altitude: number;
};
/**
 * Data quality assessment
 */
export type DataQuality = {
    hasGPS: boolean;
    hasHeartRate: boolean;
    hasPower: boolean;
    hasCadence: boolean;
    hasAltitude: boolean;
    completeness: number;
    issues: string[];
    coverage?: DataCoverage;
};
/**
 * Processed FIT file data
 */
export type ProcessedData = {
    recordCount: number;
    sessionInfo: SessionInfo | null;
    deviceInfo: DeviceInfo | null;
    activityInfo: ActivityInfo | null;
    dataQuality: DataQuality;
};
/**
 * Validation result structure
 */
export type ValidationResult = {
    isValid: boolean;
    errors: string[];
    warnings: string[];
};
/**
 * File metrics structure
 */
export type FileMetrics = {
    lastUpdated: number;
    recordCount: number;
    hasSession: boolean;
    hasDevice: boolean;
    dataQualityScore: number;
};
//# sourceMappingURL=fitFileState.d.ts.map
