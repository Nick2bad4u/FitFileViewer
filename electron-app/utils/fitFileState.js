/**
 * FIT File State Management
 * Specialized state management for FIT file operations and data
 */

import { setState, getState, subscribe, updateState } from "./stateManager.js";
import { AppActions } from "./appActions.js";
import { showNotification } from "./rendererUtils.js";

/**
 * FIT File State Manager - handles FIT file specific state operations
 */
export class FitFileStateManager {
    constructor() {
        this.initialize();
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
    }

    /**
     * Set up listeners for file loading events
     */
    setupFileLoadingListeners() {
        // Track file loading progress
        subscribe("fitFile.loadingProgress", (progress) => {
            this.updateLoadingProgress(progress);
        });

        // Handle file loading completion
        subscribe("fitFile.loaded", (fileData) => {
            this.handleFileLoaded(fileData);
        });

        // Handle file loading errors
        subscribe("fitFile.loadingError", (error) => {
            this.handleFileLoadingError(error);
        });
    }

    /**
     * Set up listeners for data processing events
     */
    setupDataProcessingListeners() {
        // Process data when global data changes
        subscribe("globalData", (data) => {
            if (data) {
                this.processFileData(data);
            }
        });

        // Update metrics when data changes
        subscribe("fitFile.processedData", (processedData) => {
            this.updateFileMetrics(processedData);
        });
    }

    /**
     * Set up data validation listeners
     */
    setupValidationListeners() {
        // Validate data when it's loaded
        subscribe("globalData", (data) => {
            if (data) {
                this.validateFileData(data);
            }
        });
    }

    /**
     * Start file loading process
     * @param {string} filePath - Path to the FIT file
     */
    startFileLoading(filePath) {
        setState("fitFile.isLoading", true, { source: "FitFileStateManager.startFileLoading" });
        setState("fitFile.currentFile", filePath, { source: "FitFileStateManager.startFileLoading" });
        setState("fitFile.loadingProgress", 0, { source: "FitFileStateManager.startFileLoading" });
        setState("fitFile.loadingError", null, { source: "FitFileStateManager.startFileLoading" });

        console.log(`[FitFileState] Started loading: ${filePath}`);
    }

    /**
     * Update file loading progress
     * @param {number} progress - Progress percentage (0-100)
     */
    updateLoadingProgress(progress) {
        const progressElement = document.getElementById("file-loading-progress");
        if (progressElement) {
            progressElement.style.width = `${progress}%`;
            progressElement.setAttribute("aria-valuenow", progress.toString());
        }

        console.log(`[FitFileState] Loading progress: ${progress}%`);
    }

