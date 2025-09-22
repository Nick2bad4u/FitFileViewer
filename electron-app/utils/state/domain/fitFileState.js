/**
 * FIT File State Management
 * Specialized state management for FIT file operations and data
 */

import { showNotification } from "../../app/initialization/rendererUtils.js";
import { AppActions } from "../../app/lifecycle/appActions.js";
import { getState, setState, subscribe, updateState } from "../core/stateManager.js";

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
    constructor() {
        this.initialize();
    }

    /**
     * Assess data quality
     * @param {RawFitData} data
     * @returns {DataQuality}
     */
    assessDataQuality(data) {
        /** @type {DataQuality} */
        const quality = {
            completeness: 0,
            hasAltitude: false,
            hasCadence: false,
            hasGPS: false,
            hasHeartRate: false,
            hasPower: false,
            issues: [],
        };
        if (!data || !data.recordMesgs || !Array.isArray(data.recordMesgs)) {
            quality.issues.push("No record data found");
            return quality;
        }

        const records = data.recordMesgs,
            totalRecords = records.length;

        if (totalRecords === 0) {
            quality.issues.push("No records in file");
            return quality;
        }
        let altitudeCount = 0,
            cadenceCount = 0,
            gpsCount = 0,
            hrCount = 0,
            powerCount = 0;

        for (const record of records) {
            if (record.position_lat && record.position_long) {
                gpsCount++;
                quality.hasGPS = true;
            }
            if (record.heart_rate) {
                hrCount++;
                quality.hasHeartRate = true;
            }
            if (record.power) {
                powerCount++;
                quality.hasPower = true;
            }
            if (record.cadence) {
                cadenceCount++;
                quality.hasCadence = true;
            }
            if (record.altitude) {
                altitudeCount++;
                quality.hasAltitude = true;
            }
        }

        // Calculate completeness as percentage of records with basic data
        const basicDataCount = Math.max(gpsCount, hrCount, 1);
        quality.completeness = Math.round((basicDataCount / totalRecords) * 100);

        // Calculate coverage percentages for detailed metrics
        quality.coverage = {
            altitude: Math.round((altitudeCount / totalRecords) * 100),
            cadence: Math.round((cadenceCount / totalRecords) * 100),
            gps: Math.round((gpsCount / totalRecords) * 100),
            heartRate: Math.round((hrCount / totalRecords) * 100),
            power: Math.round((powerCount / totalRecords) * 100),
        };

        // Add quality warnings
        if (quality.completeness < 50) {
            quality.issues.push("Low data completeness");
        }
        if (!quality.hasGPS) {
            quality.issues.push("No GPS data");
        }
        if (totalRecords < 10) {
            quality.issues.push("Very short activity");
        }

        return quality;
    }

    /**
     * Clear all file-related state
     */
    clearFileState() {
        setState("fitFile.isLoading", false, { source: "FitFileStateManager.clearFileState" });
        setState("fitFile.currentFile", null, { source: "FitFileStateManager.clearFileState" });
        setState("fitFile.rawData", null, { source: "FitFileStateManager.clearFileState" });
        setState("fitFile.processedData", null, { source: "FitFileStateManager.clearFileState" });
        setState("fitFile.validation", null, { source: "FitFileStateManager.clearFileState" });
        setState("fitFile.metrics", null, { source: "FitFileStateManager.clearFileState" });
        setState("fitFile.loadingError", null, { source: "FitFileStateManager.clearFileState" });
        setState("fitFile.processingError", null, { source: "FitFileStateManager.clearFileState" });

        console.log("[FitFileState] File state cleared");
    }

    /**
     * Extract activity information
     * @param {RawFitData} data
     * @returns {ActivityInfo|null}
     */
    extractActivityInfo(data) {
        if (!data || !data.activities || !Array.isArray(data.activities) || data.activities.length === 0) {
            return null;
        }

        const [activity] = data.activities;
        if (!activity) {
            return null;
        }
        return {
            localTimestamp: activity.local_timestamp,
            numSessions: activity.num_sessions,
            timestamp: activity.timestamp,
            totalTimerTime: activity.total_timer_time,
        };
    }

    /**
     * Extract device information
     * @param {RawFitData} data
     * @returns {DeviceInfo|null}
     */
    extractDeviceInfo(data) {
        if (!data || !data.device_infos || !Array.isArray(data.device_infos) || data.device_infos.length === 0) {
            return null;
        }

        const [device] = data.device_infos;
        if (!device) {
            return null;
        }
        return {
            hardwareVersion: device.hardware_version,
            manufacturer: device.manufacturer,
            product: device.product,
            serialNumber: device.serial_number,
            softwareVersion: device.software_version,
        };
    }

    extractSessionInfo(data) {
        if (!data || !data.sessionMesgs || !Array.isArray(data.sessionMesgs) || data.sessionMesgs.length === 0) {
            return null;
        }

        const [session] = data.sessionMesgs;
        if (!session) {
            return null;
        }
        return {
            sport: session.sport,
            startTime: session.start_time,
            subSport: session.sub_sport,
            totalCalories: session.total_calories,
            totalDistance: session.total_distance,
            totalElapsedTime: session.total_elapsed_time,
        };
    }

    /**
    /**
     * Get record count from file data
     * @param {RawFitData} data - File data
     * @returns {number}
     */
    getRecordCount(/** @type {RawFitData} */ data) {
        if (!data || !data.recordMesgs) {
            return 0;
        }
        return Array.isArray(data.recordMesgs) ? data.recordMesgs.length : 0;
    }

    /**
     * Handle successful file loading
     * @param {Object} fileData - Loaded file data
     */
    handleFileLoaded(/** @type {RawFitData} */ fileData) {
        setState("fitFile.isLoading", false, { source: "FitFileStateManager.handleFileLoaded" });
        setState("fitFile.loadingProgress", 100, { source: "FitFileStateManager.handleFileLoaded" });
        setState("fitFile.rawData", fileData, { source: "FitFileStateManager.handleFileLoaded" });

        // Set global data for backward compatibility
        AppActions.loadFile(fileData, getState("fitFile.currentFile"));

        showNotification("FIT file loaded successfully", "success", 3000);
        console.log("[FitFileState] File loaded successfully");
    }

    /**
     * Handle file loading errors
     * @param {Error} error - Loading error
     */
    handleFileLoadingError(/** @type {unknown} */ error) {
        const err = /** @type {{message?: string}} */ (error) || {},
            message = err.message || "Unknown error";
        setState("fitFile.isLoading", false, { source: "FitFileStateManager.handleFileLoadingError" });
        setState("fitFile.loadingError", message, { source: "FitFileStateManager.handleFileLoadingError" });

        showNotification(`Failed to load FIT file: ${message}`, "error", 5000);
        console.error("[FitFileState] File loading failed:", error);
    }

    /**
     * Initialize FIT file state management
     */
    initialize() {
        // Set up file loading state listeners
        this.setupFileLoadingListeners();

        // Set up data processing listeners
        this.setupDataProcessingListeners();

        // Set up validation listeners
        this.setupValidationListeners();

        console.log("[FitFileState] Initialized");
    } /**
     * Process file data and extract useful information
     * @param {Object} data - Raw file data
     */
    processFileData(/** @type {RawFitData} */ data) {
        try {
            /** @type {ProcessedData} */
            const processedData = {
                activityInfo: this.extractActivityInfo(data),
                dataQuality: this.assessDataQuality(data),
                deviceInfo: this.extractDeviceInfo(data),
                recordCount: this.getRecordCount(data),
                sessionInfo: this.extractSessionInfo(data),
            };

            setState("fitFile.processedData", processedData, { source: "FitFileStateManager.processFileData" });
            console.log("[FitFileState] Data processed successfully");
        } catch (error) {
            const err = /** @type {{message?: string}} */ (error);
            console.error("[FitFileState] Error processing data:", error);
            setState("fitFile.processingError", err?.message || "Unknown error", {
                source: "FitFileStateManager.processFileData",
            });
        }
    }

    /**
     * Extract session information
     * @param {RawFitData} data
     * @returns {SessionInfo|null}
     */ /**
     * Set up listeners for data processing events
     */
    setupDataProcessingListeners() {
        // Process data when global data changes
        subscribe("globalData", (/** @type {RawFitData|null} */ data) => {
            if (data) {
                this.processFileData(data);
            }
        });

        // Update metrics when data changes
        subscribe("fitFile.processedData", (/** @type {ProcessedData|null} */ processedData) => {
            this.updateFileMetrics(processedData);
        });
    }

    /**
     * Set up listeners for file loading events
     */
    setupFileLoadingListeners() {
        // Track file loading progress
        subscribe("fitFile.loadingProgress", (/** @type {number} */ progress) => {
            this.updateLoadingProgress(progress);
        });

        // Handle file loading completion
        subscribe("fitFile.loaded", (/** @type {RawFitData} */ fileData) => {
            this.handleFileLoaded(fileData);
        });

        // Handle file loading errors
        subscribe("fitFile.loadingError", (/** @type {Error} */ error) => {
            this.handleFileLoadingError(error); // Error originates from fit parser integration
        });
    }

    /**
     * Set up data validation listeners
     */
    setupValidationListeners() {
        // Validate data when it's loaded
        subscribe("globalData", (/** @type {RawFitData|null} */ data) => {
            if (data) {
                this.validateFileData(data);
            }
        });
    }

    /**
     * Start file loading process
     * @param {string} filePath - Path to the FIT file
     */
    startFileLoading(/** @type {string} */ filePath) {
        setState("fitFile.isLoading", true, { source: "FitFileStateManager.startFileLoading" });
        setState("fitFile.currentFile", filePath, { source: "FitFileStateManager.startFileLoading" });
        setState("fitFile.loadingProgress", 0, { source: "FitFileStateManager.startFileLoading" });
        setState("fitFile.loadingError", null, { source: "FitFileStateManager.startFileLoading" });

        console.log(`[FitFileState] Started loading: ${filePath}`);
    }

    /**
     * Update file metrics display
     * @param {Object} processedData - Processed file data
     */
    updateFileMetrics(/** @type {ProcessedData|null} */ processedData) {
        if (!processedData) {
            return;
        }
        updateState(
            "fitFile.metrics",
            {
                dataQualityScore: processedData.dataQuality?.completeness || 0,
                hasDevice: Boolean(processedData.deviceInfo),
                hasSession: Boolean(processedData.sessionInfo),
                lastUpdated: Date.now(),
                recordCount: processedData.recordCount,
            },
            { source: "FitFileStateManager.updateFileMetrics" }
        );
    }

    /**
     * Update file loading progress
     * @param {number} progress - Progress percentage (0-100)
     */
    updateLoadingProgress(/** @type {number} */ progress) {
        const progressElement = document.querySelector("#file-loading-progress");
        if (progressElement) {
            progressElement.style.width = `${progress}%`;
            progressElement.setAttribute("aria-valuenow", progress.toString());
        }

        console.log(`[FitFileState] Loading progress: ${progress}%`);
    }

    /**
     * Validate file data
     * @param {RawFitData} data
     */
    validateFileData(data) {
        /** @type {ValidationResult} */
        const validation = {
            errors: [],
            isValid: true,
            warnings: [],
        }; // Basic structure validation
        if (data) {
            // Check for required fields (using correct FIT file structure)
            if (!data.recordMesgs) {
                validation.errors.push("No records found in file");
                validation.isValid = false;
            }

            if (!data.sessionMesgs) {
                validation.warnings.push("No session data found");
            }

            if (!data.fileIdMesgs) {
                validation.warnings.push("No file ID information");
            }

            // Check data consistency
            if (data.recordMesgs && Array.isArray(data.recordMesgs) && data.recordMesgs.length === 0) {
                validation.errors.push("File contains no activity records");
                validation.isValid = false;
            }
        } else {
            validation.isValid = false;
            validation.errors.push("No data provided");
        }

        setState("fitFile.validation", validation, { source: "FitFileStateManager.validateFileData" });

        // Show validation results
        if (!validation.isValid) {
            showNotification(`File validation failed: ${validation.errors.join(", ")}`, "error");
        } else if (validation.warnings.length > 0) {
            showNotification(`File loaded with warnings: ${validation.warnings.join(", ")}`, "warning");
        }

        console.log("[FitFileState] File validation completed:", validation);
    }
}

