/**
 * FIT file state management for loading, validation, and derived file metrics.
 */

import {
    getAuxHeartRateValue,
    resolveFieldDescriptionMessages,
} from "../../data/processing/auxHeartRateUtils.js";
import { showNotification } from "../../ui/notifications/syncRendererNotifications.js";
import * as stateCore from "../core/stateManager.js";
import type { FitFileLoadingPhase } from "../core/stateManagerDefaults.js";
import {
    normalizeFitFileLoadingPhase,
    normalizeFitFileLoadingProgress,
    normalizeFitFileLoadingState,
} from "./fitFileLoadingContract.js";
import {
    getFitFileStateRuntime,
    type FitFileStateRuntime,
} from "./fitFileStateRuntime.js";

type DataRecord = Record<string, unknown>;
type Unsubscribe = () => void;
type RawFitDataArrayKey =
    | "eventMesgs"
    | "lapMesgs"
    | "recordMesgs"
    | "sessionMesgs"
    | "timeInZoneMesgs";

type RecordMessage = DataRecord & {
    altitude?: number;
    aux_heart_rate?: number;
    cadence?: number;
    heart_rate?: number;
    position_lat?: number;
    position_long?: number;
    power?: number;
};

type SessionMessage = DataRecord & {
    sport?: string;
    start_time?: number;
    sub_sport?: string;
    total_calories?: number;
    total_distance?: number;
    total_elapsed_time?: number;
};

type DeviceInfoMessage = DataRecord & {
    hardware_version?: number;
    manufacturer?: number | string;
    product?: number | string;
    serial_number?: number | string;
    software_version?: number;
};

type ActivityMessage = DataRecord & {
    local_timestamp?: number;
    num_sessions?: number;
    timestamp?: number;
    total_timer_time?: number;
};

export type RawFitData = DataRecord & {
    activities?: ActivityMessage[];
    device_infos?: DeviceInfoMessage[];
    eventMesgs?: DataRecord[];
    fileIdMesgs?: DataRecord[];
    lapMesgs?: DataRecord[];
    recordMesgs?: RecordMessage[];
    sessionMesgs?: SessionMessage[];
    timeInZoneMesgs?: DataRecord[];
};

export type LoadedFitFile = DataRecord & {
    data?: RawFitData;
    filePath?: string;
    originalPath?: string | null;
    sourceKey?: string | null;
};

type SessionInfo = {
    sport: string | undefined;
    startTime: number | undefined;
    subSport: string | undefined;
    totalCalories: number | undefined;
    totalDistance: number | undefined;
    totalElapsedTime: number | undefined;
};

type DeviceInfo = {
    hardwareVersion: number | undefined;
    manufacturer: number | string | undefined;
    product: number | string | undefined;
    serialNumber: number | string | undefined;
    softwareVersion: number | undefined;
};

type ActivityInfo = {
    localTimestamp: number | undefined;
    numSessions: number | undefined;
    timestamp: number | undefined;
    totalTimerTime: number | undefined;
};

type DataCoverage = {
    altitude: number;
    auxHeartRate: number;
    cadence: number;
    gps: number;
    heartRate: number;
    power: number;
};

type DataQuality = {
    completeness: number;
    coverage?: DataCoverage;
    hasAltitude: boolean;
    hasAuxHeartRate: boolean;
    hasCadence: boolean;
    hasGPS: boolean;
    hasHeartRate: boolean;
    hasPower: boolean;
    issues: string[];
};

type ProcessedData = {
    activityInfo: ActivityInfo | null;
    dataQuality: DataQuality;
    deviceInfo: DeviceInfo | null;
    recordCount: number;
    sessionInfo: SessionInfo | null;
};

type ValidationResult = {
    errors: string[];
    isValid: boolean;
    warnings: string[];
};

type FileMetrics = {
    dataQualityScore: number;
    hasDevice: boolean;
    hasSession: boolean;
    lastUpdated: number;
    recordCount: number;
};

type HandleFileLoadedOptions = {
    filePath?: string | null;
};

