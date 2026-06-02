import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type GpxTestGlobal = typeof globalThis & {
    globalData?: {
        recordMesgs?: {
            positionLat?: number;
            positionLong?: number;
        }[];
    };
};
type NotificationFn = (
    message: string,
    type?: string,
    duration?: number
) => Promise<undefined>;

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

function getRequiredButtonLabel(button: HTMLButtonElement): HTMLSpanElement {
    const label = button.querySelector("span");
    expect(label).toBeInstanceOf(HTMLSpanElement);
    return label as HTMLSpanElement;
}

function getRequiredButtonIcon(button: HTMLButtonElement): SVGSVGElement {
    const icon = button.querySelector("svg.icon");
    expect(icon).toBeInstanceOf(SVGSVGElement);
    return icon as SVGSVGElement;
}

function getRequiredDownloadAnchor(context: unknown): HTMLAnchorElement {
    expect(context).toBeInstanceOf(HTMLAnchorElement);
    return context as HTMLAnchorElement;
}

vi.mock(
    import("../../../../../electron-app/utils/charts/theming/getThemeColors.js"),
    () => ({
        getThemeColors: () => ({
            primary: "#000",
            primaryAlpha: "#111",
            surface: "#fff",
        }),
    })
);
vi.mock(
    import("../../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: vi.fn<NotificationFn>(),
    })
);

describe("export/print buttons", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        document.body.replaceChildren();
        delete gpxGlobal.globalData;
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        delete gpxGlobal.globalData;
    });

    it("createPrintButton returns a button and handles click errors gracefully", async () => {
        expect.assertions(10);

        const { createPrintButton } =
            await import("../../../../../electron-app/utils/files/export/createPrintButton.js");
        const btn = createPrintButton();
        expect(btn.tagName).toBe("BUTTON");
        expect(btn.classList.contains("map-action-btn")).toBe(true);
        expect(btn.classList.contains("print-button")).toBe(true);
        expect(getRequiredButtonIcon(btn).getAttribute("viewBox")).toBe(
            "0 0 20 20"
        );
        expect(getRequiredButtonLabel(btn).textContent).toBe("Print");
        expect(btn.getAttribute("aria-label")).toBe("Print or export map");

        const show =
            await import("../../../../../electron-app/utils/ui/notifications/showNotification.js");
        const showSpy = vi.mocked(show.showNotification);
        const errorSpy = vi.spyOn(console, "error").mockReturnValue(undefined);
        showSpy.mockResolvedValue(undefined);
        vi.spyOn(window, "print").mockImplementation(() => {
            throw new Error("print failed");
        });

        btn.click();
        expect(showSpy).toHaveBeenCalledWith(
            "Print failed. Please try again.",
            "error"
        );
        expect(errorSpy).toHaveBeenCalledWith(
            "[MapActions] Print failed:",
            expect.any(Error)
        );
    });

    it("createExportGPXButton notifies and skips download when recordMesgs are missing", async () => {
        expect.assertions(4);

        ensureObjectUrlApi();
        const { createExportGPXButton } =
            await import("../../../../../electron-app/utils/files/export/createExportGPXButton.js");
        const notif =
            await import("../../../../../electron-app/utils/ui/notifications/showNotification.js");
        const showSpy = vi.mocked(notif.showNotification);
        const create = vi.spyOn(URL, "createObjectURL");
        const clickSpy = vi
            .spyOn(HTMLAnchorElement.prototype, "click")
            .mockReturnValue(undefined);
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
        expect.assertions(14);

        vi.useFakeTimers();
        ensureObjectUrlApi();
        const { createExportGPXButton } =
            await import("../../../../../electron-app/utils/files/export/createExportGPXButton.js");
        const revoke = vi
            .spyOn(URL, "revokeObjectURL")
            .mockReturnValue(undefined);
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
        expect(btn.classList.contains("map-action-btn")).toBe(true);
        expect(getRequiredButtonIcon(btn).getAttribute("viewBox")).toBe(
            "0 0 20 20"
        );
        expect(getRequiredButtonLabel(btn).textContent).toBe("Export GPX");
        const clickSpy = vi
            .spyOn(HTMLAnchorElement.prototype, "click")
            .mockReturnValue(undefined);

        btn.click();
        expect(create).toHaveBeenCalledWith(expect.any(Blob));
        expect(clickSpy).toHaveBeenCalledWith();
        expect(clickSpy.mock.contexts).toHaveLength(1);
        const clickedAnchor = getRequiredDownloadAnchor(
            clickSpy.mock.contexts[0]
        );
        expect(clickedAnchor.download).toBe("Exported_Track.gpx");
        expect(clickedAnchor.href).toBe("blob:url");
        expect(clickedAnchor.isConnected).toBe(true);

        vi.runAllTimers();
        expect(revoke).toHaveBeenCalledWith("blob:url");
        expect(clickedAnchor.isConnected).toBe(false);
    });
});
