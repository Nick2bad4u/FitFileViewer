export const FIT_PARSER_OPERATION_ID: "fitFile:decode";
/**
 * Builds the adapter collection consumed by the fit parser's state integration layer.
 *
 * @returns {{
 *  fitFileStateManager: {
 *      updateLoadingProgress(progress: number): void;
 *      handleFileLoadingError(error: Error): void;
 *      handleFileLoaded(payload: any): void;
 *      getRecordCount(messages: any): number;
 *  };
 *  performanceMonitor: {
 *      isEnabled: boolean;
 *      startTimer(id: string): void;
 *      endTimer(id: string): number | null;
 *      getOperationTime(id: string): number | null;
 *  };
 *  settingsStateManager: {
 *      getCategory(category: string): any;
 *      updateCategory(category: string, value: any, options?: Record<string, unknown>): void;
 *  };
 * }} Adapter contract wired to mainProcessState.
 */
export function createFitParserStateAdapters(): {
    fitFileStateManager: {
        updateLoadingProgress(progress: number): void;
        handleFileLoadingError(error: Error): void;
        handleFileLoaded(payload: any): void;
        getRecordCount(messages: any): number;
    };
    performanceMonitor: {
        isEnabled: boolean;
        startTimer(id: string): void;
        endTimer(id: string): number | null;
        getOperationTime(id: string): number | null;
    };
    settingsStateManager: {
        getCategory(category: string): any;
        updateCategory(category: string, value: any, options?: Record<string, unknown>): void;
    };
};
/**
 * Ensures that fit parser state integration has executed once. Subsequent calls reuse the same
 * promise to avoid re-registering identical adapters.
 *
 * @returns {Promise<void>} Initialization guard promise.
 */
export function ensureFitParserStateIntegration(): Promise<void>;
