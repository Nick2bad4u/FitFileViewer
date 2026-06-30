import {
    isRendererVendorEntryLoaded,
    recordRendererVendorEntryLoaded,
    rendererVendorEntryLoadedEventName,
    type RendererVendorEntryLoadedEventDetail,
    type RendererVendorChartDataRuntimePayload,
    type RendererVendorCoreRuntimePayload,
    type RendererVendorMapRuntimePayload,
} from "./rendererVendorShared.js";
import {
    getRendererVendorBundleLoaderRuntime,
    type RendererVendorBundleLoaderRuntime,
    type RendererVendorBundleLoaderTimerHandle,
} from "./vendorBundleLoaderRuntime.js";
import {
    isRendererVendorBundleEntry,
    rendererVendorBundleFileByEntry,
    type RendererVendorBundleEntry,
} from "./vendorBundleManifest.js";
import {
    isRegisteredChartRuntime,
    isRegisteredChartZoomPlugin,
    registerChartRuntime,
} from "../utils/charts/core/chartRuntime.js";
import {
    isDomPurifyRuntime,
    registerDomPurifyRuntime,
} from "../utils/dom/domPurifyRuntime.js";
import {
    isExportZipConstructor,
    registerExportZipRuntime,
} from "../utils/files/export/exportZipRuntime.js";
import {
    isRegisteredLeafletRuntime,
    registerLeafletRuntime,
} from "../utils/maps/core/leafletRuntime.js";
import {
    isArqueroRuntime,
    registerArqueroRuntime,
} from "../utils/rendering/helpers/arqueroRuntime.js";
import {
    isRegisteredDataTableRuntime,
    registerDataTableRuntime,
} from "../utils/rendering/core/dataTableRuntime.js";
import {
    isScreenfullRuntime,
    registerScreenfullRuntime,
} from "../utils/ui/controls/screenfullRuntime.js";

export type { RendererVendorBundleEntry } from "./vendorBundleManifest.js";

const inFlightLoads = new Map<RendererVendorBundleEntry, Promise<void>>();
const vendorEntryMarkerPollMs = 20;
const vendorEntryMarkerTimeoutMs = 5000;

export type RendererVendorBundleLoaderOptions = Readonly<{
    readonly runtime?: RendererVendorBundleLoaderRuntime | undefined;
}>;

function isRendererVendorBundleLoaded(
    entryName: RendererVendorBundleEntry
): boolean {
    return isRendererVendorEntryLoaded(entryName);
}

function registerRendererVendorRuntimePayload(
    detail: RendererVendorEntryLoadedEventDetail
): boolean {
    if (
        detail.entryName === "core" &&
        registerCoreRuntimePayload(detail.core)
    ) {
        recordRendererVendorEntryLoaded(detail.entryName);
        return true;
    }

    if (
        detail.entryName === "chart-data" &&
        registerChartDataRuntimePayload(detail.chartData)
    ) {
        recordRendererVendorEntryLoaded(detail.entryName);
        return true;
    }

    if (detail.entryName === "map" && registerMapRuntimePayload(detail.map)) {
        recordRendererVendorEntryLoaded(detail.entryName);
        return true;
    }

    return false;
}

function registerChartDataRuntimePayload(
    payload: RendererVendorChartDataRuntimePayload | undefined
): boolean {
    if (
        payload === undefined ||
        !isRegisteredChartRuntime(payload.chartRuntime) ||
        !isRegisteredChartZoomPlugin(payload.chartZoomPlugin) ||
        !isRegisteredDataTableRuntime(payload.dataTableRuntime)
    ) {
        return false;
    }

    registerChartRuntime(payload.chartRuntime, payload.chartZoomPlugin);
    registerDataTableRuntime(payload.dataTableRuntime);
    return true;
}

function registerCoreRuntimePayload(
    payload: RendererVendorCoreRuntimePayload | undefined
): boolean {
    if (
        payload === undefined ||
        !isArqueroRuntime(payload.arqueroRuntime) ||
        !isDomPurifyRuntime(payload.domPurifyRuntime) ||
        !isExportZipConstructor(payload.exportZipRuntime) ||
        !isScreenfullRuntime(payload.screenfullRuntime)
    ) {
        return false;
    }

    registerArqueroRuntime(payload.arqueroRuntime);
    registerDomPurifyRuntime(payload.domPurifyRuntime);
    registerExportZipRuntime(payload.exportZipRuntime);
    registerScreenfullRuntime(payload.screenfullRuntime);
    return true;
}

function registerMapRuntimePayload(
    payload: RendererVendorMapRuntimePayload | undefined
): boolean {
    if (
        payload === undefined ||
        !isRegisteredLeafletRuntime(payload.leafletRuntime)
    ) {
        return false;
    }

    registerLeafletRuntime(payload.leafletRuntime);
    return true;
}

