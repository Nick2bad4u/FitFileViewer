import { describe, expect, it, vi } from "vitest";

type OverlayFitData = {
    cachedFilePath?: string;
    fileName?: string;
    recordMesgs?: unknown[];
    [key: string]: unknown;
};

type OverlayInputFile = {
    name?: string;
    path?: string;
};

type LoadedFitFileEntry = {
    data: OverlayFitData;
    filePath: string;
    originalPath: string | null;
    sourceKey: string | null;
};

type LoadOverlayTestGlobal = typeof globalThis & {
    globalData?: OverlayFitData | null;
    loadedFitFiles?: LoadedFitFileEntry[];
};

type LoadSingleOverlayResult = {
    data?: OverlayFitData;
    error?: string;
    success: boolean;
};

type LimitTask = () => Promise<void>;

type LimitFactory = (concurrency: number) => (task: LimitTask) => Promise<void>;

const mocks = vi.hoisted(() => ({
    loadingHide: vi.fn<() => void>(),
    loadingShow: vi.fn<(message: string, detail?: string) => void>(),
    loadSingleOverlayFile:
        vi.fn<(file: OverlayInputFile) => Promise<LoadSingleOverlayResult>>(),
    pLimitCompat: vi.fn<LimitFactory>((_concurrency) => async (task) => task()),
    renderMap: vi.fn<() => void>(),
    setState:
        vi.fn<(path: string, value: unknown, options?: unknown) => void>(),
    showNotification: vi.fn<(message: string, type?: string) => void>(),
    updateShownFilesList: vi.fn<() => void>(),
}));

vi.mock(
    import("../../../../../electron-app/utils/async/pLimitCompat.js"),
    () => ({
        default: mocks.pLimitCompat,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/state/core/stateManager.js"),
    () => ({
        setState: mocks.setState,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/rendering/components/shownFilesListUpdater.js"),
    () => ({
        updateShownFilesList: mocks.updateShownFilesList,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/components/LoadingOverlay.js"),
    () => ({
        LoadingOverlay: {
            hide: mocks.loadingHide,
            show: mocks.loadingShow,
        },
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: mocks.showNotification,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/files/import/loadSingleOverlayFile.js"),
    () => ({
        loadSingleOverlayFile: mocks.loadSingleOverlayFile,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/maps/core/renderMap.js"),
    () => ({
        renderMap: mocks.renderMap,
    })
);

const { loadOverlayFiles } =
    await import("../../../../../electron-app/utils/files/import/loadOverlayFiles.js");

const appGlobal = globalThis as LoadOverlayTestGlobal;

function cleanupGlobals() {
    delete appGlobal.globalData;
    delete appGlobal.loadedFitFiles;
    document.body.replaceChildren();
    vi.clearAllMocks();
}

describe(loadOverlayFiles, () => {
    it("initializes primary data, appends loaded overlays, and syncs state", async () => {
        expect.assertions(9);

        const primaryData = {
            cachedFilePath: String.raw`C:\rides\primary.fit`,
            recordMesgs: [],
        };
        const overlayData = {
            cachedFilePath: String.raw`C:\rides\overlay.fit`,
            recordMesgs: [{ positionLat: 1, positionLong: 2 }],
        };
        const file = {
            name: "overlay.fit",
            path: String.raw`C:\rides\overlay.fit`,
        };

        try {
            appGlobal.globalData = primaryData;
            mocks.loadSingleOverlayFile.mockResolvedValue({
                data: overlayData,
                success: true,
            });

            await loadOverlayFiles([file]);

            expect(appGlobal.loadedFitFiles).toStrictEqual([
                {
                    data: primaryData,
                    filePath: "primary.fit",
                    originalPath: String.raw`C:\rides\primary.fit`,
                    sourceKey: "path:c:/rides/primary.fit",
                },
                {
                    data: overlayData,
                    filePath: "overlay.fit",
                    originalPath: String.raw`C:\rides\overlay.fit`,
                    sourceKey: "path:c:/rides/overlay.fit",
                },
            ]);
            expect(
                mocks.pLimitCompat.mock.calls[0]?.[0]
            ).toBeGreaterThanOrEqual(1);
            expect(mocks.loadSingleOverlayFile).toHaveBeenCalledWith(file);
            expect(mocks.setState).toHaveBeenCalledWith(
                "globalData.loadedFitFiles",
                appGlobal.loadedFitFiles,
                { source: "loadOverlayFiles" }
            );
            expect(mocks.renderMap).toHaveBeenCalledOnce();
            expect(mocks.updateShownFilesList).toHaveBeenCalledOnce();
            expect(mocks.loadingHide).toHaveBeenCalledOnce();
            expect(mocks.showNotification).toHaveBeenCalledWith(
                "Successfully loaded 1 files",
                "success"
            );
            expect(overlayData.cachedFilePath).toBe(
                String.raw`C:\rides\overlay.fit`
            );
        } finally {
            cleanupGlobals();
        }
    });

    it("skips duplicate overlay paths before decoding", async () => {
        expect.assertions(5);

        const existingData = {
            cachedFilePath: String.raw`C:\rides\overlay.fit`,
            recordMesgs: [],
        };
        const existingEntries = [
            {
                data: existingData,
                filePath: "overlay.fit",
                originalPath: String.raw`C:\rides\overlay.fit`,
                sourceKey: "path:c:/rides/overlay.fit",
            },
        ];
        const file = {
            name: "overlay.fit",
            path: String.raw`C:\rides\overlay.fit`,
        };

        try {
            appGlobal.loadedFitFiles = existingEntries;

            await loadOverlayFiles([file]);

            expect(appGlobal.loadedFitFiles).toStrictEqual(existingEntries);
            expect(mocks.loadSingleOverlayFile).not.toHaveBeenCalled();
            expect(mocks.setState).not.toHaveBeenCalled();
            expect(mocks.loadingHide).toHaveBeenCalledOnce();
            expect(mocks.showNotification).toHaveBeenCalledWith(
                "overlay.fit already loaded. Skipping duplicate files.",
                "info"
            );
        } finally {
            cleanupGlobals();
        }
    });

    it("reports failed overlays and still hides the loading overlay", async () => {
        expect.assertions(5);

        const file = {
            name: "bad.fit",
            path: String.raw`C:\rides\bad.fit`,
        };

        try {
            mocks.loadSingleOverlayFile.mockResolvedValue({
                error: "bad",
                success: false,
            });

            await loadOverlayFiles([file]);

            expect(appGlobal.loadedFitFiles).toStrictEqual([]);
            expect(mocks.loadSingleOverlayFile).toHaveBeenCalledWith(file);
            expect(mocks.loadingHide).toHaveBeenCalledOnce();
            expect(mocks.showNotification).toHaveBeenCalledWith(
                "Failed to load bad.fit: bad",
                "error"
            );
            expect(mocks.showNotification).toHaveBeenCalledWith(
                "Failed to load any of the 1 files.",
                "error"
            );
        } finally {
            cleanupGlobals();
        }
    });
});
