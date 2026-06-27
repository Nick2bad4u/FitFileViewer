import {
    getState,
    setState,
    type StateUpdateOptions,
} from "../core/stateManager.js";
import type {
    BrowserListingState,
    BrowserListingStatus,
    BrowserScanState,
    BrowserScanStatus,
    BrowserState,
} from "../core/stateManagerDefaults.js";

export type BrowserView = BrowserState["view"];

export type BrowserListingStateUpdate = {
    readonly error?: null | string;
    readonly fileCount?: number;
    readonly folderCount?: number;
    readonly itemCount?: number;
    readonly loadedAt?: null | number;
    readonly relPath?: string;
    readonly root?: null | string;
    readonly status: BrowserListingStatus;
};

export type BrowserScanStateUpdate = {
    readonly decodedActivityCount?: number;
    readonly error?: null | string;
    readonly fileCount?: number;
    readonly processedFileCount?: number;
    readonly root?: null | string;
    readonly scannedAt?: null | number;
    readonly status: BrowserScanStatus;
};

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

const BROWSER_REL_PATH_STATE_PATH = "browser.relPath";
const BROWSER_VIEW_STATE_PATH = "browser.view";
const BROWSER_LISTING_STATE_PATH = "browser.listing";
const BROWSER_SCAN_STATE_PATH = "browser.scan";

export function getBrowserRelPath(): string {
    const relPath = getState(BROWSER_REL_PATH_STATE_PATH);
    return typeof relPath === "string" ? relPath : "";
}

export function setBrowserRelPath(
    relPath: string,
    options: StateUpdateOptions = {}
): void {
    setState(BROWSER_REL_PATH_STATE_PATH, relPath, {
        source: "browserState.setRelPath",
        ...options,
    });
}

export function getBrowserView(): BrowserView {
    const view = getState(BROWSER_VIEW_STATE_PATH);
    return isBrowserView(view) ? view : "files";
}

export function setBrowserView(
    view: BrowserView,
    options: StateUpdateOptions = {}
): void {
    setState(BROWSER_VIEW_STATE_PATH, view, {
        source: "browserState.setView",
        ...options,
    });
}

export function getBrowserListingState(): BrowserListingState {
    return normalizeBrowserListingState(getState(BROWSER_LISTING_STATE_PATH));
}

export function setBrowserListingState(
    update: BrowserListingStateUpdate,
    options: StateUpdateOptions = {}
): void {
    setState(BROWSER_LISTING_STATE_PATH, normalizeBrowserListingState(update), {
        source: "browserState.listing",
        ...options,
    });
}

export function getBrowserScanState(): BrowserScanState {
    return normalizeBrowserScanState(getState(BROWSER_SCAN_STATE_PATH));
}

export function setBrowserScanState(
    update: BrowserScanStateUpdate,
    options: StateUpdateOptions = {}
): void {
    setState(BROWSER_SCAN_STATE_PATH, normalizeBrowserScanState(update), {
        source: "browserState.scan",
        ...options,
    });
}

function isBrowserView(value: unknown): value is BrowserView {
    return value === "calendar" || value === "files" || value === "library";
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

function normalizeBrowserListingState(value: unknown): BrowserListingState {
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

function normalizeBrowserScanState(value: unknown): BrowserScanState {
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
