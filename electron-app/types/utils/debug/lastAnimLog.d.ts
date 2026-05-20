/** Log animation progress at a throttled cadence in development mode. */
export function throttledAnimLog(message: string): void;

/** Log critical animation events immediately in development mode. */
export function criticalAnimLog(message: string): void;

/** Log animation timing information at a throttled cadence. */
export function perfAnimLog(message: string, startTime?: number): void;
