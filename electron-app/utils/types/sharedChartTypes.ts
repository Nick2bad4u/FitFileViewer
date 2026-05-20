/**
 * Shared lightweight chart-related types used while legacy chart modules
 * migrate toward explicit domain contracts.
 */

/** Single activity record subset used by chart renderers. */
export interface RecordMesg {
    readonly altitude?: number;
    readonly cadence?: number;
    readonly distance?: number;
    readonly enhancedAltitude?: number;
    readonly enhancedSpeed?: number;
    readonly heartRate?: number;
    readonly positionLat?: number;
    readonly positionLong?: number;
    readonly power?: number;
    readonly speed?: number;
    readonly timestamp?: number;
    readonly [key: string]: unknown;
}

/** Zone datum used for zone charts. */
export interface ZoneData {
    readonly color?: string;
    readonly label?: string;
    readonly percent?: number;
    readonly time?: number;
    readonly value?: number;
    readonly zone?: number;
}

/** Minimal session message shape consumed by chart summaries. */
export interface SessionMesg {
    readonly avg_speed?: number;
    readonly max_speed?: number;
    readonly start_time?: number;
    readonly total_ascent?: number;
    readonly total_descent?: number;
    readonly total_distance?: number;
    readonly total_elapsed_time?: number;
    readonly total_timer_time?: number;
    readonly [key: string]: unknown;
}

declare global {
    interface Window {
        _chartjsInstances?: unknown[];
    }
}
