/**/**

 * @vitest-environment jsdom * @vitest-environment jsdom

 */ */



import { describe, it, expect, vi, beforeEach } from 'vitest';import { describe, it, expect, vi, beforeEach } from 'vitest';



// Mock dependencies

const mockShowNotification = vi.fn();

const mockShowChartSelectionModal = vi.fn();// Create mock functions// Mock dependencies

const mockWriteText = vi.fn().mockResolvedValue(undefined);

const mockShowNotification = vi.fn();const mockShowNotification = vi.fn();

vi.mock('../../../../utils/ui/notifications/showNotification.js', () => ({

    showNotification: mockShowNotificationconst mockShowChartSelectionModal = vi.fn();const mockShowChartSelectionModal = vi.fn();

}));

const mockWriteText = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../../utils/ui/components/createSettingsHeader.js', () => ({

    showChartSelectionModal: mockShowChartSelectionModalvi.mock('../../../../utils/ui/notifications/showNotification.js', () => ({

}));

// Set up mocks before importing the module    showNotification: mockShowNotification

// Mock clipboard

Object.defineProperty(global, 'navigator', {vi.mock('../../../../utils/ui/notifications/showNotification.js', () => ({}));

    value: {

        clipboard: {    showNotification: mockShowNotification

            writeText: mockWriteText

        }}));vi.mock('../../../../utils/ui/components/createSettingsHeader.js', () => ({

    },

    configurable: true    showChartSelectionModal: mockShowChartSelectionModal

});

vi.mock('../../../../utils/ui/components/createSettingsHeader.js', () => ({}));

