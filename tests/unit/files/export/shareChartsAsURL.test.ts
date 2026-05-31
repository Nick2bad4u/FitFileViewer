// @vitest-environment jsdom

import type { ExportableChart } from "../../../../electron-app/utils/files/export/exportUtils.js";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock(
    import("../../../../electron-app/utils/ui/notifications/showNotification.js"),
    () => ({
        showNotification: vi.fn<(message: string, type: string) => void>(),
    })
);

vi.mock(
    import("../../../../electron-app/utils/ui/components/createSettingsHeader.js"),
    () => ({
        showChartSelectionModal:
            vi.fn<
                (
                    actionType: string,
                    singleCallback: ShareSingleChartCallback,
                    combinedCallback: ShareCombinedChartsCallback
                ) => void
            >(),
    })
);

type ShareSingleChartCallback = (chart: ExportableChart) => Promise<void>;
type ShareCombinedChartsCallback = (charts: ExportableChart[]) => Promise<void>;
type CanvasContextStub = Pick<
    CanvasRenderingContext2D,
    | "beginPath"
    | "clearRect"
    | "closePath"
    | "createImageData"
    | "drawImage"
    | "fill"
    | "fillRect"
    | "fillStyle"
    | "getImageData"
    | "lineTo"
    | "moveTo"
    | "putImageData"
    | "restore"
    | "save"
    | "setTransform"
    | "stroke"
>;

function createMockChart(width: number, height: number): ExportableChart {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return { canvas };
}

// Mock clipboard API
Object.defineProperty(global, "navigator", {
    value: {
        clipboard: {
            writeText: vi
                .fn<(text: string) => Promise<void>>()
                .mockResolvedValue(undefined),
        },
    },
    configurable: true,
});

// Import the module after mocking
import { exportUtils } from "../../../../electron-app/utils/files/export/exportUtils.js";
import { showNotification } from "../../../../electron-app/utils/ui/notifications/showNotification.js";
import { showChartSelectionModal } from "../../../../electron-app/utils/ui/components/createSettingsHeader.js";

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
    const captureShareCallbacks = async (): Promise<{
        combinedCallback: ShareCombinedChartsCallback;
        singleCallback: ShareSingleChartCallback;
    }> => {
        let singleCallback: ShareSingleChartCallback | undefined;
        let combinedCallback: ShareCombinedChartsCallback | undefined;
        mockShowChartSelectionModal.mockImplementation(
            (
                _actionType,
                single: ShareSingleChartCallback,
                combined: ShareCombinedChartsCallback
            ) => {
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
        const canvasContextStub: CanvasContextStub = {
            fillStyle: "",
            fillRect: vi.fn<CanvasRenderingContext2D["fillRect"]>(),
            drawImage: vi.fn<CanvasRenderingContext2D["drawImage"]>(),
            clearRect: vi.fn<CanvasRenderingContext2D["clearRect"]>(),
            getImageData: vi.fn<CanvasRenderingContext2D["getImageData"]>(),
            putImageData: vi.fn<CanvasRenderingContext2D["putImageData"]>(),
            createImageData:
                vi.fn<CanvasRenderingContext2D["createImageData"]>(),
            setTransform: vi.fn<CanvasRenderingContext2D["setTransform"]>(),
            save: vi.fn<CanvasRenderingContext2D["save"]>(),
            restore: vi.fn<CanvasRenderingContext2D["restore"]>(),
            beginPath: vi.fn<CanvasRenderingContext2D["beginPath"]>(),
            moveTo: vi.fn<CanvasRenderingContext2D["moveTo"]>(),
            lineTo: vi.fn<CanvasRenderingContext2D["lineTo"]>(),
            closePath: vi.fn<CanvasRenderingContext2D["closePath"]>(),
            stroke: vi.fn<CanvasRenderingContext2D["stroke"]>(),
            fill: vi.fn<CanvasRenderingContext2D["fill"]>(),
        };
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
            canvasContextStub as CanvasRenderingContext2D
        );

        vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockImplementation(
            function (this: HTMLCanvasElement) {
                return createPngDataUrl(this.width, this.height);
            }
        );
    });

    it("should call showChartSelectionModal when shareChartsAsURL is invoked", async () => {
        expect.assertions(4);

        // Arrange
        mockShowChartSelectionModal.mockImplementation(
            (actionType, singleCallback, combinedCallback) => {
                // We'll test that the function is called with correct parameters
                expect(actionType).toBe("share URL");
                expect(singleCallback).toBeTypeOf("function");
                expect(combinedCallback).toBeTypeOf("function");
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
        expect.assertions(5);

        // Arrange
        const mockChart = createMockChart(800, 400);

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
        expect.assertions(5);

        // Arrange
        const mockCharts = [
            createMockChart(400, 300),
            createMockChart(400, 300),
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
        expect.assertions(4);

        // Act
        const { combinedCallback } = await captureShareCallbacks();
        const result = await combinedCallback([]);

        // Assert
        expect(result).toBeUndefined();
        expect({
            clipboardWrites: mockWriteText.mock.calls.length,
            documentChildren: document.body.childElementCount,
        }).toEqual({
            clipboardWrites: 0,
            documentChildren: 0,
        });

        expect(mockShowNotification).toHaveBeenCalledWith(
            "No charts available to share",
            "warning"
        );

        expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });

    it("should handle clipboard API errors gracefully", async () => {
        expect.assertions(3);

        // Arrange
        const mockChart = createMockChart(800, 400);

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
