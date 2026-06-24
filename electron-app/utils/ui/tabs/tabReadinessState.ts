/**
 * State helpers for tab activation readiness.
 */

import { getStateMgr } from "./tabStateManagerSupport.js";
import {
    getTabReadinessStateRuntime,
    type TabReadinessStateRuntime,
} from "./tabReadinessStateRuntime.js";

/** Explicit tab activation lifecycle phase. */
export type TabReadinessStatus =
    | "blocked"
    | "error"
    | "idle"
    | "loading"
    | "ready";

/** Readiness metadata for one tab content area. */
export type TabReadinessEntry = {
    error: null | string;
    status: TabReadinessStatus;
    updatedAt: number;
};

function tabReadinessStateRuntime(): TabReadinessStateRuntime {
    return getTabReadinessStateRuntime();
}

function getErrorMessage(error: unknown): null | string {
    if (error === null || error === undefined) {
        return null;
    }

    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === "string") {
        return error;
    }

    try {
        return JSON.stringify(error);
    } catch {
        return String(error);
    }
}

/**
 * Store explicit readiness for one tab.
 *
 * @param tabName - Tab name as used by TAB_CONFIG.
 * @param status - New readiness status.
 * @param source - State-history source.
 * @param error - Optional error detail for error/blocked states.
 */
export function setTabReadiness(
    tabName: string,
    status: TabReadinessStatus,
    source: string,
    error?: unknown
): void {
    const entry: TabReadinessEntry = {
        error: getErrorMessage(error),
        status,
        updatedAt: tabReadinessStateRuntime().now(),
    };

    getStateMgr().setState(`ui.tabReadiness.${tabName}`, entry, {
        source,
    });
}
