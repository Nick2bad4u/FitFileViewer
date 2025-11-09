import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../../utils/charts/theming/getThemeColors.js", () => ({
    getThemeColors: () => ({ primary: "#000", primaryAlpha: "#111", surface: "#fff" }),
}));
vi.mock("../../../../utils/ui/notifications/showNotification.js", () => ({
    showNotification: vi.fn(),
}));

describe("export/print buttons", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
    });

    it("createPrintButton returns a button and handles click errors gracefully", async () => {
        const { createPrintButton } = await import("../../../../utils/files/export/createPrintButton.js");
        const btn = createPrintButton();
        expect(btn.tagName).toBe("BUTTON");

        // Simulate print throwing to exercise error path
        const origPrint = window.print;
        const show = await import("../../../../utils/ui/notifications/showNotification.js");
        const showSpy = vi.spyOn(show, "showNotification").mockResolvedValue(void 0 as unknown as void);
        // @ts-ignore
        window.print = vi.fn(() => {
            throw new Error("print failed");
        });
        btn.click();
        expect(showSpy).toHaveBeenCalled();
        window.print = origPrint;
    });

    it("createExportGPXButton builds and triggers a download when recordMesgs exist", async () => {
        vi.useFakeTimers();
        const { createExportGPXButton } = await import("../../../../utils/files/export/createExportGPXButton.js");
        if (!(URL as any).revokeObjectURL) (URL as any).revokeObjectURL = () => {};
        if (!(URL as any).createObjectURL) (URL as any).createObjectURL = () => "blob:url";
        const revoke = vi.spyOn(URL, "revokeObjectURL");
        const create = vi.spyOn(URL, "createObjectURL");
        (window as any).globalData = {
            recordMesgs: [
                { positionLat: 0, positionLong: 0 },
                { positionLat: 1073741824, positionLong: -1073741824 },
            ],
        };
        const btn = createExportGPXButton();
        const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => void 0);
        // Click should generate object URL and click anchor
        btn.click();
        expect(create).toHaveBeenCalled();
        expect(clickSpy).toHaveBeenCalled();
        // Fast-forward revoke timeout
        vi.runAllTimers();
        expect(revoke).toHaveBeenCalled();
        expect(revoke.mock.calls[0][0]).toMatch(/^blob:/);
        vi.useRealTimers();
    });
});
