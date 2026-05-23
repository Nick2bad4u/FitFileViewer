import { describe, expect, it, vi } from "vitest";

import { attachRecentFilesContextMenu } from "../../../utils/app/lifecycle/recentFilesContextMenu.js";

type AddRecentFile = (file: string) => Promise<void>;
type ApproveRecentFile = (file: string) => Promise<boolean>;
type ParseFitFile = (arrayBuffer: ArrayBuffer) => Promise<unknown>;
type ReadFile = (file: string) => Promise<ArrayBuffer>;
type RecentFiles = () => Promise<string[]>;
type SetLoading = (isLoading: boolean) => void;
type ShowFitData = (data: unknown, filePath: string) => void;
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
    showFitData: ReturnType<typeof vi.fn<ShowFitData>>;
    showNotification: ReturnType<typeof vi.fn<ShowNotification>>;
};

async function flushAsyncEvents(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
}

async function withRecentFilesHarness(
    runTest: (harness: Harness) => Promise<void>
): Promise<void> {
    const originalElectronAPI = globalThis.electronAPI;
    const originalShowFitData = globalThis.showFitData;
    const openFileBtn = document.createElement("button");

    document.body.append(openFileBtn);

    const harness: Harness = {
        addRecentFile: vi.fn<AddRecentFile>(),
        approveRecentFile: vi.fn<ApproveRecentFile>(),
        cleanup: () => {},
        openFileBtn,
        parseFitFile: vi.fn<ParseFitFile>(),
        readFile: vi.fn<ReadFile>(),
        recentFiles: vi.fn<RecentFiles>(),
        setLoading: vi.fn<SetLoading>(),
        showFitData: vi.fn<ShowFitData>(),
        showNotification: vi.fn<ShowNotification>(),
    };

    globalThis.electronAPI = {
        addRecentFile: harness.addRecentFile,
        approveRecentFile: harness.approveRecentFile,
        parseFitFile: harness.parseFitFile,
        readFile: harness.readFile,
        recentFiles: harness.recentFiles,
    } as typeof globalThis.electronAPI;
    globalThis.showFitData = harness.showFitData;

    harness.cleanup = attachRecentFilesContextMenu({
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
        globalThis.electronAPI = originalElectronAPI;
        globalThis.showFitData = originalShowFitData;
        vi.restoreAllMocks();
    }
}

describe(attachRecentFilesContextMenu, () => {
    it("reports wrapped parser error payloads without displaying them", async () => {
        expect.assertions(5);

        await withRecentFilesHarness(async (harness) => {
            harness.recentFiles.mockResolvedValue(["C:\\activities\\bad.fit"]);
            harness.approveRecentFile.mockResolvedValue(true);
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
            expect(harness.showFitData).not.toHaveBeenCalled();
            expect(harness.addRecentFile).not.toHaveBeenCalled();
            expect(harness.showNotification).toHaveBeenCalledWith(
                "Error: FIT decode failed\ninvalid CRC",
                "error"
            );
            expect(harness.setLoading).toHaveBeenLastCalledWith(false);
        });
    });
});