type LoadingPhaseTransitionOptions = {
    error?: null | string;
    filePath?: null | string;
    progress?: number;
    source?: string;
};

const SOURCE_CLEAR_FILE_STATE = "FitFileStateManager.clearFileState";
const FIT_FILE_CURRENT_FILE_STATE_PATH = "fitFile.currentFile";
const ACTIVE_LOADING_PHASES = new Set<FitFileLoadingPhase>([
    "parsing",
    "reading",
    "rendering",
    "selecting",
    "validating",
]);
const DEFAULT_PHASE_PROGRESS: Record<FitFileLoadingPhase, number> = {
    error: 0,
    idle: 0,
    loaded: 100,
    parsing: 65,
    reading: 15,
    rendering: 90,
    selecting: 5,
    validating: 45,
};
const ALLOWED_PHASE_TRANSITIONS: Record<
    FitFileLoadingPhase,
    readonly FitFileLoadingPhase[]
> = {
    error: [
        "idle",
        "selecting",
        "reading",
    ],
    idle: [
        "selecting",
        "reading",
        "parsing",
        "rendering",
        "loaded",
        "error",
    ],
    loaded: [
        "idle",
        "selecting",
        "reading",
    ],
    parsing: [
        "rendering",
        "loaded",
        "error",
        "idle",
    ],
    reading: [
        "validating",
        "parsing",
        "rendering",
        "loaded",
        "error",
        "idle",
    ],
    rendering: [
        "loaded",
        "error",
        "idle",
    ],
    selecting: [
        "reading",
        "error",
        "idle",
    ],
    validating: [
        "parsing",
        "rendering",
        "loaded",
        "error",
        "idle",
    ],
};

function emptyUnsubscribe(): void {
    // No-op fallback when the state manager API is unavailable in a test mock.
}

function fitFileStateRuntime(): FitFileStateRuntime {
    return getFitFileStateRuntime();
}

const subscribe = (
    ...args: Parameters<typeof stateCore.subscribe>
): Unsubscribe =>
    typeof stateCore.subscribe === "function"
        ? stateCore.subscribe(...args)
        : emptyUnsubscribe;

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