/**
 * FIT File State Selectors
 */
export const FitFileSelectors = {
    /**
     * Get current file path
     * @returns {string|null} Current file path
     */
    getCurrentFile() {
        return getState("fitFile.currentFile");
    },

    /**
     * Get data quality assessment
     * @returns {Object|null} Data quality object
     */
    getDataQuality() {
        /** @type {ProcessedData|null} */
        const processedData = /** @type {any} */ (this.getProcessedData());
        return processedData ? processedData.dataQuality : null;
    },

    /**
     * Get loading error if any
     * @returns {string|null} Error message
     */
    getLoadingError() {
        return getState("fitFile.loadingError");
    },

    /**
     * Get loading progress
     * @returns {number} Loading progress (0-100)
     */
    getLoadingProgress() {
        return getState("fitFile.loadingProgress") || 0;
    },

    /**
     * Get file metrics
     * @returns {Object|null} File metrics
     */
    getMetrics() {
        return getState("fitFile.metrics");
    },

    /**
     * Get processed file data
     * @returns {Object|null} Processed data
     */
    getProcessedData() {
        return getState("fitFile.processedData");
    },

    /**
     * Get processing error if any
     * @returns {string|null} Error message
     */
    getProcessingError() {
        return getState("fitFile.processingError");
    },

    /**
     * Get file validation status
     * @returns {Object|null} Validation object
     */
    getValidation() {
        return getState("fitFile.validation");
    },

    /**
     * Check if file has GPS data
     * @returns {boolean} True if has GPS
     */
    hasGPS() {
        /** @type {DataQuality|null} */
        const quality = /** @type {any} */ (this.getDataQuality());
        return quality ? Boolean(quality.hasGPS) : false;
    },

    /**
     * Check if file has heart rate data
     * @returns {boolean} True if has heart rate
     */
    hasHeartRate() {
        /** @type {DataQuality|null} */
        const quality = /** @type {any} */ (this.getDataQuality());
        return quality ? Boolean(quality.hasHeartRate) : false;
    },

    /**
     * Check if file has power data
     * @returns {boolean} True if has power
     */
    hasPower() {
        /** @type {DataQuality|null} */
        const quality = /** @type {any} */ (this.getDataQuality());
        return quality ? Boolean(quality.hasPower) : false;
    },

    /**
     * Check if file data is valid
     * @returns {boolean} True if valid
     */
    isFileValid() {
        /** @type {ValidationResult|null} */
        const validation = /** @type {any} */ (this.getValidation());
        return validation ? Boolean(validation.isValid) : false;
    },

    /**
     * Check if a file is currently loading
     * @returns {boolean} True if loading
     */
    isLoading() {
        return getState("fitFile.isLoading") || false;
    },
};

// Create global instance
export const fitFileStateManager = new FitFileStateManager();