describe('shareChartsAsURL with Imgur fallback', () => {

    beforeEach(() => {    showChartSelectionModal: mockShowChartSelectionModal

        vi.clearAllMocks();

        // Mock canvas context}));// Import the module after mocking

        HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({

            fillStyle: '',import { exportUtils } from '../../../../utils/files/export/exportUtils.js';

            fillRect: vi.fn(),

            clearRect: vi.fn(),// Mock clipboard

            getImageData: vi.fn(),

            putImageData: vi.fn(),Object.defineProperty(global, 'navigator', {describe('shareChartsAsURL with Imgur fallback', () => {

            createImageData: vi.fn(),

            setTransform: vi.fn(),    value: {    beforeEach(() => {

            drawImage: vi.fn(),

            save: vi.fn(),        clipboard: {        vi.clearAllMocks();

            restore: vi.fn(),

            beginPath: vi.fn(),            writeText: mockWriteText

            moveTo: vi.fn(),

            lineTo: vi.fn(),        }        // Mock clipboard API

            closePath: vi.fn(),

            stroke: vi.fn(),    },        Object.assign(navigator, {

            fill: vi.fn()

        });    configurable: true            clipboard: {



        HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mock');});                writeText: vi.fn().mockResolvedValue(undefined)

    });

            }

    it('should be a placeholder test', () => {

        expect(true).toBe(true);describe('shareChartsAsURL with Imgur fallback', () => {        });

    });

});    let shareChartsAsURL;

        // Mock canvas methods

    beforeEach(async () => {        HTMLCanvasElement.prototype.getContext = vi.fn(() => ({

        vi.clearAllMocks();            fillStyle: '',

        mockWriteText.mockResolvedValue(undefined);            fillRect: vi.fn(),

                    drawImage: vi.fn()

        // Dynamic import to ensure mocks are set up        }));

        const module = await import('../../../../utils/files/export/exportUtils.js');

        shareChartsAsURL = module.shareChartsAsURL;        HTMLCanvasElement.prototype.toDataURL = vi.fn(() =>

    });            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

        );

    it('should handle single chart sharing with Imgur fallback', async () => {    });

        const mockChartIds = ['chart1'];

        const mockCanvasData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';    it('should call showChartSelectionModal when shareChartsAsURL is invoked', async () => {

                // Arrange

        // Mock the chart selection modal to return success with canvas data        mockShowChartSelectionModal.mockImplementation((actionType, singleCallback, combinedCallback) => {

        mockShowChartSelectionModal.mockImplementation((options) => {            // We'll test that the function is called with correct parameters

            // Simulate user selecting a chart and the callback being called            expect(actionType).toBe('share URL');

            setTimeout(() => {            expect(typeof singleCallback).toBe('function');

                if (options.onSingleChartSuccess) {            expect(typeof combinedCallback).toBe('function');

                    options.onSingleChartSuccess(mockCanvasData);        });

                }

            }, 0);        // Act

        });        await exportUtils.shareChartsAsURL();



        await shareChartsAsURL(mockChartIds);        // Assert

        expect(mockShowChartSelectionModal).toHaveBeenCalledWith(

        expect(mockShowChartSelectionModal).toHaveBeenCalledWith(            'share URL',

            expect.objectContaining({            expect.any(Function),

                chartIds: mockChartIds,            expect.any(Function)

                onSingleChartSuccess: expect.any(Function),        );

                onCombinedChartsSuccess: expect.any(Function)    });

            })

        );    it('should handle Imgur client ID not configured error with data URL fallback', async () => {

        // Arrange

        // Wait for the async operations        const mockChart = {

        await new Promise(resolve => setTimeout(resolve, 10));            canvas: {

                width: 800,

        expect(mockWriteText).toHaveBeenCalledWith(mockCanvasData);                height: 400

        expect(mockShowNotification).toHaveBeenCalledWith(            }

            'Chart shared to clipboard as data URL (Imgur upload not configured)',        };

            'success'

        );        let singleCallback;

    });        mockShowChartSelectionModal.mockImplementation((actionType, single, combined) => {

            singleCallback = single;

    it('should handle combined charts sharing with Imgur fallback', async () => {        });

        const mockChartIds = ['chart1', 'chart2'];

        const mockCanvasData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';        // Act

                await exportUtils.shareChartsAsURL();

        // Mock the chart selection modal to return success with canvas data

        mockShowChartSelectionModal.mockImplementation((options) => {        // Now test the single callback with a chart

            // Simulate user selecting combined charts and the callback being called        await singleCallback(mockChart);

            setTimeout(() => {

                if (options.onCombinedChartsSuccess) {        // Assert

                    options.onCombinedChartsSuccess(mockCanvasData);        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(

                }            expect.stringContaining('data:image/png;base64,')

            }, 0);        );

        });

        expect(mockShowNotification).toHaveBeenCalledWith(

        await shareChartsAsURL(mockChartIds);            'Chart image copied to clipboard as data URL (Imgur not configured). You can paste this directly into email, chat, or documents.',

            'info'

        expect(mockShowChartSelectionModal).toHaveBeenCalledWith(        );

            expect.objectContaining({    });

                chartIds: mockChartIds,

                onSingleChartSuccess: expect.any(Function),    it('should handle combined charts with Imgur fallback', async () => {

                onCombinedChartsSuccess: expect.any(Function)        // Arrange

            })        const mockCharts = [

        );            { canvas: { width: 400, height: 300 } },

            { canvas: { width: 400, height: 300 } }

        // Wait for the async operations        ];

        await new Promise(resolve => setTimeout(resolve, 10));

        let combinedCallback;

        expect(mockWriteText).toHaveBeenCalledWith(mockCanvasData);        mockShowChartSelectionModal.mockImplementation((actionType, single, combined) => {

        expect(mockShowNotification).toHaveBeenCalledWith(            combinedCallback = combined;

            'Charts shared to clipboard as data URL (Imgur upload not configured)',        });

            'success'

        );        // Act

    });        await exportUtils.shareChartsAsURL();



    it('should handle empty chart array', async () => {        // Now test the combined callback with charts

        const mockChartIds = [];        await combinedCallback(mockCharts);



        await shareChartsAsURL(mockChartIds);        // Assert

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(

        expect(mockShowChartSelectionModal).toHaveBeenCalledWith(            expect.stringContaining('data:image/png;base64,')

            expect.objectContaining({        );

                chartIds: mockChartIds,

                onSingleChartSuccess: expect.any(Function),        expect(mockShowNotification).toHaveBeenCalledWith(

                onCombinedChartsSuccess: expect.any(Function)            'Combined charts image copied to clipboard as data URL (Imgur not configured). You can paste this directly into email, chat, or documents.',

            })            'info'

        );        );

    });

        // No clipboard operations should occur with empty array

        expect(mockWriteText).not.toHaveBeenCalled();    it('should handle empty charts array gracefully', async () => {

    });        // Arrange

        let combinedCallback;

    it('should handle clipboard API errors gracefully', async () => {        mockShowChartSelectionModal.mockImplementation((actionType, single, combined) => {

        const mockChartIds = ['chart1'];            combinedCallback = combined;

        const mockCanvasData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';        });



        // Mock clipboard to reject        // Act

        mockWriteText.mockRejectedValue(new Error('Clipboard access denied'));        await exportUtils.shareChartsAsURL();



        // Mock the chart selection modal to return success with canvas data        // Now test the combined callback with empty array

        mockShowChartSelectionModal.mockImplementation((options) => {        await combinedCallback([]);

            setTimeout(() => {

                if (options.onSingleChartSuccess) {        // Assert

                    options.onSingleChartSuccess(mockCanvasData);        expect(mockShowNotification).toHaveBeenCalledWith(

                }            'No charts available to share',

            }, 0);            'warning'

        });        );



        await shareChartsAsURL(mockChartIds);        expect(navigator.clipboard.writeText).not.toHaveBeenCalled();

    });

        // Wait for the async operations});
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(mockWriteText).toHaveBeenCalledWith(mockCanvasData);
        expect(mockShowNotification).toHaveBeenCalledWith(
            'Failed to copy to clipboard',
            'error'
        );
    });
});
