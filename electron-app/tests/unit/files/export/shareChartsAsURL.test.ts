/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("../../../../utils/ui/notifications/showNotification.js", () => ({
    showNotification: vi.fn(),
}));

vi.mock("../../../../utils/ui/components/createSettingsHeader.js", () => ({
    showChartSelectionModal: vi.fn(),
}));

// Mock clipboard API
Object.defineProperty(global, "navigator", {
    value: {
        clipboard: {
            writeText: vi.fn().mockResolvedValue(undefined),
        },
    },
    configurable: true,
});

// Import the module after mocking
import { exportUtils } from "../../../../utils/files/export/exportUtils.js";
import { showNotification } from "../../../../utils/ui/notifications/showNotification.js";
import { showChartSelectionModal } from "../../../../utils/ui/components/createSettingsHeader.js";

describe("shareChartsAsURL with Imgur fallback", () => {
    // Get typed references to the mocked functions
    const mockShowNotification = vi.mocked(showNotification);
    const mockShowChartSelectionModal = vi.mocked(showChartSelectionModal);
    const mockWriteText = vi.mocked(navigator.clipboard.writeText);

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock the getImgurConfig method to return default config
        vi.spyOn(exportUtils, "getImgurConfig").mockReturnValue({
            clientId: "0046ee9e30ac578",
            uploadUrl: "https://api.imgur.com/3/image",
        });

        // Mock canvas methods
        HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
            fillStyle: "",
            fillRect: vi.fn(),
            drawImage: vi.fn(),
            clearRect: vi.fn(),
            getImageData: vi.fn(),
            putImageData: vi.fn(),
            createImageData: vi.fn(),
            setTransform: vi.fn(),
            save: vi.fn(),
            restore: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            closePath: vi.fn(),
            stroke: vi.fn(),
            fill: vi.fn(),
        })) as any;

        HTMLCanvasElement.prototype.toDataURL = vi.fn(
            () =>
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        );
    });

    it("should call showChartSelectionModal when shareChartsAsURL is invoked", async () => {
        // Arrange
        mockShowChartSelectionModal.mockImplementation(
            (actionType: any, singleCallback: any, combinedCallback: any) => {
                // We'll test that the function is called with correct parameters
                expect(actionType).toBe("share URL");
                expect(typeof singleCallback).toBe("function");
                expect(typeof combinedCallback).toBe("function");
            }
        );

        // Act
        await exportUtils.shareChartsAsURL();

        // Assert
        expect(mockShowChartSelectionModal).toHaveBeenCalledWith(
            "share URL",
            expect.any(Function),
            expect.any(Function)
        );
    });

    it("should handle Imgur client ID not configured error with data URL fallback", async () => {
        // Arrange
        const mockChart = {
            canvas: {
                width: 800,
                height: 400,
            },
        };

        // Mock getImgurConfig to return unconfigured client ID to trigger fallback
        vi.spyOn(exportUtils, "getImgurConfig").mockReturnValue({
            clientId: "YOUR_IMGUR_CLIENT_ID",
            uploadUrl: "https://api.imgur.com/3/image",
        });

        let singleCallback: any;
        mockShowChartSelectionModal.mockImplementation((actionType: any, single: any, combined: any) => {
            singleCallback = single;
        });

        // Act
        await exportUtils.shareChartsAsURL();

        // Now test the single callback with a chart
        if (singleCallback) {
            await singleCallback(mockChart);
        }

        // Assert
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining("data:image/png;base64,"));

        expect(mockShowNotification).toHaveBeenCalledWith(
            "Chart image copied to clipboard as data URL (Imgur not configured).",
            "info"
        );
    });

    it("should handle combined charts with Imgur fallback", async () => {
        // Arrange
        const mockCharts = [{ canvas: { width: 400, height: 300 } }, { canvas: { width: 400, height: 300 } }];

        // Mock getImgurConfig to return unconfigured client ID to trigger fallback
        vi.spyOn(exportUtils, "getImgurConfig").mockReturnValue({
            clientId: "YOUR_IMGUR_CLIENT_ID",
            uploadUrl: "https://api.imgur.com/3/image",
        });

        let combinedCallback: any;
        mockShowChartSelectionModal.mockImplementation((actionType: any, single: any, combined: any) => {
            combinedCallback = combined;
        });

        // Act
        await exportUtils.shareChartsAsURL();

        // Now test the combined callback with charts
        if (combinedCallback) {
            await combinedCallback(mockCharts);
        }

        // Assert
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining("data:image/png;base64,"));

        expect(mockShowNotification).toHaveBeenCalledWith(
            "Combined charts image copied to clipboard as data URL (Imgur not configured).",
            "info"
        );
    });

    it("should handle empty charts array gracefully", async () => {
        // Arrange
        let combinedCallback: any;
        mockShowChartSelectionModal.mockImplementation((actionType: any, single: any, combined: any) => {
            combinedCallback = combined;
        });

        // Act
        await exportUtils.shareChartsAsURL();

        // Now test the combined callback with empty array
        if (combinedCallback) {
            await combinedCallback([]);
        }

        // Assert
        expect(mockShowNotification).toHaveBeenCalledWith("No charts available to share", "warning");

        expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });

    it("should handle clipboard API errors gracefully", async () => {
        // Arrange
        const mockChart = {
            canvas: {
                width: 800,
                height: 400,
            },
        };

        // Mock clipboard to reject
        mockWriteText.mockRejectedValue(new Error("Clipboard access denied"));

        let singleCallback: any;
        mockShowChartSelectionModal.mockImplementation((actionType: any, single: any, combined: any) => {
            singleCallback = single;
        });

        // Act
        await exportUtils.shareChartsAsURL();

        // Now test the single callback
        if (singleCallback) {
            await singleCallback(mockChart);
        }

        // Assert
        // Clipboard permissions are often denied in Electron/file contexts; sharing should still complete.
        expect(mockShowNotification).toHaveBeenCalledWith(
            "Chart uploaded to Imgur! (Clipboard copy blocked)",
            "warning"
        );
    });
});
