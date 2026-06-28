// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

const { mockRenderFileBrowserTab } = vi.hoisted(() => ({
    mockRenderFileBrowserTab:
        vi.fn<
            (options?: { electronApiScope?: unknown }) => Promise<void> | void
        >(),
}));

vi.mock(
    "../../../../../electron-app/utils/ui/browser/fileBrowserTab.js",
    () => ({
        renderFileBrowserTab: mockRenderFileBrowserTab,
    })
);

import { handleBrowserTab } from "../../../../../electron-app/utils/ui/tabs/tabStateManagerHandlers.js";

describe("tabStateManagerHandlers", () => {
    afterEach(() => {
        mockRenderFileBrowserTab.mockReset();
    });

    it("renders the Browser tab through the file browser module", async () => {
        expect.assertions(2);

        const electronApiScope = { getElectronAPI: () => ({}) };
        mockRenderFileBrowserTab.mockResolvedValue(undefined);

        await expect(
            handleBrowserTab(electronApiScope)
        ).resolves.toBeUndefined();

        expect(mockRenderFileBrowserTab).toHaveBeenCalledExactlyOnceWith({
            electronApiScope,
        });
    });

    it("propagates Browser tab render failures to tab readiness handling", async () => {
        expect.assertions(2);

        const renderError = new Error("browser render failed");
        mockRenderFileBrowserTab.mockRejectedValue(renderError);

        await expect(handleBrowserTab()).rejects.toBe(renderError);

        expect(mockRenderFileBrowserTab).toHaveBeenCalledOnce();
    });
});