function getErrorMessage(error: unknown): string {
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

function getCurrentLoadingPhase(): FitFileLoadingPhase {
    return normalizeFitFileLoadingPhase(
        stateCore.getState("fitFile.loadingPhase")
    );
}

function isRawFitData(value: unknown): value is RawFitData {
    return value !== null && typeof value === "object";
}

function hasRecords(data: RawFitData | null | undefined): data is RawFitData & {
    recordMesgs: RecordMessage[];
} {
    return isRawFitData(data) && Array.isArray(data.recordMesgs);
}

function getRawMessageArray<T extends DataRecord = DataRecord>(
    key: RawFitDataArrayKey
): T[] {
    const rawData = getStoredRawFitData();
    if (!isRawFitData(rawData)) {
        return [];
    }
    const messages = rawData?.[key];
    return Array.isArray(messages) ? (messages as T[]) : [];
}

function getStoredRawFitData(): RawFitData | null {
    const domainRawData = stateCore.getState("fitFile.rawData");
    return isRawFitData(domainRawData) ? domainRawData : null;
}

function getStoredCurrentFile(): null | string {
    const currentFile = stateCore.getState(FIT_FILE_CURRENT_FILE_STATE_PATH);
    return typeof currentFile === "string" ? currentFile : null;
}

function setCurrentFileState(filePath: null | string, source: string): void {
    stateCore.setState(FIT_FILE_CURRENT_FILE_STATE_PATH, filePath, { source });
}

/**
 * Handles FIT file specific state operations.
 */
export class FitFileStateManager {
    public constructor() {
        this.initialize();
    }

    /**
     * Assess data quality from FIT record messages.
     */
    public assessDataQuality(data: RawFitData | null | undefined): DataQuality {
        const quality: DataQuality = {
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
    public clearFileState(): void {
        this.transitionLoadingPhase("idle", {
            filePath: null,
            progress: 0,
            source: SOURCE_CLEAR_FILE_STATE,
        });
        stateCore.setState("fitFile.isLoading", false, {
            source: SOURCE_CLEAR_FILE_STATE,
        });
        setCurrentFileState(null, SOURCE_CLEAR_FILE_STATE);
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
        stateCore.setState("fitFile.loaded", null, {
            source: SOURCE_CLEAR_FILE_STATE,
        });
        stateCore.setState("fitFile.loadedFiles", [], {
            source: SOURCE_CLEAR_FILE_STATE,
        });

        console.log("[FitFileState] File state cleared");
    }

    /**
     * Extract activity information.
     */
    public extractActivityInfo(
        data: RawFitData | null | undefined
    ): ActivityInfo | null {
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
    public extractDeviceInfo(
        data: RawFitData | null | undefined
    ): DeviceInfo | null {
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
    public extractSessionInfo(
        data: RawFitData | null | undefined
    ): SessionInfo | null {
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
    public getRecordCount(data: RawFitData | null | undefined): number {
        return hasRecords(data) ? data.recordMesgs.length : 0;
    }

    /**
     * Handle successful file loading.
     */
    public handleFileLoaded(
        fileData: RawFitData | null | undefined,
        options: HandleFileLoadedOptions = {}
    ): void {
        const source = "FitFileStateManager.handleFileLoaded";
        const safeData = fileData ?? null;

        stateCore.setState("fitFile.isLoading", false, { source });
        stateCore.setState("fitFile.loadingProgress", 100, { source });
        stateCore.setState("fitFile.loadingError", null, { source });
        stateCore.setState("fitFile.rawData", safeData, { source });

        const providedPath = isNonEmptyString(options.filePath)
            ? options.filePath
            : null;
        const resolvedPath = providedPath ?? getStoredCurrentFile();

        this.transitionLoadingPhase("loaded", {
            filePath: resolvedPath,
            progress: 100,
            source,
        });
        setCurrentFileState(resolvedPath, source);
        stateCore.setState("fitFile.loaded", safeData, { source });

        stateCore.setState("charts.isRendered", false, { source });
        stateCore.setState("map.isRendered", false, { source });
        stateCore.setState("tables.isRendered", false, { source });

        stateCore.setState(
            "performance.lastLoadTime",
            fitFileStateRuntime().dateNow(),
            { source }
        );
        stateCore.setState("isLoading", false, { source });

        showNotification("FIT file loaded successfully", "success", 3000);
        console.log("[FitFileState] File loaded successfully");
    }

    /**
     * Store the active file plus overlay FIT-file entries.
     */
    public setLoadedFiles(
        files: readonly LoadedFitFile[],
        source = "FitFileStateManager.setLoadedFiles"
    ): void {
        stateCore.setState("fitFile.loadedFiles", [...files], { source });
    }

    /**
     * Handle file loading errors.
     */
    public handleFileLoadingError(error: unknown): void {
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
        this.transitionLoadingPhase("error", {
            error: message,
            source: "FitFileStateManager.handleFileLoadingError",
        });

        showNotification(`Failed to load FIT file: ${message}`, "error", 5000);
        console.error(
            "[FitFileState] File loading failed:",
            error instanceof Error ? error : message
        );
    }

    /**
     * Initialize FIT file state subscriptions.
     */
    public initialize(): void {
        this.setupFileLoadingListeners();
        this.setupDataProcessingListeners();
        this.setupValidationListeners();

        console.log("[FitFileState] Initialized");
    }

    /**
     * Whether a FIT file load is currently in an active phase.
     */
    public isLoading(): boolean {
        return FitFileSelectors.isLoading();
    }

    /**
     * Process raw file data and extract useful information.
     */
    public processFileData(data: RawFitData | null | undefined): void {
        try {
            const processedData: ProcessedData = {
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
    public setupDataProcessingListeners(): void {
        subscribe("fitFile.rawData", (data) => {
            if (data) {
                this.processFileData(data as RawFitData);
            }
        });

        subscribe("fitFile.processedData", (processedData) => {
            this.updateFileMetrics(
                processedData === null || processedData === undefined
                    ? null
                    : (processedData as ProcessedData)
            );
        });
    }

    /**
     * Set up listeners for file loading events.
     */
    public setupFileLoadingListeners(): void {
        subscribe("fitFile.loadingProgress", (progress) => {
            this.updateLoadingProgress(
                typeof progress === "number" ? progress : 0
            );
        });

        subscribe("fitFile.loaded", (fileData) => {
            this.handleFileLoaded(fileData as RawFitData);
        });

        subscribe("fitFile.loadingError", (error) => {
            this.handleFileLoadingError(error);
        });
    }

    /**
     * Set up data validation listeners.
     */
    public setupValidationListeners(): void {
        subscribe("fitFile.rawData", (data) => {
            if (data) {
                this.validateFileData(data as RawFitData);
            }
        });
    }

    /**
     * Start file loading process.
     */
    public startFileLoading(filePath: string): void {
        const source = "FitFileStateManager.startFileLoading";
        this.transitionLoadingPhase("reading", {
            filePath,
            progress: 0,
            source,
        });
        stateCore.setState("fitFile.isLoading", true, { source });
        stateCore.setState("isLoading", true, { source });
        setCurrentFileState(filePath, source);
        stateCore.setState("fitFile.loadingProgress", 0, { source });
        stateCore.setState("fitFile.loadingError", null, { source });

        console.log(`[FitFileState] Started loading: ${filePath}`);
    }

    /**
     * Transition the FIT-file loading lifecycle through its explicit phases.
     */
    public transitionLoadingPhase(
        phase: FitFileLoadingPhase,
        options: LoadingPhaseTransitionOptions = {}
    ): boolean {
        const currentPhase = getCurrentLoadingPhase();
        if (
            currentPhase !== phase &&
            !ALLOWED_PHASE_TRANSITIONS[currentPhase].includes(phase)
        ) {
            console.warn(
                `[FitFileState] Ignoring invalid loading phase transition: ${currentPhase} -> ${phase}`
            );
            return false;
        }

        const source =
            options.source ?? "FitFileStateManager.transitionLoadingPhase";
        const isLoading = ACTIVE_LOADING_PHASES.has(phase);
        const previousState = stateCore.getState("fitFile.loadingState");
        const previous =
            previousState !== null &&
            typeof previousState === "object" &&
            !Array.isArray(previousState)
                ? (previousState as {
                      filePath?: unknown;
                      startedAt?: unknown;
                  })
                : {};
        const previousPath =
            typeof previous.filePath === "string" ? previous.filePath : null;
        const filePath =
            options.filePath === undefined ? previousPath : options.filePath;
        const progress = normalizeFitFileLoadingProgress(
            options.progress ?? DEFAULT_PHASE_PROGRESS[phase]
        );
        const now = fitFileStateRuntime().dateNow();
        const startedAt =
            phase === "idle"
                ? null
                : typeof previous.startedAt === "number"
                  ? previous.startedAt
                  : now;
        const error = phase === "error" ? (options.error ?? null) : null;

        stateCore.setState("fitFile.loadingPhase", phase, { source });
        stateCore.setState(
            "fitFile.loadingState",
            {
                error,
                filePath,
                phase,
                progress,
                startedAt,
                updatedAt: now,
            },
            { source }
        );
        stateCore.setState("fitFile.loadingProgress", progress, { source });
        stateCore.setState("fitFile.isLoading", isLoading, { source });
        stateCore.setState("isLoading", isLoading, { source });

        return true;
    }

    /**
     * Update file metrics display.
     */
    public updateFileMetrics(processedData: ProcessedData | null): void {
        if (!processedData) {
            return;
        }

        stateCore.updateState(
            "fitFile.metrics",
            {
                dataQualityScore: processedData.dataQuality.completeness,
                hasDevice: Boolean(processedData.deviceInfo),
                hasSession: Boolean(processedData.sessionInfo),
                lastUpdated: fitFileStateRuntime().dateNow(),
                recordCount: processedData.recordCount,
            } satisfies FileMetrics,
            { source: "FitFileStateManager.updateFileMetrics" }
        );
    }

    /**
     * Update file loading progress.
     */
    public updateLoadingProgress(progress: number): void {
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
    public validateFileData(data: RawFitData | null | undefined): void {
        const validation: ValidationResult = {
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
    getCurrentFile(): string | null {
        return getStoredCurrentFile();
    },

    getDataQuality(): DataQuality | null {
        const processedData = this.getProcessedData();
        return processedData ? processedData.dataQuality : null;
    },

    getLoadingError(): string | null {
        const loadingError = stateCore.getState("fitFile.loadingError");
        return typeof loadingError === "string" ? loadingError : null;
    },

    getLoadingProgress(): number {
        return normalizeFitFileLoadingProgress(
            stateCore.getState("fitFile.loadingProgress")
        );
    },

    getLoadingPhase(): FitFileLoadingPhase {
        return getCurrentLoadingPhase();
    },

    getLoadingState(): {
        error: null | string;
        filePath: null | string;
        phase: FitFileLoadingPhase;
        progress: number;
        startedAt: null | number;
        updatedAt: null | number;
    } {
        return normalizeFitFileLoadingState(
            stateCore.getState("fitFile.loadingState")
        );
    },

    getLoadedFiles<T extends LoadedFitFile = LoadedFitFile>(): T[] {
        const loadedFiles = stateCore.getState("fitFile.loadedFiles");
        return Array.isArray(loadedFiles) ? ([...loadedFiles] as T[]) : [];
    },

    getMetrics(): FileMetrics | null {
        const metrics = stateCore.getState("fitFile.metrics");
        return metrics === null || metrics === undefined
            ? null
            : (metrics as FileMetrics);
    },

    getProcessedData(): ProcessedData | null {
        const processedData = stateCore.getState("fitFile.processedData");
        return processedData === null || processedData === undefined
            ? null
            : (processedData as ProcessedData);
    },

    getProcessingError(): string | null {
        const processingError = stateCore.getState("fitFile.processingError");
        return typeof processingError === "string" ? processingError : null;
    },

    getRawData(): RawFitData | null {
        return getStoredRawFitData();
    },

    getEventMessages<T extends DataRecord = DataRecord>(): T[] {
        return getRawMessageArray<T>("eventMesgs");
    },

    getLapMessages<T extends DataRecord = DataRecord>(): T[] {
        return getRawMessageArray<T>("lapMesgs");
    },

    getRecordMessages<T extends DataRecord = DataRecord>(): T[] {
        return getRawMessageArray<T>("recordMesgs");
    },

    getSessionMessages<T extends DataRecord = DataRecord>(): T[] {
        return getRawMessageArray<T>("sessionMesgs");
    },

    getTimeInZoneMessages<T extends DataRecord = DataRecord>(): T[] {
        return getRawMessageArray<T>("timeInZoneMesgs");
    },

    getValidation(): ValidationResult | null {
        const validation = stateCore.getState("fitFile.validation");
        return validation === null || validation === undefined
            ? null
            : (validation as ValidationResult);
    },

    hasAuxHeartRate(): boolean {
        return Boolean(this.getDataQuality()?.hasAuxHeartRate);
    },

    hasGPS(): boolean {
        return Boolean(this.getDataQuality()?.hasGPS);
    },

    hasHeartRate(): boolean {
        return Boolean(this.getDataQuality()?.hasHeartRate);
    },

    hasPower(): boolean {
        return Boolean(this.getDataQuality()?.hasPower);
    },

    isFileValid(): boolean {
        return Boolean(this.getValidation()?.isValid);
    },

    isLoading(): boolean {
        return stateCore.getState("fitFile.isLoading") === true;
    },
};

/** Shared singleton used by file import, drag/drop, and rendering flows. */
export const fitFileStateManager = new FitFileStateManager();
