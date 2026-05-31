import { describe, it, expect, vi } from "vitest";

vi.mock(
    import("../../../../../electron-app/utils/charts/theming/getThemeColors.js"),
    () => ({
        getThemeColors: () => ({ primary: "#000" }),
    })
);

describe("createAddFitFileToMapButton", () => {
    it("invokes openFileSelector on click and handles error by notifying", async () => {
        expect.hasAssertions();

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

        state.setState("globalData", { recordMesgs: [{}] });
        await vi.waitFor(() => {
            expect(btn.disabled).toBe(false);
        });

        btn.click();
        await vi.waitFor(() => {
            expect(openSpy).toHaveBeenCalledWith();
        });

        // Error path
        openSpy.mockRejectedValue(new Error("fail"));
        btn.click();
        await vi.waitFor(() => {
            expect(notifSpy).toHaveBeenCalledWith(
                "Failed to open file selector",
                "error"
            );
        });
    });
});
