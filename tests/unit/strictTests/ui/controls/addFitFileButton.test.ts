import { describe, it, expect, vi } from "vitest";

vi.mock(
    import("../../../../../electron-app/utils/charts/theming/getThemeColors.js"),
    () => ({
        getThemeColors: () => ({ primary: "#000" }),
    })
);

describe("createAddFitFileToMapButton", () => {
    it("invokes openFileSelector on click and handles error by notifying", async () => {
        expect.assertions(5);

        const notif =
            await import("../../../../../electron-app/utils/ui/notifications/showNotification.js");
        const notifSpy = vi
            .spyOn(notif, "showNotification")
            .mockResolvedValue(undefined);

        const files =
            await import("../../../../../electron-app/utils/files/import/openFileSelector.js");
        const openSpy = vi
            .spyOn(files, "openFileSelector")
            .mockResolvedValue(undefined);

        const state =
            await import("../../../../../electron-app/utils/state/core/stateManager.js");

        const { createAddFitFileToMapButton } =
            await import("../../../../../electron-app/utils/ui/controls/createAddFitFileToMapButton.js");
        const btn = createAddFitFileToMapButton();
        expect(btn.tagName).toBe("BUTTON");
        expect(btn.disabled).toBe(true);

        state.setState("fitFile.rawData", {
            recordMesgs: [{ positionLat: 1, positionLong: 2 }],
        });
        await vi.waitFor(() => {
            if (btn.disabled) {
                throw new Error("Expected button to become enabled");
            }
        });
        expect(btn.disabled).toBe(false);

        btn.click();
        await vi.waitFor(() => {
            if (openSpy.mock.calls.length === 0) {
                throw new Error("Expected openFileSelector to be called");
            }
        });
        expect(openSpy).toHaveBeenCalledWith();

        // Error path
        openSpy.mockRejectedValue(new Error("fail"));
        btn.click();
        await vi.waitFor(() => {
            if (notifSpy.mock.calls.length === 0) {
                throw new Error("Expected error notification");
            }
        });
        expect(notifSpy).toHaveBeenCalledWith(
            "Failed to open file selector",
            "error"
        );
    });
});
