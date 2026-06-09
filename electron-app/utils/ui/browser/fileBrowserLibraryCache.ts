/**
 * Module-owned session cache for decoded FIT library scans.
 */

export type FitBrowserLibraryCachePayload<TItem> = {
    items: TItem[];
    scannedAt: number;
};

const sessionLibraryCache = new Map<
    string,
    FitBrowserLibraryCachePayload<unknown>
>();

/**
 * Reads a cached library payload for a browser root.
 *
 * @param root - Absolute browser root path.
 *
 * @returns Cached payload for the root, when available.
 */
export function readFitBrowserLibraryCache<TItem>(
    root: string
): FitBrowserLibraryCachePayload<TItem> | null {
    return (
        (sessionLibraryCache.get(root) as
            | FitBrowserLibraryCachePayload<TItem>
            | undefined) ?? null
    );
}

/**
 * Writes a decoded library payload for a browser root.
 *
 * @param root - Absolute browser root path.
 * @param payload - Decoded library cache payload.
 */
export function writeFitBrowserLibraryCache<TItem>(
    root: string,
    payload: FitBrowserLibraryCachePayload<TItem>
): void {
    sessionLibraryCache.set(root, payload);
}

/**
 * Reset module state for isolated tests.
 */
export function resetFitBrowserLibraryCacheForTests(): void {
    sessionLibraryCache.clear();
}
