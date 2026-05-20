import type { FitFileLoadedPayload, FitMessages } from "../../../shared/fit";
import type {
    FitParserStateManagers,
    PerformanceMonitor,
    SettingsStateManager,
} from "../../fitParser";

export const FIT_PARSER_OPERATION_ID: "fitFile:decode";

export interface FitFileStateManager {
    updateLoadingProgress(progress: number): void;
    handleFileLoadingError(error: Error): void;
    handleFileLoaded(payload: FitFileLoadedPayload): void;
    getRecordCount(messages: FitMessages): number;
}

export interface FitParserStateAdapters extends FitParserStateManagers {
    fitFileStateManager: FitFileStateManager;
    performanceMonitor: PerformanceMonitor;
    settingsStateManager: SettingsStateManager;
}

export function createFitParserStateAdapters(): FitParserStateAdapters;

export function ensureFitParserStateIntegration(): Promise<void>;
