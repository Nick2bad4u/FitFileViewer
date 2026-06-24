import { describe, expect, it, vi } from "vitest";

import type { RendererElectronApiScope } from "../../../../../electron-app/utils/runtime/electronApiRuntime.js";

type FileSelectorElectronAPI = {
    openOverlayDialog?: () => Promise<string[]>;
    readFile?: (filePath: string) => Promise<ArrayBuffer>;
};

type NativeFileFacade = {
    arrayBuffer: () => Promise<ArrayBuffer>;
    name: string;
    originalPath: string;
    path: string;
};

type OverlayFilesLoader = (
    files: Array<File | NativeFileFacade>
) => Promise<void> | void;

const mocks = vi.hoisted(() => ({
    loadingHide: vi.fn<() => void>(),
    loadOverlayFiles: vi.fn<OverlayFilesLoader>(),
    showNotification: vi.fn<(message: string, type?: string) => void>(),
}));

vi.mock(
    import("../../../../../electron-app/utils/files/import/loadOverlayFiles.js"),
    () => ({
        loadOverlayFiles: mocks.loadOverlayFiles,
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/components/LoadingOverlay.js"),
    () => ({
        LoadingOverlay: {
            hide: mocks.loadingHide,
        },
    })
);

vi.mock(
    import("../../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: mocks.showNotification,
    })
);

const { openFileSelector } =
    await import("../../../../../electron-app/utils/files/import/openFileSelector.js");

function cleanupGlobals() {
    document.body.replaceChildren();
    vi.restoreAllMocks();
    vi.clearAllMocks();
}

function createElectronApiScope(
    api: FileSelectorElectronAPI
): RendererElectronApiScope {
    return {
        getElectronAPI: () => api,
    };
}

function getFirstNativeFileFacade(files: Array<File | NativeFileFacade>) {
    const firstFile = files[0];
    if (!firstFile || firstFile instanceof File) {
        throw new Error("Expected native file facade");
    }

    return firstFile;
}

describe(openFileSelector, () => {
    it("uses the native overlay dialog and builds readable file facades", async () => {
        expect.assertions(6);

        const filePath = String.raw`C:\rides\activity.fit`;
        const buffer = new ArrayBuffer(8);
        const openOverlayDialog = vi.fn<() => Promise<string[]>>(async () => [
            filePath,
            "",
        ]);
        const readFile = vi.fn<(path: string) => Promise<ArrayBuffer>>(
            async () => buffer
        );

        try {
            const electronApiScope = createElectronApiScope({
                openOverlayDialog,
                readFile,
            } satisfies FileSelectorElectronAPI);

            await openFileSelector({ electronApiScope });

            const files = mocks.loadOverlayFiles.mock.calls[0]?.[0] ?? [];
            const firstFile = getFirstNativeFileFacade(files);

            expect(openOverlayDialog).toHaveBeenCalledOnce();
            expect(mocks.loadOverlayFiles).toHaveBeenCalledOnce();
            expect(files).toHaveLength(1);
            expect(firstFile).toMatchObject({
                name: "activity.fit",
                originalPath: filePath,
                path: filePath,
            });
            await expect(firstFile.arrayBuffer()).resolves.toBe(buffer);
            expect(readFile).toHaveBeenCalledWith(filePath);
        } finally {
            cleanupGlobals();
        }
    });

    it("reports native dialog errors and hides the loading overlay", async () => {
        expect.assertions(4);

        const openOverlayDialog = vi.fn<() => Promise<string[]>>(async () => {
            throw new Error("dialog failed");
        });

        try {
            const electronApiScope = createElectronApiScope({
                openOverlayDialog,
            } satisfies FileSelectorElectronAPI);

            await openFileSelector({ electronApiScope });

            expect(mocks.loadOverlayFiles).not.toHaveBeenCalled();
            expect(mocks.showNotification).toHaveBeenCalledWith(
                "Failed to load FIT files",
                "error"
            );
            expect(mocks.loadingHide).toHaveBeenCalledOnce();
            expect(document.body.childElementCount).toBe(0);
        } finally {
            cleanupGlobals();
        }
    });

    it("uses the imported overlay loader for browser file input selections when native dialog is unavailable", async () => {
        expect.assertions(4);

        const file = new File([new Uint8Array([1])], "overlay.fit");
        const clickSpy = vi
            .spyOn(HTMLInputElement.prototype, "click")
            .mockImplementation(function selectFile(this: HTMLInputElement) {
                Object.defineProperty(this, "selectedFiles", {
                    configurable: true,
                    value: [file],
                });
                this.dispatchEvent(new Event("change"));
            });

        try {
            await openFileSelector();

            expect(clickSpy).toHaveBeenCalledOnce();
            expect(mocks.loadOverlayFiles).toHaveBeenCalledWith([file]);
            expect(mocks.loadingHide).toHaveBeenCalledOnce();
            expect(document.body.childElementCount).toBe(0);
        } finally {
            cleanupGlobals();
        }
    });
});
