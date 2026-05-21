/**
 * FIT file state management for loading, validation, and derived file metrics.
 */
import { showNotification } from "../../app/initialization/rendererUtils.js";
import {
    getAuxHeartRateValue,
    resolveFieldDescriptionMessages,
} from "../../data/processing/auxHeartRateUtils.js";
import * as stateCore from "../core/stateManager.js";
const SOURCE_CLEAR_FILE_STATE = "FitFileStateManager.clearFileState";
function emptyUnsubscribe() {
    // No-op fallback when the state manager API is unavailable in a test mock.
}
const subscribe = (...args) =>
    typeof stateCore.subscribe === "function"
        ? stateCore.subscribe(...args)
        : emptyUnsubscribe;
function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}
function getErrorMessage(error) {
    if (isNonEmptyString(error)) {
        return error;
    }
    if (
        error !== null &&
        typeof error === "object" &&
        "message" in error &&
        isNonEmptyString(error.message)
    ) {
        return error.message;
    }
    return "Unknown error";
}
function isRawFitData(value) {
    return value !== null && typeof value === "object";
}
function hasRecords(data) {
    return isRawFitData(data) && Array.isArray(data.recordMesgs);
}
/**
 * Handles FIT file specific state operations.
 */
export class FitFileStateManager {
    constructor() {
        this.initialize();
    }
    /**
     * Assess data quality from FIT record messages.
     */
    assessDataQuality(data) {
        const quality = {
            completeness: 0,
            hasAltitude: false,
            hasAuxHeartRate: false,
            hasCadence: false,
            hasGPS: false,
            hasHeartRate: false,
            hasPower: false,
            issues: [],
        };
        if (!hasRecords(data)) {
            quality.issues.push("No record data found");
            return quality;
        }
        const records = data.recordMesgs;
        const totalRecords = records.length;
        if (totalRecords === 0) {
            quality.issues.push("No records in file");
            return quality;
        }
        let altitudeCount = 0;
        let auxHrCount = 0;
        let cadenceCount = 0;
        let gpsCount = 0;
        let hrCount = 0;
        let powerCount = 0;
        const fieldDescriptionMesgs = resolveFieldDescriptionMessages(data);
        for (const record of records) {
            if (record.position_lat && record.position_long) {
                gpsCount += 1;
                quality.hasGPS = true;
            }
            if (record.heart_rate) {
                hrCount += 1;
                quality.hasHeartRate = true;
            }
            const auxHrValue = getAuxHeartRateValue(record, {
                fieldDescriptionMesgs,
                recordMesgs: records,
            });
            if (typeof auxHrValue === "number" && Number.isFinite(auxHrValue)) {
                auxHrCount += 1;
                quality.hasAuxHeartRate = true;
            }
            if (record.power) {
                powerCount += 1;
                quality.hasPower = true;
            }
            if (record.cadence) {
                cadenceCount += 1;
                quality.hasCadence = true;
            }
            if (record.altitude) {
                altitudeCount += 1;
                quality.hasAltitude = true;
            }
        }
        const basicDataCount = Math.max(gpsCount, hrCount, auxHrCount, 1);
        quality.completeness = Math.round(
            (basicDataCount / totalRecords) * 100
        );
        quality.coverage = {
            altitude: Math.round((altitudeCount / totalRecords) * 100),
            auxHeartRate: Math.round((auxHrCount / totalRecords) * 100),
            cadence: Math.round((cadenceCount / totalRecords) * 100),
            gps: Math.round((gpsCount / totalRecords) * 100),
            heartRate: Math.round((hrCount / totalRecords) * 100),
            power: Math.round((powerCount / totalRecords) * 100),
        };
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
     * Clear all file-related state.
     */
    clearFileState() {
        stateCore.setState("fitFile.isLoading", false, {
            source: SOURCE_CLEAR_FILE_STATE,
        });
        stateCore.setState("fitFile.currentFile", null, {
            source: SOURCE_CLEAR_FILE_STATE,
        });
        stateCore.setState("fitFile.rawData", null, {
            source: SOURCE_CLEAR_FILE_STATE,
        });
        stateCore.setState("fitFile.processedData", null, {
            source: SOURCE_CLEAR_FILE_STATE,
        });
        stateCore.setState("fitFile.validation", null, {
            source: SOURCE_CLEAR_FILE_STATE,
        });
        stateCore.setState("fitFile.metrics", null, {
            source: SOURCE_CLEAR_FILE_STATE,
        });
        stateCore.setState("fitFile.loadingError", null, {
            source: SOURCE_CLEAR_FILE_STATE,
        });
        stateCore.setState("fitFile.processingError", null, {
            source: SOURCE_CLEAR_FILE_STATE,
        });
        console.log("[FitFileState] File state cleared");
    }
    /**
     * Extract activity information.
     */
    extractActivityInfo(data) {
        if (
            !isRawFitData(data) ||
            !Array.isArray(data.activities) ||
            data.activities.length === 0
        ) {
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
     * Extract device information.
     */
    extractDeviceInfo(data) {
        if (
            !isRawFitData(data) ||
            !Array.isArray(data.device_infos) ||
            data.device_infos.length === 0
        ) {
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
    /**
     * Extract session information.
     */
    extractSessionInfo(data) {
        if (
            !isRawFitData(data) ||
            !Array.isArray(data.sessionMesgs) ||
            data.sessionMesgs.length === 0
        ) {
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
     * Get record count from file data.
     */
    getRecordCount(data) {
        return hasRecords(data) ? data.recordMesgs.length : 0;
    }
    /**
     * Handle successful file loading.
     */
    handleFileLoaded(fileData, options = {}) {
        const source = "FitFileStateManager.handleFileLoaded";
        const safeData = fileData ?? null;
        stateCore.setState("fitFile.isLoading", false, { source });
        stateCore.setState("fitFile.loadingProgress", 100, { source });
        stateCore.setState("fitFile.loadingError", null, { source });
        stateCore.setState("fitFile.rawData", safeData, { source });
        const providedPath = isNonEmptyString(options.filePath)
            ? options.filePath
            : null;
        const currentFile = stateCore.getState("fitFile.currentFile");
        const resolvedPath =
            providedPath ??
            (typeof currentFile === "string" ? currentFile : null);
        stateCore.setState("globalData", safeData, { source });
        stateCore.setState("currentFile", resolvedPath, { source });
        stateCore.setState("fitFile.currentFile", resolvedPath, { source });
        stateCore.setState("charts.isRendered", false, { source });
        stateCore.setState("map.isRendered", false, { source });
        stateCore.setState("tables.isRendered", false, { source });
        stateCore.setState("performance.lastLoadTime", Date.now(), { source });
        stateCore.setState("isLoading", false, { source });
        showNotification("FIT file loaded successfully", "success", 3000);
        console.log("[FitFileState] File loaded successfully");
    }
    /**
     * Handle file loading errors.
     */
    handleFileLoadingError(error) {
        if (error === null || error === undefined || error === "") {
            return;
        }
        const previousMessage = stateCore.getState("fitFile.loadingError");
        const message = getErrorMessage(error);
        if (typeof error === "string" && previousMessage === message) {
            return;
        }
        stateCore.setState("fitFile.isLoading", false, {
            source: "FitFileStateManager.handleFileLoadingError",
        });
        if (previousMessage !== message) {
            stateCore.setState("fitFile.loadingError", message, {
                source: "FitFileStateManager.handleFileLoadingError",
            });
        }
        showNotification(`Failed to load FIT file: ${message}`, "error", 5000);
        console.error(
            "[FitFileState] File loading failed:",
            error instanceof Error ? error : message
        );
    }
    /**
     * Initialize FIT file state subscriptions.
     */
    initialize() {
        this.setupFileLoadingListeners();
        this.setupDataProcessingListeners();
        this.setupValidationListeners();
        console.log("[FitFileState] Initialized");
    }
    /**
     * Process raw file data and extract useful information.
     */
    processFileData(data) {
        try {
            const processedData = {
                activityInfo: this.extractActivityInfo(data),
                dataQuality: this.assessDataQuality(data),
                deviceInfo: this.extractDeviceInfo(data),
                recordCount: this.getRecordCount(data),
                sessionInfo: this.extractSessionInfo(data),
            };
            stateCore.setState("fitFile.processedData", processedData, {
                source: "FitFileStateManager.processFileData",
            });
            console.log("[FitFileState] Data processed successfully");
        } catch (error) {
            console.error("[FitFileState] Error processing data:", error);
            stateCore.setState(
                "fitFile.processingError",
                getErrorMessage(error),
                {
                    source: "FitFileStateManager.processFileData",
                }
            );
        }
    }
    /**
     * Set up listeners for data processing events.
     */
    setupDataProcessingListeners() {
        subscribe("globalData", (data) => {
            if (data) {
                this.processFileData(data);
            }
        });
        subscribe("fitFile.processedData", (processedData) => {
            this.updateFileMetrics(
                processedData === null || processedData === undefined
                    ? null
                    : processedData
            );
        });
    }
    /**
     * Set up listeners for file loading events.
     */
    setupFileLoadingListeners() {
        subscribe("fitFile.loadingProgress", (progress) => {
            this.updateLoadingProgress(
                typeof progress === "number" ? progress : 0
            );
        });
        subscribe("fitFile.loaded", (fileData) => {
            this.handleFileLoaded(fileData);
        });
        subscribe("fitFile.loadingError", (error) => {
            this.handleFileLoadingError(error);
        });
    }
    /**
     * Set up data validation listeners.
     */
    setupValidationListeners() {
        subscribe("globalData", (data) => {
            if (data) {
                this.validateFileData(data);
            }
        });
    }
    /**
     * Start file loading process.
     */
    startFileLoading(filePath) {
        const source = "FitFileStateManager.startFileLoading";
        stateCore.setState("fitFile.isLoading", true, { source });
        stateCore.setState("isLoading", true, { source });
        stateCore.setState("fitFile.currentFile", filePath, { source });
        stateCore.setState("fitFile.loadingProgress", 0, { source });
        stateCore.setState("fitFile.loadingError", null, { source });
        console.log(`[FitFileState] Started loading: ${filePath}`);
    }
    /**
     * Update file metrics display.
     */
    updateFileMetrics(processedData) {
        if (!processedData) {
            return;
        }
        stateCore.updateState(
            "fitFile.metrics",
            {
                dataQualityScore: processedData.dataQuality.completeness,
                hasDevice: Boolean(processedData.deviceInfo),
                hasSession: Boolean(processedData.sessionInfo),
                lastUpdated: Date.now(),
                recordCount: processedData.recordCount,
            },
            { source: "FitFileStateManager.updateFileMetrics" }
        );
    }
    /**
     * Update file loading progress.
     */
    updateLoadingProgress(progress) {
        const indicatorState = {
            active: progress > 0 && progress < 100,
            progress,
        };
        stateCore.updateState("ui.loadingIndicator", indicatorState, {
            source: "FitFileStateManager.updateLoadingProgress",
        });
        console.log(
            `[FitFileState] Loading progress state updated: ${progress}%`
        );
    }
    /**
     * Validate file data.
     */
    validateFileData(data) {
        const validation = {
            errors: [],
            isValid: true,
            warnings: [],
        };
        if (data) {
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
            if (
                Array.isArray(data.recordMesgs) &&
                data.recordMesgs.length === 0
            ) {
                validation.errors.push("File contains no activity records");
                validation.isValid = false;
            }
        } else {
            validation.isValid = false;
            validation.errors.push("No data provided");
        }
        stateCore.setState("fitFile.validation", validation, {
            source: "FitFileStateManager.validateFileData",
        });
        if (!validation.isValid) {
            showNotification(
                `File validation failed: ${validation.errors.join(", ")}`,
                "error"
            );
        } else if (validation.warnings.length > 0) {
            showNotification(
                `File loaded with warnings: ${validation.warnings.join(", ")}`,
                "warning"
            );
        }
        console.log("[FitFileState] File validation completed:", validation);
    }
}
/**
 * FIT file state selectors.
 */
export const FitFileSelectors = {
    getCurrentFile() {
        const currentFile = stateCore.getState("fitFile.currentFile");
        return typeof currentFile === "string" ? currentFile : null;
    },
    getDataQuality() {
        const processedData = this.getProcessedData();
        return processedData ? processedData.dataQuality : null;
    },
    getLoadingError() {
        const loadingError = stateCore.getState("fitFile.loadingError");
        return typeof loadingError === "string" ? loadingError : null;
    },
    getLoadingProgress() {
        const loadingProgress = stateCore.getState("fitFile.loadingProgress");
        return typeof loadingProgress === "number" ? loadingProgress : 0;
    },
    getMetrics() {
        const metrics = stateCore.getState("fitFile.metrics");
        return metrics === null || metrics === undefined ? null : metrics;
    },
    getProcessedData() {
        const processedData = stateCore.getState("fitFile.processedData");
        return processedData === null || processedData === undefined
            ? null
            : processedData;
    },
    getProcessingError() {
        const processingError = stateCore.getState("fitFile.processingError");
        return typeof processingError === "string" ? processingError : null;
    },
    getValidation() {
        const validation = stateCore.getState("fitFile.validation");
        return validation === null || validation === undefined
            ? null
            : validation;
    },
    hasAuxHeartRate() {
        return Boolean(this.getDataQuality()?.hasAuxHeartRate);
    },
    hasGPS() {
        return Boolean(this.getDataQuality()?.hasGPS);
    },
    hasHeartRate() {
        return Boolean(this.getDataQuality()?.hasHeartRate);
    },
    hasPower() {
        return Boolean(this.getDataQuality()?.hasPower);
    },
    isFileValid() {
        return Boolean(this.getValidation()?.isValid);
    },
    isLoading() {
        return stateCore.getState("fitFile.isLoading") === true;
    },
};
/** Shared singleton used by file import, drag/drop, and rendering flows. */
export const fitFileStateManager = new FitFileStateManager();
if (typeof globalThis !== "undefined") {
    const fitFileGlobal = globalThis;
    Object.defineProperty(fitFileGlobal, "__FFV_fitFileStateManager", {
        configurable: true,
        enumerable: false,
        value: fitFileStateManager,
        writable: true,
    });
}