function createVendorScriptUrl(entryName: RendererVendorBundleEntry): string {
    return new URL(rendererVendorBundleFileByEntry[entryName], import.meta.url)
        .href;
}

function waitForRendererVendorEntry(
    entryName: RendererVendorBundleEntry,
    runtime: RendererVendorBundleLoaderRuntime
): Promise<void> {
    if (isRendererVendorBundleLoaded(entryName)) {
        return Promise.resolve();
    }

    const startedAt = runtime.now();

    return new Promise<void>((resolve, reject) => {
        const eventController = runtime.createAbortController();
        let timeoutId: RendererVendorBundleLoaderTimerHandle | undefined;

        const clearPendingTimer = (): void => {
            if (timeoutId === undefined) {
                return;
            }
            runtime.clearTimeout(timeoutId);
            timeoutId = undefined;
        };
        const cleanup = (): void => {
            clearPendingTimer();
            eventController.abort();
            runtime.removeEventListener(
                rendererVendorEntryLoadedEventName,
                onEntryLoaded
            );
        };
        const scheduleCheck = (delayMs: number): void => {
            clearPendingTimer();
            timeoutId = runtime.setTimeout(checkEntryMarker, delayMs);
        };
        const isMatchingEntryEvent = (
            event: Event
        ): RendererVendorEntryLoadedEventDetail | undefined => {
            const detail =
                runtime.getCustomEventDetail<RendererVendorEntryLoadedEventDetail>(
                    event
                );
            return isRendererVendorBundleEntry(detail?.entryName) &&
                detail.entryName === entryName
                ? detail
                : undefined;
        };
        const onEntryLoaded = (event: Event): void => {
            const detail = isMatchingEntryEvent(event);
            if (detail === undefined) {
                return;
            }

            if (!registerRendererVendorRuntimePayload(detail)) {
                return;
            }
            cleanup();
            resolve();
        };
        const checkEntryMarker = (): void => {
            if (isRendererVendorBundleLoaded(entryName)) {
                cleanup();
                resolve();
                return;
            }

            if (runtime.now() - startedAt >= vendorEntryMarkerTimeoutMs) {
                cleanup();
                reject(
                    new Error(
                        `Renderer vendor bundle loaded without registering entry: ${entryName}`
                    )
                );
                return;
            }

            scheduleCheck(vendorEntryMarkerPollMs);
        };

        runtime.addEventListener(
            rendererVendorEntryLoadedEventName,
            onEntryLoaded,
            { signal: eventController.signal }
        );
        scheduleCheck(0);
    });
}

/**
 * Loads a split renderer vendor bundle once and waits until its runtime
 * adapters are registered.
 *
 * Main UI loads the core vendor entry during startup. Map and chart/data
 * vendors should call this from tab activation paths before touching Leaflet,
 * Chart.js, or other runtime-adapter dependencies.
 */
export async function ensureRendererVendorBundle(
    entryName: RendererVendorBundleEntry,
    options: RendererVendorBundleLoaderOptions = {}
): Promise<void> {
    if (isRendererVendorBundleLoaded(entryName)) {
        return;
    }
    const runtime = options.runtime ?? getRendererVendorBundleLoaderRuntime();

    const inFlightLoad = inFlightLoads.get(entryName);
    if (inFlightLoad) {
        return inFlightLoad;
    }

    const loadPromise = new Promise<void>((resolve, reject) => {
        const existingScript = runtime.getExistingVendorScript(entryName);
        const script =
            existingScript ??
            runtime.createVendorScript(
                entryName,
                createVendorScriptUrl(entryName)
            );
        const controller = runtime.createAbortController();
        const readinessPromise = waitForRendererVendorEntry(entryName, runtime);
        readinessPromise.catch(() => {});

        const cleanup = (): void => {
            controller.abort();
        };
        const onError = (): void => {
            cleanup();
            reject(
                new Error(
                    `Failed to load renderer vendor bundle: ${rendererVendorBundleFileByEntry[entryName]}`
                )
            );
        };
        const resolveAfterLoad = async (): Promise<void> => {
            try {
                await readinessPromise;
                resolve();
            } catch (error) {
                reject(
                    error instanceof Error ? error : new Error(String(error))
                );
            }
        };
        const onLoad = (): void => {
            cleanup();
            void resolveAfterLoad();
        };

        if (existingScript) {
            void resolveAfterLoad();
            return;
        }

        runtime.addScriptEventListener(script, "error", onError, {
            once: true,
            signal: controller.signal,
        });
        runtime.addScriptEventListener(script, "load", onLoad, {
            once: true,
            signal: controller.signal,
        });

        runtime.appendVendorScript(script);
    }).finally(() => {
        inFlightLoads.delete(entryName);
    });

    inFlightLoads.set(entryName, loadPromise);
    await loadPromise;
}
