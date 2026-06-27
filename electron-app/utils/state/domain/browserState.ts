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
} from "../core/stateManagerDefaults.js";
export {
    type BrowserView,
    normalizeBrowserListingState,
    normalizeBrowserScanState,
    normalizeBrowserView,
} from "./browserStateContract.js";
import {
    isBrowserView,
    normalizeBrowserListingState,
    normalizeBrowserScanState,
    type BrowserView,
} from "./browserStateContract.js";

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
