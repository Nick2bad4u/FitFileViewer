import {
    isRendererVendorEntryLoaded,
    rendererVendorEntryLoadedEventName,
    type RendererVendorEntryLoadedEventDetail,
} from "./vendorGlobalsShared.js";
import {
    isRendererVendorBundleEntry,
    rendererVendorBundleFileByEntry,
    type RendererVendorBundleEntry,
} from "./vendorBundleManifest.js";

export type { RendererVendorBundleEntry } from "./vendorBundleManifest.js";

const inFlightLoads = new Map<RendererVendorBundleEntry, Promise<void>>();
const vendorEntryMarkerPollMs = 20;
const vendorEntryMarkerTimeoutMs = 5000;

function isRendererVendorBundleLoaded(
    entryName: RendererVendorBundleEntry
): boolean {
    return isRendererVendorEntryLoaded(entryName);
}

function createVendorScriptUrl(entryName: RendererVendorBundleEntry): string {
    return new URL(
        rendererVendorBundleFileByEntry[entryName],
        import.meta.url
    ).href;
}

function waitForRendererVendorEntry(
    entryName: RendererVendorBundleEntry
): Promise<void> {
    if (isRendererVendorBundleLoaded(entryName)) {
        return Promise.resolve();
    }

    const startedAt = Date.now();

    return new Promise<void>((resolve, reject) => {
        const eventController = new AbortController();
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        const clearPendingTimer = (): void => {
            if (timeoutId === undefined) {
                return;
            }
            clearTimeout(timeoutId);
            timeoutId = undefined;
        };
        const cleanup = (): void => {
            clearPendingTimer();
            eventController.abort();
            globalThis.removeEventListener(
                rendererVendorEntryLoadedEventName,
                onEntryLoaded
            );
        };
        const scheduleCheck = (delayMs: number): void => {
            clearPendingTimer();
            timeoutId = setTimeout(checkEntryMarker, delayMs);
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

            cleanup();
            resolve();
        };
        const checkEntryMarker = (): void => {
            if (isRendererVendorBundleLoaded(entryName)) {
                cleanup();
                resolve();
                return;
            }

            if (Date.now() - startedAt >= vendorEntryMarkerTimeoutMs) {
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

        globalThis.addEventListener(
            rendererVendorEntryLoadedEventName,
            onEntryLoaded,
            { signal: eventController.signal }
        );
        scheduleCheck(0);
    });
}

function getExistingVendorScript(
    entryName: RendererVendorBundleEntry
): HTMLScriptElement | null {
    const selector = `script[data-ffv-renderer-vendor-entry="${entryName}"]`;
    const existing = document.querySelector(selector);
    return existing instanceof HTMLScriptElement ? existing : null;
}

function createVendorScript(
    entryName: RendererVendorBundleEntry
): HTMLScriptElement {
    const script = document.createElement("script");
    script.dataset["ffvRendererVendorEntry"] = entryName;
    script.defer = true;
    script.src = createVendorScriptUrl(entryName);
    script.type = "module";
    return script;
}

/**
 * Loads a split renderer vendor bundle once and waits until its runtime
 * adapters are registered.
 *
 * The index shell keeps only the small core vendor entry eager. Map and
 * chart/data vendors should call this from tab activation paths before touching
 * Leaflet, Chart.js, or other runtime-adapter dependencies.
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
        const existingScript = getExistingVendorScript(entryName);
        const script = existingScript ?? createVendorScript(entryName);
        const controller = new AbortController();

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
                await waitForRendererVendorEntry(entryName);
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

        script.addEventListener("error", onError, {
            once: true,
            signal: controller.signal,
        });
        script.addEventListener("load", onLoad, {
            once: true,
            signal: controller.signal,
        });

        document.head.append(script);
    }).finally(() => {
        inFlightLoads.delete(entryName);
    });

    inFlightLoads.set(entryName, loadPromise);
    await loadPromise;
}
