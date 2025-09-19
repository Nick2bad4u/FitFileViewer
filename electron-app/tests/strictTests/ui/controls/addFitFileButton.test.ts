import { describe, it, expect, vi } from "vitest";

vi.mock("../../../../utils/charts/theming/getThemeColors.js", () => ({
    getThemeColors: () => ({ primary: "#000" }),
}));

describe("createAddFitFileToMapButton", () => {
    it("invokes openFileSelector on click and handles error by notifying", async () => {
        const notif = await import("../../../../utils/ui/notifications/showNotification.js");
        const notifSpy = vi.spyOn(notif, "showNotification").mockResolvedValue(void 0 as any);

        const files = await import("../../../../utils/files/import/openFileSelector.js");
        const openSpy = vi.spyOn(files, "openFileSelector").mockImplementation(() => {});

        const { createAddFitFileToMapButton } = await import(
            "../../../../utils/ui/controls/createAddFitFileToMapButton.js"
        );
        const btn = createAddFitFileToMapButton();
        expect(btn.tagName).toBe("BUTTON");
        btn.click();
        expect(openSpy).toHaveBeenCalled();

        // Error path
        openSpy.mockImplementation(() => {
            throw new Error("fail");
        });
        btn.click();
        expect(notifSpy).toHaveBeenCalled();
    });
});
