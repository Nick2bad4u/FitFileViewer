import { describe, expect, it, vi } from "vitest";

const renderDecodedFitDataMock = vi.hoisted(() =>
    vi.fn<(data: unknown, filePath: string) => Promise<void>>(async () => {})
);

vi.mock(
    "../../../electron-app/utils/rendering/core/renderDecodedFitData.js",
    () => ({ renderDecodedFitData: renderDecodedFitDataMock })
);

import { attachRecentFilesContextMenu } from "../../../electron-app/utils/app/lifecycle/recentFilesContextMenu.js";
import type { RendererElectronApiScope } from "../../../electron-app/utils/runtime/electronApiRuntime.js";

type AddRecentFile = (file: string) => Promise<void>;
type ApproveRecentFile = (file: string) => Promise<boolean>;
type ParseFitFile = (arrayBuffer: ArrayBuffer) => Promise<unknown>;
type ReadFile = (file: string) => Promise<ArrayBuffer>;
type RecentFiles = () => Promise<string[]>;
type SetLoading = (isLoading: boolean) => void;
type ShowNotification = Parameters<
    typeof attachRecentFilesContextMenu
>[0]["showNotification"];

type Harness = {
    addRecentFile: ReturnType<typeof vi.fn<AddRecentFile>>;
    approveRecentFile: ReturnType<typeof vi.fn<ApproveRecentFile>>;
    cleanup: () => void;
    openFileBtn: HTMLButtonElement;
    parseFitFile: ReturnType<typeof vi.fn<ParseFitFile>>;
    readFile: ReturnType<typeof vi.fn<ReadFile>>;
    recentFiles: ReturnType<typeof vi.fn<RecentFiles>>;
    setLoading: ReturnType<typeof vi.fn<SetLoading>>;
    showNotification: ReturnType<typeof vi.fn<ShowNotification>>;
};

function createElectronApiScope(api: unknown): RendererElectronApiScope {
    return {
        getElectronAPI: () => api,
    };
}

async function flushAsyncEvents(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
}

async function withRecentFilesHarness(
    runTest: (harness: Harness) => Promise<void>
): Promise<void> {
    const openFileBtn = document.createElement("button");

    document.body.append(openFileBtn);
    renderDecodedFitDataMock.mockReset();
    renderDecodedFitDataMock.mockResolvedValue(undefined);

    const harness: Harness = {
        addRecentFile: vi.fn<AddRecentFile>(),
        approveRecentFile: vi.fn<ApproveRecentFile>(),
        cleanup: () => {},
        openFileBtn,
        parseFitFile: vi.fn<ParseFitFile>(),
        readFile: vi.fn<ReadFile>(),
        recentFiles: vi.fn<RecentFiles>(),
        setLoading: vi.fn<SetLoading>(),
        showNotification: vi.fn<ShowNotification>(),
    };

    const electronApiScope = createElectronApiScope({
        addRecentFile: harness.addRecentFile,
        approveRecentFile: harness.approveRecentFile,
        parseFitFile: harness.parseFitFile,
        readFile: harness.readFile,
        recentFiles: harness.recentFiles,
    });

    harness.cleanup = attachRecentFilesContextMenu({
        electronApiScope,
        openFileBtn,
        setLoading: harness.setLoading,
        showNotification: (...args) => {
            harness.showNotification(...args);
        },
    });

    try {
        await runTest(harness);
    } finally {
        harness.cleanup();
        document.querySelector("#recent-files-menu")?.remove();
        openFileBtn.remove();
        vi.restoreAllMocks();
    }
}

describe(attachRecentFilesContextMenu, () => {
    it("rejects malformed recent-file APIs without rendering a menu", async () => {
        expect.assertions(4);

        const openFileBtn = document.createElement("button");
        document.body.append(openFileBtn);
        const getElectronAPI = vi.fn<() => unknown>(() => ({
            parseFitFile: vi.fn<ParseFitFile>(),
            readFile: "read-file",
            recentFiles: vi.fn<RecentFiles>().mockResolvedValue([
                "C:\\activities\\activity.fit",
            ]),
        }));
        const setLoading = vi.fn<SetLoading>();
        const cleanup = attachRecentFilesContextMenu({
            electronApiScope: { getElectronAPI },
            openFileBtn,
            setLoading,
            showNotification: vi.fn<ShowNotification>(),
        });

        try {
            openFileBtn.dispatchEvent(
                new MouseEvent("contextmenu", {
                    bubbles: true,
                    cancelable: true,
                    clientX: 20,
                    clientY: 20,
                })
            );
            await flushAsyncEvents();

            expect(getElectronAPI).toHaveBeenCalledOnce();
            expect(document.querySelector("#recent-files-menu")).toBeNull();
            expect(openFileBtn.disabled).toBe(false);
            expect(setLoading).not.toHaveBeenCalled();
        } finally {
            cleanup();
            openFileBtn.remove();
            vi.restoreAllMocks();
        }
    });

    it("reports wrapped parser error payloads without displaying them", async () => {
        expect.assertions(6);

        await withRecentFilesHarness(async (harness) => {
            harness.recentFiles.mockResolvedValue(["C:\\activities\\bad.fit"]);
            harness.readFile.mockResolvedValue(new ArrayBuffer(16));
            harness.parseFitFile.mockResolvedValue({
                data: {
                    details: "invalid CRC",
                    error: "FIT decode failed",
                },
            });

            harness.openFileBtn.dispatchEvent(
                new MouseEvent("contextmenu", {
                    bubbles: true,
                    cancelable: true,
                    clientX: 20,
                    clientY: 20,
                })
            );
            await flushAsyncEvents();

            const menuItem = document.querySelector<HTMLDivElement>(
                "#recent-files-menu [role='menuitem']"
            );
            menuItem?.click();
            await flushAsyncEvents();

            expect(menuItem).toBeInstanceOf(HTMLDivElement);
            expect(harness.approveRecentFile).not.toHaveBeenCalled();
            expect(renderDecodedFitDataMock).not.toHaveBeenCalled();
            expect(harness.addRecentFile).not.toHaveBeenCalled();
            expect(harness.showNotification).toHaveBeenCalledWith(
                "Error: FIT decode failed\ninvalid CRC",
                "error"
            );
            expect(harness.setLoading).toHaveBeenLastCalledWith(false);
        });
    });
});
