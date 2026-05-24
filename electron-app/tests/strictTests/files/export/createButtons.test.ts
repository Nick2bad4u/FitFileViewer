import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type GpxTestGlobal = typeof globalThis & {
    globalData?: {
        recordMesgs?: {
            positionLat?: number;
            positionLong?: number;
        }[];
    };
};

const gpxGlobal = globalThis as GpxTestGlobal;

function ensureObjectUrlApi(): void {
    if (typeof URL.createObjectURL !== "function") {
        Object.defineProperty(URL, "createObjectURL", {
            configurable: true,
            value: () => "blob:url",
        });
    }

    if (typeof URL.revokeObjectURL !== "function") {
        Object.defineProperty(URL, "revokeObjectURL", {
            configurable: true,
            value: () => undefined,
        });
    }
}

vi.mock("../../../../utils/charts/theming/getThemeColors.js", () => ({
    getThemeColors: () => ({
        primary: "#000",
        primaryAlpha: "#111",
        surface: "#fff",
    }),
}));
vi.mock("../../../../utils/ui/notifications/showNotification.js", () => ({
    showNotification: vi.fn(),
}));

describe("export/print buttons", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = "";
        delete gpxGlobal.globalData;
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        delete gpxGlobal.globalData;
    });

    it("createPrintButton returns a button and handles click errors gracefully", async () => {
        const { createPrintButton } =
            await import("../../../../utils/files/export/createPrintButton.js");
        const btn = createPrintButton();
        expect(btn.tagName).toBe("BUTTON");
        expect(btn.textContent).toBe("Print");
        expect(btn.getAttribute("aria-label")).toBe("Print or export map");

        const origPrint = window.print;
        const show =
            await import("../../../../utils/ui/notifications/showNotification.js");
        const showSpy = vi.mocked(show.showNotification);
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => undefined);
        showSpy.mockResolvedValue(undefined);
        window.print = vi.fn(() => {
            throw new Error("print failed");
        });

        try {
            btn.click();
            expect(showSpy).toHaveBeenCalledWith(
                "Print failed. Please try again.",
                "error"
            );
            expect(errorSpy).toHaveBeenCalledWith(
                "[MapActions] Print failed:",
                expect.any(Error)
            );
        } finally {
            window.print = origPrint;
        }
    });

    it("createExportGPXButton notifies and skips download when recordMesgs are missing", async () => {
        ensureObjectUrlApi();
        const { createExportGPXButton } =
            await import("../../../../utils/files/export/createExportGPXButton.js");
        const notif =
            await import("../../../../utils/ui/notifications/showNotification.js");
        const showSpy = vi.mocked(notif.showNotification);
        const create = vi.spyOn(URL, "createObjectURL");
        const clickSpy = vi
            .spyOn(HTMLAnchorElement.prototype, "click")
            .mockImplementation(() => undefined);
        showSpy.mockResolvedValue(undefined);

        const btn = createExportGPXButton();
        btn.click();

        expect(showSpy).toHaveBeenCalledWith(
            "No data available for GPX export.",
            "info",
            3000
        );
        expect(create).not.toHaveBeenCalled();
        expect(clickSpy).not.toHaveBeenCalled();
        expect(document.querySelectorAll("a[download]")).toHaveLength(0);
    });

    it("createExportGPXButton builds and triggers a download when recordMesgs exist", async () => {
        vi.useFakeTimers();
        ensureObjectUrlApi();
        const { createExportGPXButton } =
            await import("../../../../utils/files/export/createExportGPXButton.js");
        const revoke = vi
            .spyOn(URL, "revokeObjectURL")
            .mockImplementation(() => undefined);
        const create = vi
            .spyOn(URL, "createObjectURL")
            .mockReturnValue("blob:url");
        gpxGlobal.globalData = {
            recordMesgs: [
                { positionLat: 0, positionLong: 0 },
                { positionLat: 1073741824, positionLong: -1073741824 },
            ],
        };
        const btn = createExportGPXButton();
        const clickSpy = vi
            .spyOn(HTMLAnchorElement.prototype, "click")
            .mockImplementation(() => void 0);

        btn.click();
        expect(create).toHaveBeenCalledWith(expect.any(Blob));
        expect(clickSpy).toHaveBeenCalled();
        expect(clickSpy.mock.contexts).toHaveLength(1);
        const clickedAnchor = clickSpy.mock.contexts[0] as HTMLAnchorElement;
        expect(clickedAnchor.download).toBe("Exported_Track.gpx");
        expect(clickedAnchor.href).toBe("blob:url");
        expect(clickedAnchor.isConnected).toBe(true);

        vi.runAllTimers();
        expect(revoke).toHaveBeenCalledWith("blob:url");
        expect(clickedAnchor.isConnected).toBe(false);
    });
});
