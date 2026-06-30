import type {
    BrowserCalendarState,
    BrowserListingState,
    BrowserListingStatus,
    BrowserScanState,
    BrowserScanStatus,
    BrowserState,
} from "../core/stateManagerDefaults.js";

export type BrowserView = BrowserState["view"];

type BrowserCalendarStateCandidate = Readonly<{
    readonly monthKey?: unknown;
    readonly selectedDayKey?: unknown;
}>;

type BrowserListingStateCandidate = Readonly<{
    readonly error?: unknown;
    readonly fileCount?: unknown;
    readonly folderCount?: unknown;
    readonly itemCount?: unknown;
    readonly loadedAt?: unknown;
    readonly relPath?: unknown;
    readonly root?: unknown;
    readonly status?: unknown;
}>;

type BrowserScanStateCandidate = Readonly<{
    readonly decodedActivityCount?: unknown;
    readonly error?: unknown;
    readonly fileCount?: unknown;
    readonly processedFileCount?: unknown;
    readonly root?: unknown;
    readonly scannedAt?: unknown;
    readonly status?: unknown;
}>;

export function isBrowserView(value: unknown): value is BrowserView {
    return value === "calendar" || value === "files" || value === "library";
}

export function normalizeBrowserView(value: unknown): BrowserView {
    return isBrowserView(value) ? value : "files";
}

export function normalizeBrowserCalendarState(
    value: unknown
): BrowserCalendarState {
    const state = toBrowserCalendarStateCandidate(value);

    return {
        monthKey: asMonthKey(state["monthKey"]),
        selectedDayKey: asDayKey(state["selectedDayKey"]),
    };
}

export function normalizeBrowserListingState(
    value: unknown
): BrowserListingState {
    const state = toBrowserListingStateCandidate(value);
    const { status } = state;

    return {
        error: asNullableString(state["error"]),
        fileCount: asNonNegativeNumber(state["fileCount"]),
        folderCount: asNonNegativeNumber(state["folderCount"]),
        itemCount: asNonNegativeNumber(state["itemCount"]),
        loadedAt: asNullableTimestamp(state["loadedAt"]),
        relPath: asString(state["relPath"]),
        root: asNullableString(state["root"]),
        status: isBrowserListingStatus(status) ? status : "idle",
    };
}

export function normalizeBrowserScanState(value: unknown): BrowserScanState {
    const state = toBrowserScanStateCandidate(value);
    const { status } = state;

    return {
        decodedActivityCount: asNonNegativeNumber(
            state["decodedActivityCount"]
        ),
        error: asNullableString(state["error"]),
        fileCount: asNonNegativeNumber(state["fileCount"]),
        processedFileCount: asNonNegativeNumber(state["processedFileCount"]),
        root: asNullableString(state["root"]),
        scannedAt: asNullableTimestamp(state["scannedAt"]),
        status: isBrowserScanStatus(status) ? status : "idle",
    };
}

export function normalizeBrowserStateBranch(
    value: Record<string, unknown>
): Record<string, unknown> {
    let normalizedBranch: Record<string, unknown> | undefined;

    if ("view" in value) {
        normalizedBranch ??= { ...value };
        normalizedBranch["view"] = normalizeBrowserView(value["view"]);
    }

    if ("listing" in value) {
        normalizedBranch ??= { ...value };
        normalizedBranch["listing"] = normalizeBrowserListingState(
            value["listing"]
        );
    }

    if ("calendar" in value) {
        normalizedBranch ??= { ...value };
        normalizedBranch["calendar"] = normalizeBrowserCalendarState(
            value["calendar"]
        );
    }

    if ("scan" in value) {
        normalizedBranch ??= { ...value };
        normalizedBranch["scan"] = normalizeBrowserScanState(value["scan"]);
    }

    return normalizedBranch ?? value;
}

function toBrowserCalendarStateCandidate(
    value: unknown
): BrowserCalendarStateCandidate {
    return value !== null && typeof value === "object" && !Array.isArray(value)
        ? value
        : {};
}

function isBrowserListingStatus(value: unknown): value is BrowserListingStatus {
    return (
        value === "empty" ||
        value === "error" ||
        value === "idle" ||
        value === "loaded" ||
        value === "loading" ||
        value === "unselected"
    );
}

function isBrowserScanStatus(value: unknown): value is BrowserScanStatus {
    return (
        value === "completed" ||
        value === "decoding" ||
        value === "error" ||
        value === "idle" ||
        value === "listing" ||
        value === "unavailable"
    );
}

function toBrowserListingStateCandidate(
    value: unknown
): BrowserListingStateCandidate {
    return value !== null && typeof value === "object" && !Array.isArray(value)
        ? value
        : {};
}

function toBrowserScanStateCandidate(
    value: unknown
): BrowserScanStateCandidate {
    return value !== null && typeof value === "object" && !Array.isArray(value)
        ? value
        : {};
}

function asNonNegativeNumber(value: unknown): number {
    return typeof value === "number" && Number.isFinite(value) && value > 0
        ? value
        : 0;
}

function asNullableTimestamp(value: unknown): null | number {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asNullableString(value: unknown): null | string {
    return typeof value === "string" ? value : null;
}

function asString(value: unknown): string {
    return typeof value === "string" ? value : "";
}

function asMonthKey(value: unknown): string {
    return typeof value === "string" && /^\d{4}-\d{2}$/u.test(value)
        ? value
        : "";
}

function asDayKey(value: unknown): string {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/u.test(value)
        ? value
        : "";
}
