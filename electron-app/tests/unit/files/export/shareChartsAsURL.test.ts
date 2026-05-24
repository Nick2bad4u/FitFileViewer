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
    const createPngDataUrl = (width: number, height: number) =>
        `data:image/png;base64,${btoa(`canvas:${width}x${height}`)}`;
    const getLastClipboardText = () => {
        const [clipboardText] = mockWriteText.mock.lastCall ?? [];
        if (typeof clipboardText !== "string") {
            throw new TypeError("Expected clipboard text to be written");
        }
        return clipboardText;
    };
    const captureShareCallbacks = async () => {
        let singleCallback: any;
        let combinedCallback: any;
        mockShowChartSelectionModal.mockImplementation(
            (actionType: any, single: any, combined: any) => {
                singleCallback = single;
                combinedCallback = combined;
            }
        );

        await exportUtils.shareChartsAsURL();

        if (
            typeof singleCallback !== "function" ||
            typeof combinedCallback !== "function"
        ) {
            throw new TypeError("Expected chart sharing callbacks");
        }
        return { combinedCallback, singleCallback };
    };

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
        document.body.replaceChildren();
        mockWriteText.mockResolvedValue(undefined);

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

        HTMLCanvasElement.prototype.toDataURL = vi.fn(function (
            this: HTMLCanvasElement
        ) {
            return createPngDataUrl(this.width, this.height);
        });
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

        // Act
        const { singleCallback } = await captureShareCallbacks();
        const result = await singleCallback(mockChart);

        // Assert
        expect(result).toBeUndefined();
        expect(getLastClipboardText()).toBe(createPngDataUrl(800, 400));
        expect(document.body.querySelector("textarea")).toBeNull();

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
            expect.stringContaining("data:image/png;base64,")
        );

        expect(mockShowNotification).toHaveBeenCalledWith(
            "Chart image copied to clipboard as data URL (Imgur not configured).",
            "info"
        );
    });

    it("should handle combined charts with Imgur fallback", async () => {
        // Arrange
        const mockCharts = [
            { canvas: { width: 400, height: 300 } },
            { canvas: { width: 400, height: 300 } },
        ];

        // Mock getImgurConfig to return unconfigured client ID to trigger fallback
        vi.spyOn(exportUtils, "getImgurConfig").mockReturnValue({
            clientId: "YOUR_IMGUR_CLIENT_ID",
            uploadUrl: "https://api.imgur.com/3/image",
        });

        // Act
        const { combinedCallback } = await captureShareCallbacks();
        const result = await combinedCallback(mockCharts);

        // Assert
        expect(result).toBeUndefined();
        expect(getLastClipboardText()).toBe(createPngDataUrl(1620, 400));
        expect(document.body.querySelector("textarea")).toBeNull();

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
            expect.stringContaining("data:image/png;base64,")
        );

        expect(mockShowNotification).toHaveBeenCalledWith(
            "Combined charts image copied to clipboard as data URL (Imgur not configured).",
            "info"
        );
    });

    it("should handle empty charts array gracefully", async () => {
        // Act
        const { combinedCallback } = await captureShareCallbacks();
        const result = await combinedCallback([]);

        // Assert
        expect(result).toBeUndefined();
        expect(document.body.childElementCount).toBe(0);

        expect(mockShowNotification).toHaveBeenCalledWith(
            "No charts available to share",
            "warning"
        );

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
        vi.spyOn(exportUtils, "uploadToImgur").mockResolvedValue(
            "https://i.imgur.com/chart.png"
        );

        // Act
        const { singleCallback } = await captureShareCallbacks();
        const result = await singleCallback(mockChart);

        // Assert
        expect(result).toBeUndefined();
        expect(getLastClipboardText()).toBe("https://i.imgur.com/chart.png");

        // Clipboard permissions are often denied in Electron/file contexts; sharing should still complete.
        expect(mockShowNotification).toHaveBeenCalledWith(
            "Chart uploaded to Imgur! (Clipboard copy blocked)",
            "warning"
        );
    });
});
