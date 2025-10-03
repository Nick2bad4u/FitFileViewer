/**
 * Shared Chart.js type declarations for use across the application.
 * These are intentionally partial; extend gradually.
 *
 * @module sharedChartTypes

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Single activity record (subset) */
export interface RecordMesg {
    timestamp?: number;
    positionLat?: number;
    positionLong?: number;
    heartRate?: number;
    cadence?: number;
    speed?: number;
    enhancedSpeed?: number;
    altitude?: number;
    enhancedAltitude?: number;
    power?: number;
    distance?: number;
    [key: string]: any; // allow unknown developer fields while migrating
}

/** Zone datum used for zone charts */
export interface ZoneData {
    zone?: number;
    label?: string;
    time?: number;
    percent?: number;
    color?: string;
}

/** Session message minimal */
export interface SessionMesg {
    start_time?: number;
    total_elapsed_time?: number;
    total_timer_time?: number;
    total_distance?: number;
    avg_speed?: number;
    max_speed?: number;
    total_ascent?: number;
    total_descent?: number;
    [key: string]: any;
}

declare global {
    interface Window {
        _chartjsInstances?: any[];
    }
}

export {};
