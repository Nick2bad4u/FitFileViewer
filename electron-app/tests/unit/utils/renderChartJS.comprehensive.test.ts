/**
 * @fileoverview Comprehensive test suite for renderChartJS.js utility functions
 * @description Tests core chart rendering utilities to improve coverage from 0% to high coverage.
 *
 * This test focuses on testing individual utility functions first, then building up to more complex operations.
 *
 * TARGET: renderChartJS.js has 1,499 lines with 0% coverage - highest impact opportunity
 * GOAL: Achieve high statement, function, and branch coverage for this critical file
 */

import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';

// Create persistent storage for mock data
const globalMockState = {
    data: new Map<string, any>(),
    subscriptions: new Map<string, any>()
};

// Mock state management at the top level - essential for any renderChartJS testing
vi.mock('../../../utils/state/core/stateManager.js', () => ({
    getState: vi.fn((path: string) => {
        // Split path and navigate nested object
        const keys = path.split('.');
        let current = Object.fromEntries(globalMockState.data);
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return undefined;
            }
        }
        return current;
    }),
    setState: vi.fn((path: string, value: any) => {
        globalMockState.data.set(path, value);
        // Trigger any subscriptions for this path
        const subscription = globalMockState.subscriptions.get(path);
        if (subscription) {
            subscription(value);
        }
    }),
    updateState: vi.fn((path: string, value: any) => {
        const currentValue = globalMockState.data.get(path) || {};
        const newValue = { ...currentValue, ...value };
        globalMockState.data.set(path, newValue);
    }),
    subscribe: vi.fn((path: string, callback: any) => {
        globalMockState.subscriptions.set(path, callback);
        return () => globalMockState.subscriptions.delete(path);
    })
}));

// Mock all the complex dependencies to isolate renderChartJS functions
vi.mock('../../../utils/app/lifecycle/appActions.js', () => ({
    AppActions: {
        notifyChartRenderComplete: vi.fn(),
        setInitialized: vi.fn(),
        setFileOpening: vi.fn(),
        loadFile: vi.fn(),
        switchTab: vi.fn(),
        clearData: vi.fn()
    }
}));

vi.mock('../../../utils/ui/notifications/showNotification.js', () => ({
    showNotification: vi.fn()
}));

vi.mock('../../../utils/charts/theming/chartThemeUtils.js', () => ({
    detectCurrentTheme: vi.fn(() => 'light')
}));

// Mock DOM and Chart.js dependencies
Object.defineProperty(window, 'Chart', {
    value: {
        register: vi.fn(),
        Zoom: {},
        registry: {}
    },
    writable: true
});

// Import the functions we want to test
import {
    hexToRgba,
    updatePreviousChartState,
    resetChartNotificationState,
    refreshChartsIfNeeded,
    getChartStatus,
    previousChartState,
    chartState,
    chartActions
} from '../../../utils/charts/core/renderChartJS.js';

