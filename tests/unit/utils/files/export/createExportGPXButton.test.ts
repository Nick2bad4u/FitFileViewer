import { beforeEach, describe, expect, it, vi } from "vitest";

import { createExportGPXButton } from "../../../../../electron-app/utils/files/export/createExportGPXButton.js";
import { setActiveFitRawData } from "../../../../../electron-app/utils/state/domain/activeFitRawDataState.js";
import {
    __resetStateManagerForTests,
    setState,
} from "../../../../../electron-app/utils/state/core/stateManager.js";

const showNotificationMock = vi.hoisted(() =>
    vi.fn<(message: string, type: string, duration?: number) => void>()
);

vi.mock(
    import("../../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: showNotificationMock,
    })
);

function cleanupTestGlobals(): void {
    __resetStateManagerForTests();
    localStorage.clear();
    sessionStorage.clear();
    setActiveFitRawData(null);
    document.body.replaceChildren();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
}

function queryRequiredAnchor(selector: string): HTMLAnchorElement {
    const link = document.querySelector(selector);

    if (!(link instanceof HTMLAnchorElement)) {
        throw new TypeError(`Expected ${selector} anchor to exist`);
    }

    return link;
}

describe(createExportGPXButton, () => {
    beforeEach(() => {
        cleanupTestGlobals();
        showNotificationMock.mockClear();
    });

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
            setActiveFitRawData({
                loadedFitFiles: [{ displayName: "Morning Ride" }],
                recordMesgs: [
                    {
                        enhancedAltitude: 10,
                        positionLat: 536_870_912,
                        positionLong: -1_073_741_824,
                        timestamp: "2026-05-20T12:00:00.000Z",
                    },
                ],
            });
            const button = createExportGPXButton();

            button.click();

            const [[blob]] = createObjectURL.mock.calls as [[Blob]];
            const link = queryRequiredAnchor("a[download='Morning_Ride.gpx']");

            await expect(blob.text()).resolves.toContain("<gpx ");
            expect(link).toBeInstanceOf(HTMLAnchorElement);
            expect(clickSpy).toHaveBeenCalledOnce();
            expect(link.getAttribute("href")).toBe("blob:track");

            vi.runAllTimers();

            expect(revokeObjectURL).toHaveBeenCalledWith("blob:track");
            expect(document.querySelector("a[download]")).toBeNull();
        } finally {
            cleanupTestGlobals();
        }
    });

    it("uses route-ready data from the explicit FIT raw-data state", async () => {
        expect.assertions(2);

        try {
            vi.stubGlobal("URL", {
                createObjectURL: vi.fn(() => "blob:track"),
                revokeObjectURL: vi.fn(),
            });
            vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
                () => {}
            );
            setState(
                "fitFile.rawData",
                {
                    recordMesgs: [
                        {
                            position_lat: 536_870_912,
                            position_long: -1_073_741_824,
                        },
                    ],
                },
                { source: "test" }
            );
            const button = createExportGPXButton();

            button.click();

            const [[blob]] = vi.mocked(URL.createObjectURL).mock.calls as [
                [Blob],
            ];

            await expect(blob.text()).resolves.toContain(
                '<trkpt lat="45.0000000" lon="-90.0000000">'
            );
            expect(showNotificationMock).not.toHaveBeenCalled();
        } finally {
            cleanupTestGlobals();
        }
    });

    it("uses active current-file metadata when loaded-file names are unavailable", async () => {
        expect.assertions(3);

        try {
            const clickSpy = vi
                .spyOn(HTMLAnchorElement.prototype, "click")
                .mockImplementation(() => {});
            vi.stubGlobal("URL", {
                createObjectURL: vi.fn(() => "blob:track"),
                revokeObjectURL: vi.fn(),
            });
            setState("fitFile.currentFile", "C:/rides/current-activity.fit", {
                source: "test",
            });
            setActiveFitRawData({
                cachedFilePath: "stale-cache.fit",
                recordMesgs: [
                    {
                        enhancedAltitude: 10,
                        positionLat: 536_870_912,
                        positionLong: -1_073_741_824,
                        timestamp: "2026-05-20T12:00:00.000Z",
                    },
                ],
            });
            const button = createExportGPXButton();

            button.click();

            const link = queryRequiredAnchor(
                "a[download='current-activity.gpx']"
            );
            const [[blob]] = vi.mocked(URL.createObjectURL).mock.calls as [
                [Blob],
            ];

            expect(link).toBeInstanceOf(HTMLAnchorElement);
            expect(clickSpy).toHaveBeenCalledOnce();
            await expect(blob.text()).resolves.toContain(
                "<name>current-activity</name>"
            );
        } finally {
            cleanupTestGlobals();
        }
    });

    it("filters loaded-file metadata from raw route data before naming downloads", async () => {
        expect.assertions(2);

        try {
            vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
                () => {}
            );
            vi.stubGlobal("URL", {
                createObjectURL: vi.fn(() => "blob:track"),
                revokeObjectURL: vi.fn(),
            });
            setActiveFitRawData({
                loadedFitFiles: [
                    null,
                    { displayName: 42 },
                    { name: "Filtered FIT Activity" },
                ],
                recordMesgs: [
                    {
                        positionLat: 536_870_912,
                        positionLong: -1_073_741_824,
                    },
                ],
            });
            const button = createExportGPXButton();

            button.click();

            const link = queryRequiredAnchor(
                "a[download='Filtered_FIT_Activity.gpx']"
            );
            const [[blob]] = vi.mocked(URL.createObjectURL).mock.calls as [
                [Blob],
            ];

            expect(link).toBeInstanceOf(HTMLAnchorElement);
            await expect(blob.text()).resolves.toContain(
                "<name>Filtered FIT Activity</name>"
            );
        } finally {
            cleanupTestGlobals();
        }
    });
});
