// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

const renderDecodedFitDataMock = vi.hoisted(() =>
    vi.fn<(data: unknown, filePath: string) => Promise<void>>(async () => {})
);

vi.mock(
    "../../../electron-app/utils/rendering/core/loadShowFitData.js",
    () => ({ renderDecodedFitData: renderDecodedFitDataMock })
);

import { getLifecycleListenerCleanup } from "../../../electron-app/utils/app/lifecycle/lifecycleListenerCleanupRegistry.js";
import { setupListeners } from "../../../electron-app/utils/app/lifecycle/listeners.js";
import type { SetupListenersOptions } from "../../../electron-app/utils/app/lifecycle/listeners.js";
import type { RendererElectronApiScope } from "../../../electron-app/utils/runtime/electronApiRuntime.js";

type AddRecentFile = (filePath: string) => Promise<void>;
type ApproveRecentFile = (filePath: string) => Promise<boolean>;
type HandleOpenFile = SetupListenersOptions["handleOpenFile"];
type OnMenuOpenFile = (callback: () => unknown) => undefined;
type OnOpenRecentFile = (
    callback: (filePath: string | string[]) => Promise<void> | void
) => undefined;
type OpenRecentHandler = Parameters<OnOpenRecentFile>[0];
type ParseFitFile = (arrayBuffer: ArrayBuffer) => Promise<unknown>;
type ReadFile = (filePath: string) => Promise<ArrayBuffer>;
type RecentFiles = () => Promise<string[]>;
type SetLoading = SetupListenersOptions["setLoading"];
type ShowAboutModal = SetupListenersOptions["showAboutModal"];
type ShowNotification = SetupListenersOptions["showNotification"];
type ShowUpdateNotification = SetupListenersOptions["showUpdateNotification"];

type Harness = {
    addRecentFile: ReturnType<typeof vi.fn<AddRecentFile>>;
    approveRecentFile: ReturnType<typeof vi.fn<ApproveRecentFile>>;
    cleanup: () => void;
    handleOpenFile: ReturnType<typeof vi.fn<HandleOpenFile>>;
    onMenuOpenFile: ReturnType<typeof vi.fn<OnMenuOpenFile>>;
    onOpenRecentFile: ReturnType<typeof vi.fn<OnOpenRecentFile>>;
    openFileBtn: HTMLButtonElement;
    openRecentHandler: OpenRecentHandler;
    parseFitFile: ReturnType<typeof vi.fn<ParseFitFile>>;
    readFile: ReturnType<typeof vi.fn<ReadFile>>;
    recentFiles: ReturnType<typeof vi.fn<RecentFiles>>;
    setLoading: ReturnType<typeof vi.fn<SetLoading>>;
    showAboutModal: ReturnType<typeof vi.fn<ShowAboutModal>>;
    showNotification: ReturnType<typeof vi.fn<ShowNotification>>;
    showUpdateNotification: ReturnType<typeof vi.fn<ShowUpdateNotification>>;
};

function createElectronApiScope(api: unknown): RendererElectronApiScope {
    return {
        getElectronAPI: () => api,
    };
}

function createHarness(): Harness {
    let openRecentHandler: OpenRecentHandler = async () => {};
    const openFileBtn = document.createElement("button");
    const onOpenRecentFile = vi.fn<OnOpenRecentFile>((callback) => {
        openRecentHandler = callback;
        return undefined;
    });

    return {
        addRecentFile: vi.fn<AddRecentFile>(),
        approveRecentFile: vi.fn<ApproveRecentFile>(),
        cleanup: () => {},
        handleOpenFile: vi.fn<HandleOpenFile>(),
        onMenuOpenFile: vi.fn<OnMenuOpenFile>(),
        onOpenRecentFile,
        openFileBtn,
        get openRecentHandler(): OpenRecentHandler {
            return openRecentHandler;
        },
        parseFitFile: vi.fn<ParseFitFile>(),
        readFile: vi.fn<ReadFile>(),
        recentFiles: vi.fn<RecentFiles>(),
        setLoading: vi.fn<SetLoading>(),
        showAboutModal: vi.fn<ShowAboutModal>(),
        showNotification: vi.fn<ShowNotification>(),
        showUpdateNotification: vi.fn<ShowUpdateNotification>(),
    };
}

async function withListenersHarness(
    runTest: (harness: Harness) => Promise<void>
): Promise<void> {
    const harness = createHarness();

    renderDecodedFitDataMock.mockReset();
    renderDecodedFitDataMock.mockResolvedValue(undefined);
    document.body.append(harness.openFileBtn);
    const electronApiScope = createElectronApiScope({
        addRecentFile: harness.addRecentFile,
        approveRecentFile: harness.approveRecentFile,
        onMenuOpenFile: harness.onMenuOpenFile,
        onOpenRecentFile: harness.onOpenRecentFile,
        parseFitFile: harness.parseFitFile,
        readFile: harness.readFile,
        recentFiles: harness.recentFiles,
    });

    setupListeners({
        electronApiScope,
        handleOpenFile: harness.handleOpenFile,
        isOpeningFileRef: { current: false },
        openFileBtn: harness.openFileBtn,
        setLoading: harness.setLoading,
        showAboutModal: harness.showAboutModal,
        showNotification: (...args) => {
            harness.showNotification(...args);
        },
        showUpdateNotification: harness.showUpdateNotification,
    });

    harness.cleanup =
        getLifecycleListenerCleanup(harness.openFileBtn) ?? (() => {});

    try {
        await runTest(harness);
    } finally {
        harness.cleanup();
        harness.openFileBtn.remove();
        vi.restoreAllMocks();
    }
}

describe(setupListeners, () => {
    it("reports wrapped open-recent parser errors without displaying them", async () => {
        expect.assertions(6);

        await withListenersHarness(async (harness) => {
            harness.readFile.mockResolvedValue(new ArrayBuffer(16));
            harness.parseFitFile.mockResolvedValue({
                data: {
                    details: "invalid CRC",
                    error: "FIT decode failed",
                },
            });

            await harness.openRecentHandler("C:\\activities\\bad.fit");

            expect(harness.approveRecentFile).not.toHaveBeenCalled();
            expect(renderDecodedFitDataMock).not.toHaveBeenCalled();
            expect(harness.addRecentFile).not.toHaveBeenCalled();
            expect(harness.showNotification).toHaveBeenCalledWith(
                "Error: FIT decode failed\ninvalid CRC",
                "error"
            );
            expect({ disabled: harness.openFileBtn.disabled }).toStrictEqual({
                disabled: false,
            });
            expect(harness.setLoading).toHaveBeenLastCalledWith(false);
        });
    });
});