    /**
     * Handle successful file loading
     * @param {Object} fileData - Loaded file data
     */
    handleFileLoaded(fileData) {
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
    handleFileLoadingError(error) {
        setState("fitFile.isLoading", false, { source: "FitFileStateManager.handleFileLoadingError" });
        setState("fitFile.loadingError", error.message, { source: "FitFileStateManager.handleFileLoadingError" });

        showNotification(`Failed to load FIT file: ${error.message}`, "error", 5000);
        console.error("[FitFileState] File loading failed:", error);
    }

    /**
     * Process file data and extract useful information
     * @param {Object} data - Raw file data
     */
    processFileData(data) {
        try {
            const processedData = {
                recordCount: this.getRecordCount(data),
                sessionInfo: this.extractSessionInfo(data),
                deviceInfo: this.extractDeviceInfo(data),
                activityInfo: this.extractActivityInfo(data),
                dataQuality: this.assessDataQuality(data),
            };

            setState("fitFile.processedData", processedData, { source: "FitFileStateManager.processFileData" });
            console.log("[FitFileState] Data processed successfully");
        } catch (error) {
            console.error("[FitFileState] Error processing data:", error);
            setState("fitFile.processingError", error.message, { source: "FitFileStateManager.processFileData" });
        }
    }

    /**
     * Get record count from file data
     * @param {Object} data - File data
     * @returns {number} Number of records
     */
    getRecordCount(data) {
        if (!data || !data.records) return 0;
        return Array.isArray(data.records) ? data.records.length : 0;
    }

    /**
     * Extract session information
     * @param {Object} data - File data
     * @returns {Object} Session information
     */
    extractSessionInfo(data) {
        if (!data || !data.sessions || !Array.isArray(data.sessions) || data.sessions.length === 0) {
            return null;
        }

        const session = data.sessions[0];
        return {
            startTime: session.start_time,
            totalElapsedTime: session.total_elapsed_time,
            totalDistance: session.total_distance,
            totalCalories: session.total_calories,
            sport: session.sport,
            subSport: session.sub_sport,
        };
    }

    /**
     * Extract device information
     * @param {Object} data - File data
     * @returns {Object} Device information
     */
    extractDeviceInfo(data) {
        if (!data || !data.device_infos || !Array.isArray(data.device_infos) || data.device_infos.length === 0) {
            return null;
        }

        const device = data.device_infos[0];
        return {
            manufacturer: device.manufacturer,
            product: device.product,
            serialNumber: device.serial_number,
            softwareVersion: device.software_version,
            hardwareVersion: device.hardware_version,
        };
    }

    /**
     * Extract activity information
     * @param {Object} data - File data
     * @returns {Object} Activity information
     */
    extractActivityInfo(data) {
        if (!data || !data.activities || !Array.isArray(data.activities) || data.activities.length === 0) {
            return null;
        }

        const activity = data.activities[0];
        return {
            timestamp: activity.timestamp,
            totalTimerTime: activity.total_timer_time,
            localTimestamp: activity.local_timestamp,
            numSessions: activity.num_sessions,
        };
    }

    /**
     * Assess data quality
     * @param {Object} data - File data
     * @returns {Object} Data quality assessment
     */
    assessDataQuality(data) {
        const quality = {
            hasGPS: false,
            hasHeartRate: false,
            hasPower: false,
            hasCadence: false,
            hasAltitude: false,
            completeness: 0,
            issues: [],
        };

        if (!data || !data.records || !Array.isArray(data.records)) {
            quality.issues.push("No record data found");
            return quality;
        }

        const records = data.records;
        const totalRecords = records.length;

        if (totalRecords === 0) {
            quality.issues.push("No records in file");
            return quality;
        }
        let gpsCount = 0;
        let hrCount = 0;
        let powerCount = 0;
        let cadenceCount = 0;
        let altitudeCount = 0;

        records.forEach((record) => {
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
        });

        // Calculate completeness as percentage of records with basic data
        const basicDataCount = Math.max(gpsCount, hrCount, 1);
        quality.completeness = Math.round((basicDataCount / totalRecords) * 100);

        // Calculate coverage percentages for detailed metrics
        quality.coverage = {
            gps: Math.round((gpsCount / totalRecords) * 100),
            heartRate: Math.round((hrCount / totalRecords) * 100),
            power: Math.round((powerCount / totalRecords) * 100),
            cadence: Math.round((cadenceCount / totalRecords) * 100),
            altitude: Math.round((altitudeCount / totalRecords) * 100),
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
     * Validate file data
     * @param {Object} data - File data to validate
     */
    validateFileData(data) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: [],
        };

        // Basic structure validation
        if (!data) {
            validation.isValid = false;
            validation.errors.push("No data provided");
        } else {
            // Check for required fields
            if (!data.records) {
                validation.errors.push("No records found in file");
                validation.isValid = false;
            }

            if (!data.sessions) {
                validation.warnings.push("No session data found");
            }

            if (!data.file_id) {
                validation.warnings.push("No file ID information");
            }

            // Check data consistency
            if (data.records && Array.isArray(data.records)) {
                if (data.records.length === 0) {
                    validation.errors.push("File contains no activity records");
                    validation.isValid = false;
                }
            }
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

    /**
     * Update file metrics display
     * @param {Object} processedData - Processed file data
     */
    updateFileMetrics(processedData) {
        updateState(
            "fitFile.metrics",
            {
                lastUpdated: Date.now(),
                recordCount: processedData.recordCount,
                hasSession: !!processedData.sessionInfo,
                hasDevice: !!processedData.deviceInfo,
                dataQualityScore: processedData.dataQuality?.completeness || 0,
            },
            { source: "FitFileStateManager.updateFileMetrics" }
        );
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
}

/**
 * FIT File State Selectors
 */
export const FitFileSelectors = {
    /**
     * Check if a file is currently loading
     * @returns {boolean} True if loading
     */
    isLoading() {
        return getState("fitFile.isLoading") || false;
    },

    /**
     * Get current file path
     * @returns {string|null} Current file path
     */
    getCurrentFile() {
        return getState("fitFile.currentFile");
    },

    /**
     * Get loading progress
     * @returns {number} Loading progress (0-100)
     */
    getLoadingProgress() {
        return getState("fitFile.loadingProgress") || 0;
    },

    /**
     * Get file validation status
     * @returns {Object|null} Validation object
     */
    getValidation() {
        return getState("fitFile.validation");
    },

    /**
     * Check if file data is valid
     * @returns {boolean} True if valid
     */
    isFileValid() {
        const validation = this.getValidation();
        return validation ? validation.isValid : false;
    },

    /**
     * Get processed file data
     * @returns {Object|null} Processed data
     */
    getProcessedData() {
        return getState("fitFile.processedData");
    },

    /**
     * Get file metrics
     * @returns {Object|null} File metrics
     */
    getMetrics() {
        return getState("fitFile.metrics");
    },

    /**
     * Get data quality assessment
     * @returns {Object|null} Data quality object
     */
    getDataQuality() {
        const processedData = this.getProcessedData();
        return processedData ? processedData.dataQuality : null;
    },

    /**
     * Check if file has GPS data
     * @returns {boolean} True if has GPS
     */
    hasGPS() {
        const quality = this.getDataQuality();
        return quality ? quality.hasGPS : false;
    },

    /**
     * Check if file has heart rate data
     * @returns {boolean} True if has heart rate
     */
    hasHeartRate() {
        const quality = this.getDataQuality();
        return quality ? quality.hasHeartRate : false;
    },

    /**
     * Check if file has power data
     * @returns {boolean} True if has power
     */
    hasPower() {
        const quality = this.getDataQuality();
        return quality ? quality.hasPower : false;
    },

    /**
     * Get loading error if any
     * @returns {string|null} Error message
     */
    getLoadingError() {
        return getState("fitFile.loadingError");
    },

    /**
     * Get processing error if any
     * @returns {string|null} Error message
     */
    getProcessingError() {
        return getState("fitFile.processingError");
    },
};

// Create global instance
export const fitFileStateManager = new FitFileStateManager();
