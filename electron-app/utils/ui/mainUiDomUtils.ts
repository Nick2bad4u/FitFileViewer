/**
 * DOM utilities used by the main UI and drag-and-drop handlers.
 */

import { getElementByIdFlexible } from "./dom/elementIdUtils.js";
import {
    getMainUiDomUtilsRuntime,
    type MainUiDomUtilsRuntime,
} from "./mainUiDomUtilsRuntime.js";
import {
    getRendererElectronApi,
    type RendererElectronApiScope,
} from "../runtime/electronApiRuntime.js";
import type { ElectronFileApi } from "../../shared/preloadApi.js";

type MainUiDomElectronApi = {
    readonly decodeFitFile: ElectronFileApi["decodeFitFile"];
};

type EventListenerEntry = {
    readonly abortController: AbortController;
    readonly element: EventTarget;
    readonly handler: EventListenerOrEventListenerObject;
    readonly type: string;
};

const eventListeners: EventListenerEntry[] = [];

/**
 * Add an event listener and register it for cleanup.
 */
export function addEventListenerWithCleanup(
    element: EventTarget,
    type: string,
    handler: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions | boolean,
    runtime: MainUiDomUtilsRuntime = getMainUiDomUtilsRuntime()
): void {
    const abortController = runtime.createAbortController();
    try {
        if (typeof options === "boolean") {
            element.addEventListener(type, handler, {
                capture: options,
                signal: abortController.signal,
            });
        } else {
            element.addEventListener(type, handler, {
                ...options,
                signal: abortController.signal,
            });
        }
        eventListeners.push({ abortController, element, handler, type });
    } catch (error) {
        console.warn(
            `[main-ui] Failed to add event listener for ${type}`,
            error
        );
    }
}

/**
 * Remove all tracked event listeners.
 */
export function cleanupEventListeners(): void {
    for (const entry of eventListeners) {
        try {
            entry.abortController.abort();
        } catch {
            /* ignore */
        }
    }
    eventListeners.length = 0;
}

/**
 * Validate Electron API availability for FIT decoding.
 */
export function validateElectronAPI(
    electronApiScope?: RendererElectronApiScope
): boolean {
    return (
        getRendererElectronApi(isDecodeFitFileApi, electronApiScope) !== null
    );
}

function isDecodeFitFileApi(value: unknown): value is MainUiDomElectronApi {
    if (!isRecord(value)) {
        return false;
    }

    return typeof value["decodeFitFile"] === "function";
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Fetch an element by id and warn if missing.
 */
export function validateElement(id: string): HTMLElement | null {
    const element = getElementByIdFlexible(document, id);
    if (!element) {
        console.warn(`Element with ID "${id}" not found`);
    }
    return element;
}