describe('renderChartJS.js - Comprehensive Utility Function Coverage', () => {
    beforeEach(() => {
        // Reset all mocks and state before each test
        vi.clearAllMocks();
        globalMockState.data.clear();
        globalMockState.subscriptions.clear();

        // Reset the previousChartState object
        previousChartState.chartCount = 0;
        previousChartState.fieldsRendered = [];
        previousChartState.lastRenderTimestamp = 0;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('hexToRgba function - Color Conversion Utility', () => {
        test('should convert hex color to rgba format', () => {
            const result = hexToRgba('#ff0000', 0.5);
            expect(result).toBe('rgba(255, 0, 0, 0.5)');
        });

        test('should handle different hex color values', () => {
            expect(hexToRgba('#000000', 1.0)).toBe('rgba(0, 0, 0, 1)');
            expect(hexToRgba('#ffffff', 0.0)).toBe('rgba(255, 255, 255, 0)');
            expect(hexToRgba('#123456', 0.75)).toBe('rgba(18, 52, 86, 0.75)');
        });

        test('should handle edge case alpha values', () => {
            expect(hexToRgba('#ff0000', 0)).toBe('rgba(255, 0, 0, 0)');
            expect(hexToRgba('#ff0000', 1)).toBe('rgba(255, 0, 0, 1)');
        });

        test('should parse hex colors correctly regardless of case', () => {
            expect(hexToRgba('#ABCDEF', 0.5)).toBe('rgba(171, 205, 239, 0.5)');
            expect(hexToRgba('#abcdef', 0.5)).toBe('rgba(171, 205, 239, 0.5)');
        });
    });

    describe('updatePreviousChartState function - State Tracking', () => {
        test('should update previousChartState object correctly', () => {
            const chartCount = 5;
            const visibleFields = 3;
            const timestamp = Date.now();

            updatePreviousChartState(chartCount, visibleFields, timestamp);

            expect(previousChartState.chartCount).toBe(chartCount);
            expect(previousChartState.fieldsRendered).toHaveLength(visibleFields);
            expect(previousChartState.lastRenderTimestamp).toBe(timestamp);
        });

        test('should call updateState with correct parameters', async () => {
            const { updateState } = await import('../../../utils/state/core/stateManager.js');

            const chartCount = 10;
            const visibleFields = 7;
            const timestamp = 1234567890;

            updatePreviousChartState(chartCount, visibleFields, timestamp);

            expect(updateState).toHaveBeenCalledWith(
                'charts.previousState',
                {
                    chartCount: 10,
                    visibleFields: 7,
                    timestamp: 1234567890
                },
                { silent: false, source: 'updatePreviousChartState' }
            );
        });

        test('should handle zero values correctly', () => {
            updatePreviousChartState(0, 0, 0);

            expect(previousChartState.chartCount).toBe(0);
            expect(previousChartState.fieldsRendered).toHaveLength(0);
            expect(previousChartState.lastRenderTimestamp).toBe(0);
        });

        test('should handle large values correctly', () => {
            const largeCount = 999999;
            const largeFields = 100;
            const largeTimestamp = Date.now() + 999999999;

            updatePreviousChartState(largeCount, largeFields, largeTimestamp);

            expect(previousChartState.chartCount).toBe(largeCount);
            expect(previousChartState.fieldsRendered).toHaveLength(largeFields);
            expect(previousChartState.lastRenderTimestamp).toBe(largeTimestamp);
        });
    });

    describe('resetChartNotificationState function - State Reset', () => {
        test('should reset all chart state values to defaults', () => {
            // First set some values
            previousChartState.chartCount = 10;
            // @ts-ignore - Working around TypeScript inference issue
            previousChartState.fieldsRendered = ['field1', 'field2', 'field3'];
            previousChartState.lastRenderTimestamp = Date.now();

            // Reset the state
            resetChartNotificationState();

            expect(previousChartState.chartCount).toBe(0);
            expect(previousChartState.fieldsRendered).toEqual([]);
            expect(previousChartState.lastRenderTimestamp).toBe(0);
        });

        test('should work correctly when called multiple times', () => {
            resetChartNotificationState();
            resetChartNotificationState();
            resetChartNotificationState();

            expect(previousChartState.chartCount).toBe(0);
            expect(previousChartState.fieldsRendered).toEqual([]);
            expect(previousChartState.lastRenderTimestamp).toBe(0);
        });

        test('should work when state is already reset', () => {
            // State is already at defaults
            expect(previousChartState.chartCount).toBe(0);

            resetChartNotificationState();

            expect(previousChartState.chartCount).toBe(0);
            expect(previousChartState.fieldsRendered).toEqual([]);
            expect(previousChartState.lastRenderTimestamp).toBe(0);
        });
    });

    describe('refreshChartsIfNeeded function - Conditional Refresh Logic', () => {
        test('should return true and trigger refresh when conditions are met', () => {
            // Mock state to have valid data and not currently rendering
            globalMockState.data.set('globalData', {
                recordMesgs: [1, 2, 3] // Has data
            });
            globalMockState.data.set('charts.isRendering', false);

            // Mock chartActions.requestRerender method
            const mockRequestRerender = vi.fn();
            chartActions.requestRerender = mockRequestRerender;

            const result = refreshChartsIfNeeded();

            expect(result).toBe(true);
            expect(mockRequestRerender).toHaveBeenCalledWith('Manual refresh requested');
        });

        test('should return false when no valid data exists', () => {
            // Mock state to have no data
            globalMockState.data.set('globalData', null);
            globalMockState.data.set('charts.isRendering', false);

            const mockRequestRerender = vi.fn();
            chartActions.requestRerender = mockRequestRerender;

            const result = refreshChartsIfNeeded();

            expect(result).toBe(false);
            expect(mockRequestRerender).not.toHaveBeenCalled();
        });

        test('should return false when currently rendering', () => {
            // Mock state to have data but currently rendering
            globalMockState.data.set('globalData', {
                recordMesgs: [1, 2, 3]
            });
            globalMockState.data.set('charts.isRendering', true);

            const mockRequestRerender = vi.fn();
            chartActions.requestRerender = mockRequestRerender;

            const result = refreshChartsIfNeeded();

            expect(result).toBe(false);
            expect(mockRequestRerender).not.toHaveBeenCalled();
        });

        test('should handle empty recordMesgs array', () => {
            globalMockState.data.set('globalData', {
                recordMesgs: [] // Empty array
            });
            globalMockState.data.set('charts.isRendering', false);

            const result = refreshChartsIfNeeded();

            expect(result).toBe(false);
        });
    });

    describe('getChartStatus function - Status Information Retrieval', () => {
        test('should return comprehensive chart status object', () => {
            // Set up mock state
            globalMockState.data.set('charts.isRendered', true);
            globalMockState.data.set('charts.isRendering', false);
            globalMockState.data.set('charts.controlsVisible', true);
            globalMockState.data.set('charts.selectedChart', 'power');
            globalMockState.data.set('charts.renderedCount', 8);
            globalMockState.data.set('charts.lastRenderTime', 1234567890);
            globalMockState.data.set('performance.renderTimes.chart', 150);
            globalMockState.data.set('globalData', {
                recordMesgs: [1, 2, 3]
            });

            const status = getChartStatus();

            expect(status).toEqual({
                isRendered: true,
                isRendering: false,
                hasData: true,
                controlsVisible: true,
                selectedChart: 'power',
                renderedCount: 8,
                lastRenderTime: 1234567890,
                performance: 150
            });
        });

        test('should return default values when state is empty', () => {
            // Clear all state
            globalMockState.data.clear();

            const status = getChartStatus();

            expect(status).toEqual({
                isRendered: false,
                isRendering: false,
                hasData: false,
                controlsVisible: true, // Default to true
                selectedChart: 'elevation', // Default value
                renderedCount: 0,
                lastRenderTime: undefined,
                performance: undefined
            });
        });

        test('should correctly detect hasData with various data states', () => {
            // Test with null data
            globalMockState.data.set('globalData', null);
            expect((getChartStatus() as any).hasData).toBe(false);

            // Test with undefined data
            globalMockState.data.set('globalData', undefined);
            expect((getChartStatus() as any).hasData).toBe(false);

            // Test with empty recordMesgs
            globalMockState.data.set('globalData', { recordMesgs: [] });
            expect((getChartStatus() as any).hasData).toBe(false);

            // Test with valid recordMesgs
            globalMockState.data.set('globalData', { recordMesgs: [1, 2, 3] });
            expect((getChartStatus() as any).hasData).toBe(true);
        });
    });

    describe('chartState object - State Getters', () => {
        test('should correctly get isRendered state', () => {
            globalMockState.data.set('charts.isRendered', true);
            expect(chartState.isRendered).toBe(true);

            globalMockState.data.set('charts.isRendered', false);
            expect(chartState.isRendered).toBe(false);

            globalMockState.data.set('charts.isRendered', undefined);
            expect(chartState.isRendered).toBe(false);
        });

        test('should correctly get isRendering state', () => {
            globalMockState.data.set('charts.isRendering', true);
            expect(chartState.isRendering).toBe(true);

            globalMockState.data.set('charts.isRendering', false);
            expect(chartState.isRendering).toBe(false);

            globalMockState.data.set('charts.isRendering', undefined);
            expect(chartState.isRendering).toBe(false);
        });

        test('should correctly get controlsVisible with default true', () => {
            globalMockState.data.set('charts.controlsVisible', true);
            expect(chartState.controlsVisible).toBe(true);

            globalMockState.data.set('charts.controlsVisible', false);
            expect(chartState.controlsVisible).toBe(false);

            // Test default behavior when undefined
            globalMockState.data.set('charts.controlsVisible', undefined);
            expect(chartState.controlsVisible).toBe(true);
        });

        test('should correctly get selectedChart with default', () => {
            globalMockState.data.set('charts.selectedChart', 'power');
            expect(chartState.selectedChart).toBe('power');

            globalMockState.data.set('charts.selectedChart', 'heart_rate');
            expect(chartState.selectedChart).toBe('heart_rate');

            // Test default when undefined
            globalMockState.data.set('charts.selectedChart', undefined);
            expect(chartState.selectedChart).toBe('elevation');
        });

        test('should correctly detect hasValidData', () => {
            // Valid data
            globalMockState.data.set('globalData', {
                recordMesgs: [{ timestamp: 1 }, { timestamp: 2 }]
            });
            expect(chartState.hasValidData).toBe(true);

            // Invalid data cases
            globalMockState.data.set('globalData', null);
            expect(chartState.hasValidData).toBe(false);

            globalMockState.data.set('globalData', undefined);
            expect(chartState.hasValidData).toBe(false);

            globalMockState.data.set('globalData', {});
            expect(chartState.hasValidData).toBe(false);

            globalMockState.data.set('globalData', { recordMesgs: null });
            expect(chartState.hasValidData).toBe(false);

            globalMockState.data.set('globalData', { recordMesgs: [] });
            expect(chartState.hasValidData).toBe(false);
        });
    });

    describe('chartActions object - State Actions', () => {
        test('should correctly start rendering process', async () => {
            const { setState } = await import('../../../utils/state/core/stateManager.js');

            chartActions.startRendering();

            expect(setState).toHaveBeenCalledWith(
                'charts.isRendering',
                true,
                { silent: false, source: 'chartActions.startRendering' }
            );

            expect(setState).toHaveBeenCalledWith(
                'isLoading',
                true,
                { silent: false, source: 'chartActions.startRendering' }
            );
        });

        test('should correctly complete rendering process on success', async () => {
            const { updateState, setState } = await import('../../../utils/state/core/stateManager.js');
            const { AppActions } = await import('../../../utils/app/lifecycle/appActions.js');

            chartActions.completeRendering(true, 5, 250);

            expect(updateState).toHaveBeenCalledWith(
                'charts',
                {
                    isRendered: true,
                    isRendering: false,
                    lastRenderTime: expect.any(Number),
                    renderedCount: 5
                },
                { silent: false, source: 'chartActions.completeRendering' }
            );

            expect(setState).toHaveBeenCalledWith(
                'isLoading',
                false,
                { silent: false, source: 'chartActions.completeRendering' }
            );

            expect(updateState).toHaveBeenCalledWith(
                'performance.renderTimes',
                { chart: 250 },
                { silent: false, source: 'chartActions.completeRendering' }
            );

            expect(AppActions.notifyChartRenderComplete).toHaveBeenCalledWith(5);
        });

        test('should correctly complete rendering process on failure', async () => {
            const { updateState, setState } = await import('../../../utils/state/core/stateManager.js');
            const { AppActions } = await import('../../../utils/app/lifecycle/appActions.js');

            chartActions.completeRendering(false, 0, 100);

            expect(updateState).toHaveBeenCalledWith(
                'charts',
                {
                    isRendered: false,
                    isRendering: false
                },
                { silent: false, source: 'chartActions.completeRendering' }
            );

            expect(setState).toHaveBeenCalledWith(
                'isLoading',
                false,
                { silent: false, source: 'chartActions.completeRendering' }
            );

            // Should not update performance or notify on failure
            expect(AppActions.notifyChartRenderComplete).not.toHaveBeenCalled();
        });
    });

    describe('Integration and Error Handling', () => {
        test('should handle state management errors gracefully', async () => {
            const { getState } = await import('../../../utils/state/core/stateManager.js');

            // Mock getState to throw an error using vi.fn().mockImplementationOnce
            (getState as any).mockImplementationOnce(() => {
                throw new Error('State access error');
            });

            // Should not throw when accessing chartState properties
            expect(() => {
                // Access the property but ignore the value
                chartState.isRendered;
            }).not.toThrow();
        });

        test('should work with undefined state values', () => {
            globalMockState.data.clear();

            // All getters should handle undefined gracefully
            expect(chartState.isRendered).toBe(false);
            expect(chartState.isRendering).toBe(false);
            expect(chartState.controlsVisible).toBe(true);
            expect(chartState.selectedChart).toBe('elevation');
            expect(chartState.hasValidData).toBe(false);
        });
    });
});
