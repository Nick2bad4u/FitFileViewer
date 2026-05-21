import { describe, expect, it, vi } from "vitest";

import { showNotification } from "../../../../../utils/ui/notifications/showNotification.js";
import { createExportGPXButton } from "../../../../../utils/files/export/createExportGPXButton.js";

vi.mock(
    import("../../../../../utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification:
            vi.fn<(message: string, type: string, duration?: number) => void>(),
    })
);

type GpxExportTestGlobal = typeof globalThis & {
    globalData?: {
        recordMesgs?: {
            enhancedAltitude?: number;
            positionLat?: number;
            positionLong?: number;
            timestamp?: string;
        }[];
    };
    loadedFitFiles?: {
        displayName?: string;
        filePath?: string;
        name?: string;
    }[];
};

const appGlobal = globalThis as GpxExportTestGlobal;
const showNotificationMock = vi.mocked(showNotification);

function cleanupTestGlobals(): void {
    delete appGlobal.globalData;
    delete appGlobal.loadedFitFiles;
    document.body.replaceChildren();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
}

describe(createExportGPXButton, () => {
    it("notifies when no record data is available", () => {
        expect.assertions(4);

        try {
            const button = createExportGPXButton();

            expect(button.textContent).toContain("Export GPX");
            expect(showNotificationMock).not.toHaveBeenCalled();

            button.click();

            expect(showNotificationMock).toHaveBeenCalledWith(
                "No data available for GPX export.",
                "info",
                3000
            );
            expect(document.querySelector("a[download]")).toBeNull();
        } finally {
            cleanupTestGlobals();
        }
    });

    it("creates a GPX blob download for valid track data", async () => {
        expect.assertions(6);

        try {
            vi.useFakeTimers();
            const clickSpy = vi
                .spyOn(HTMLAnchorElement.prototype, "click")
                .mockImplementation(() => {});
            const createObjectURL = vi.fn<(object: Blob) => string>(
                () => "blob:track"
            );
            const revokeObjectURL = vi.fn<(url: string) => void>();
            vi.stubGlobal("URL", {
                createObjectURL,
                revokeObjectURL,
            });
            appGlobal.globalData = {
                recordMesgs: [
                    {
                        enhancedAltitude: 10,
                        positionLat: 536_870_912,
                        positionLong: -1_073_741_824,
                        timestamp: "2026-05-20T12:00:00.000Z",
                    },
                ],
            };
            appGlobal.loadedFitFiles = [{ displayName: "Morning Ride" }];
            const button = createExportGPXButton();

            button.click();

            const [[blob]] = createObjectURL.mock.calls as [[Blob]];
            const link = document.querySelector(
                "a[download='Morning_Ride.gpx']"
            );

            await expect(blob.text()).resolves.toContain("<gpx ");
            expect(link).toBeInstanceOf(HTMLAnchorElement);
            expect(clickSpy).toHaveBeenCalledOnce();
            expect(link?.getAttribute("href")).toBe("blob:track");

            vi.runAllTimers();

            expect(revokeObjectURL).toHaveBeenCalledWith("blob:track");
            expect(document.querySelector("a[download]")).toBeNull();
        } finally {
            cleanupTestGlobals();
        }
    });
});
