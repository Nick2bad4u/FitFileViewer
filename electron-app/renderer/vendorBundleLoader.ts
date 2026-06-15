import {
    isRendererVendorEntryLoaded,
    recordRendererVendorEntryLoaded,
    rendererVendorEntryLoadedEventName,
    type RendererVendorEntryLoadedEventDetail,
} from "./rendererVendorShared.js";
import {
    getRendererVendorBundleLoaderRuntime,
    type RendererVendorBundleLoaderTimerHandle,
} from "./vendorBundleLoaderRuntime.js";
import {
    isRendererVendorBundleEntry,
    rendererVendorBundleFileByEntry,
    type RendererVendorBundleEntry,
} from "./vendorBundleManifest.js";
import { setChartRuntime } from "../utils/charts/core/chartRuntime.js";
import { setDomPurifyRuntime } from "../utils/dom/domPurifyRuntime.js";
import { setExportZipRuntime } from "../utils/files/export/exportZipRuntime.js";
import { setLeafletRuntime } from "../utils/maps/core/leafletRuntime.js";
import { setArqueroRuntime } from "../utils/rendering/helpers/arqueroRuntime.js";
import { setDataTableRuntime } from "../utils/rendering/core/dataTableRuntime.js";
import { setScreenfullRuntime } from "../utils/ui/controls/screenfullRuntime.js";

export type { RendererVendorBundleEntry } from "./vendorBundleManifest.js";

const inFlightLoads = new Map<RendererVendorBundleEntry, Promise<void>>();
const vendorEntryMarkerPollMs = 20;
const vendorEntryMarkerTimeoutMs = 5000;
const vendorBundleLoaderRuntime = getRendererVendorBundleLoaderRuntime();

function isRendererVendorBundleLoaded(
    entryName: RendererVendorBundleEntry
): boolean {
    return isRendererVendorEntryLoaded(entryName);
}

function registerRendererVendorRuntimePayload(
    detail: RendererVendorEntryLoadedEventDetail
): void {
    recordRendererVendorEntryLoaded(detail.entryName);

    if (detail.entryName === "core" && detail.core) {
        setArqueroRuntime(detail.core.arqueroRuntime);
        setDomPurifyRuntime(detail.core.domPurifyRuntime);
        setExportZipRuntime(detail.core.exportZipRuntime);
        setScreenfullRuntime(detail.core.screenfullRuntime);
        return;
    }

    if (detail.entryName !== "chart-data" || !detail.chartData) {
        if (detail.entryName === "map" && detail.map) {
            setLeafletRuntime(detail.map.leafletRuntime);
        }

        return;
    }

    setChartRuntime(
        detail.chartData.chartRuntime,
        detail.chartData.chartZoomPlugin
    );
    setDataTableRuntime(detail.chartData.dataTableRuntime);
}

function createVendorScriptUrl(entryName: RendererVendorBundleEntry): string {
    return new URL(rendererVendorBundleFileByEntry[entryName], import.meta.url)
        .href;
}

function waitForRendererVendorEntry(
    entryName: RendererVendorBundleEntry
): Promise<void> {
    if (isRendererVendorBundleLoaded(entryName)) {
        return Promise.resolve();
    }

    const startedAt = vendorBundleLoaderRuntime.now();

    return new Promise<void>((resolve, reject) => {
        const eventController =
            vendorBundleLoaderRuntime.createAbortController();
        let timeoutId: RendererVendorBundleLoaderTimerHandle | undefined;

        const clearPendingTimer = (): void => {
            if (timeoutId === undefined) {
                return;
            }
            vendorBundleLoaderRuntime.clearTimeout(timeoutId);
            timeoutId = undefined;
        };
        const cleanup = (): void => {
            clearPendingTimer();
            eventController.abort();
            vendorBundleLoaderRuntime.removeEventListener(
                rendererVendorEntryLoadedEventName,
                onEntryLoaded
            );
        };
        const scheduleCheck = (delayMs: number): void => {
            clearPendingTimer();
            timeoutId = vendorBundleLoaderRuntime.setTimeout(
                checkEntryMarker,
                delayMs
            );
        };
        const isMatchingEntryEvent = (
            event: Event
        ): event is CustomEvent<RendererVendorEntryLoadedEventDetail> =>
            event instanceof CustomEvent &&
            isRendererVendorBundleEntry(event.detail?.entryName) &&
            event.detail?.entryName === entryName;
        const onEntryLoaded = (event: Event): void => {
            if (!isMatchingEntryEvent(event)) {
                return;
            }

            registerRendererVendorRuntimePayload(event.detail);
            cleanup();
            resolve();
        };
        const checkEntryMarker = (): void => {
            if (isRendererVendorBundleLoaded(entryName)) {
                cleanup();
                resolve();
                return;
            }

            if (
                vendorBundleLoaderRuntime.now() - startedAt >=
                vendorEntryMarkerTimeoutMs
            ) {
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

        vendorBundleLoaderRuntime.addEventListener(
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
    entryName: RendererVendorBundleEntry
): Promise<void> {
    if (isRendererVendorBundleLoaded(entryName)) {
        return;
    }

    const inFlightLoad = inFlightLoads.get(entryName);
    if (inFlightLoad) {
        return inFlightLoad;
    }

    const loadPromise = new Promise<void>((resolve, reject) => {
        const existingScript =
            vendorBundleLoaderRuntime.getExistingVendorScript(entryName);
        const script =
            existingScript ??
            vendorBundleLoaderRuntime.createVendorScript(
                entryName,
                createVendorScriptUrl(entryName)
            );
        const controller = vendorBundleLoaderRuntime.createAbortController();
        const readinessPromise = waitForRendererVendorEntry(entryName);
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

        vendorBundleLoaderRuntime.addScriptEventListener(
            script,
            "error",
            onError,
            {
                once: true,
                signal: controller.signal,
            }
        );
        vendorBundleLoaderRuntime.addScriptEventListener(
            script,
            "load",
            onLoad,
            {
                once: true,
                signal: controller.signal,
            }
        );

        vendorBundleLoaderRuntime.appendVendorScript(script);
    }).finally(() => {
        inFlightLoads.delete(entryName);
    });

    inFlightLoads.set(entryName, loadPromise);
    await loadPromise;
}
