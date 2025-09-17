/**
 * @fileoverview Comprehensive test suite for renderEventMessagesChart.js
 *
 * This test suite validates the event messages chart rendering functionality including:
 * - Data validation and processing for event messages
 * - Timestamp conversion and relative time calculation
 * - Chart.js integration with scatter plot configuration
 * - Canvas creation and theme-based styling
 * - Chart instance management and global registration
 * - Tooltip configuration and event formatting
 * - Plugin configuration (zoom, background color)
 * - Scale configuration with time formatting
 * - Error handling and edge cases
 * - Various timestamp format support
 *
 * @author AI Assistant
 * @version 1.0.0
 */

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderEventMessagesChart } from '../../utils/charts/rendering/renderEventMessagesChart.js';

// Mock all external dependencies
vi.mock('../../utils/theming/core/theme.js', () => ({
    getThemeConfig: vi.fn(() => ({
        colors: {
            bgPrimary: '#ffffff',
            bgSecondary: '#f8f9fa',
            textPrimary: '#000000',
            textSecondary: '#666666',
            border: '#dee2e6',
            gridLines: '#e9ecef',
            shadow: '0 2px 4px #00000020'
        }
    }))
}));

vi.mock('../../utils/charts/components/createChartCanvas.js', () => ({
    createChartCanvas: vi.fn(() => {
        const canvas = document.createElement('canvas');
        canvas.id = 'chart-events-0';
        return canvas;
    })
}));

vi.mock('../../utils/formatting/formatters/formatTime.js', () => ({
    formatTime: vi.fn((value, showSeconds) => {
        if (showSeconds) return `${value}s`;
        return `${Math.floor(value / 60)}:${(value % 60).toString().padStart(2, '0')}`;
    })
}));

vi.mock('../../utils/charts/core/updateChartAnimations.js', () => ({
    updateChartAnimations: vi.fn()
}));

vi.mock('../../utils/data/lookups/getUnitSymbol.js', () => ({
    getUnitSymbol: vi.fn(() => 's')
}));

vi.mock('../../utils/charts/plugins/chartZoomResetPlugin.js', () => ({
    chartZoomResetPlugin: { id: 'chartZoomResetPlugin' }
}));

// Global test setup
let mockChart: any;
let mockConsoleError: any;
let mockLocalStorage: any;

beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';

    // Mock Chart.js
    mockChart = {
        id: 'test-chart',
        update: vi.fn(),
        destroy: vi.fn(),
        resize: vi.fn()
    };

    // Ensure window and global.window reference the same object
    Object.assign(window, {
        Chart: vi.fn(() => mockChart),
        _chartjsInstances: [],
        globalData: {
            eventMesgs: [
                {
                    timestamp: new Date('2023-01-01T10:00:00Z'),
                    event: 'Start Event',
                    message: 'Activity started'
                },
                {
                    timestamp: new Date('2023-01-01T10:05:00Z'),
                    event: 'Lap Event',
                    eventType: 'lap'
                },
                {
                    timestamp: 1672570800, // Unix timestamp in seconds
                    event: 'Timer Event'
                }
            ]
        }
    });

    // Ensure global.window references the same object as window
    global.window = window;

    // Mock console.error
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock localStorage
    mockLocalStorage = {
        getItem: vi.fn((key: string) => {
            if (key === 'chartjs_color_event_messages') return '#ff5722';
            return null;
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
    };

    Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true
    });
});

afterEach(() => {
    vi.clearAllMocks();
    mockConsoleError.mockRestore();
    delete window.Chart;
    delete window._chartjsInstances;
    delete window.globalData;
});

describe('renderEventMessagesChart.js - Event Messages Chart Utility', () => {
    describe('Data Validation and Processing', () => {
        test('should return early when eventMesgs is not available', () => {
            window.globalData = null as any;
            const container = document.createElement('div');

            renderEventMessagesChart(container, {}, new Date());

            expect(container.children.length).toBe(0);
            expect(window.Chart).not.toHaveBeenCalled();
        });

        test('should return early when eventMesgs is not an array', () => {
            window.globalData = { eventMesgs: 'invalid' } as any;
            const container = document.createElement('div');

            renderEventMessagesChart(container, {}, new Date());

            expect(container.children.length).toBe(0);
            expect(window.Chart).not.toHaveBeenCalled();
        });

        test('should return early when eventMesgs array is empty', () => {
            window.globalData = { eventMesgs: [] };
            const container = document.createElement('div');

            renderEventMessagesChart(container, {}, new Date());

            expect(container.children.length).toBe(0);
            expect(window.Chart).not.toHaveBeenCalled();
        });

        test('should process event messages correctly with valid data', () => {
            const container = document.createElement('div');
            const startTime = new Date('2023-01-01T10:00:00Z');

            renderEventMessagesChart(container, {}, startTime);

            expect(window.Chart).toHaveBeenCalled();
            const chartConfig = (window.Chart as any).mock.calls[0][1];
            expect(chartConfig.data.datasets[0].data).toHaveLength(3);
        });

        test('should handle missing globalData gracefully', () => {
            delete window.globalData;
            const container = document.createElement('div');

            renderEventMessagesChart(container, {}, new Date());

            expect(container.children.length).toBe(0);
            expect(window.Chart).not.toHaveBeenCalled();
        });

        test('should extract event names from different fields', () => {
            window.globalData = {
                eventMesgs: [
                    { timestamp: new Date('2023-01-01T10:00:00Z'), event: 'Event Field' },
                    { timestamp: new Date('2023-01-01T10:01:00Z'), message: 'Message Field' },
                    { timestamp: new Date('2023-01-01T10:02:00Z'), eventType: 'EventType Field' },
                    { timestamp: new Date('2023-01-01T10:03:00Z') } // Default
                ]
            };
            const container = document.createElement('div');
            const startTime = new Date('2023-01-01T10:00:00Z');

            renderEventMessagesChart(container, {}, startTime);

            const chartConfig = (window.Chart as any).mock.calls[0][1];
            const data = chartConfig.data.datasets[0].data;

            expect(data[0].event).toBe('Event Field');
            expect(data[1].event).toBe('Message Field');
            expect(data[2].event).toBe('EventType Field');
            expect(data[3].event).toBe('Event');
        });
    });

    describe('Timestamp Conversion and Processing', () => {
        test('should handle Date object timestamps correctly', () => {
            const container = document.createElement('div');
            const startTime = new Date('2023-01-01T10:00:00Z');

            renderEventMessagesChart(container, {}, startTime);

            const chartConfig = (window.Chart as any).mock.calls[0][1];
            const data = chartConfig.data.datasets[0].data;

            // First event should have x: 0 (same as start time)
            expect(data[0].x).toBe(0);
            // Second event should have x: 300 (5 minutes later)
            expect(data[1].x).toBe(300);
        });

        test('should handle number timestamps in seconds', () => {
            window.globalData = {
                eventMesgs: [
                    { timestamp: 1672570800, event: 'Event 1' }, // Unix timestamp in seconds
                    { timestamp: 1672571100, event: 'Event 2' }  // 5 minutes later
                ]
            };
            const container = document.createElement('div');
            const startTime = 1672570800; // Start time in seconds

            renderEventMessagesChart(container, {}, startTime);

            const chartConfig = (window.Chart as any).mock.calls[0][1];
            const data = chartConfig.data.datasets[0].data;

            expect(data[0].x).toBe(0);
            expect(data[1].x).toBe(300);
        });

        test('should handle number timestamps in milliseconds', () => {
            window.globalData = {
                eventMesgs: [
                    { timestamp: 1672570800000, event: 'Event 1' }, // Unix timestamp in milliseconds
                    { timestamp: 1672571100000, event: 'Event 2' }  // 5 minutes later
                ]
            };
            const container = document.createElement('div');
            const startTime = 1672570800000; // Start time in milliseconds

            renderEventMessagesChart(container, {}, startTime);

            const chartConfig = (window.Chart as any).mock.calls[0][1];
            const data = chartConfig.data.datasets[0].data;

            expect(data[0].x).toBe(0);
            expect(data[1].x).toBe(300);
        });

        test('should handle mixed timestamp formats', () => {
            window.globalData = {
                eventMesgs: [
                    { timestamp: new Date('2023-01-01T10:00:00Z'), event: 'Event 1' },
                    { timestamp: 1672570800, event: 'Event 2' },
                    { timestamp: 1672570800000, event: 'Event 3' }
                ]
            };
            const container = document.createElement('div');
            const startTime = new Date('2023-01-01T10:00:00Z');

            renderEventMessagesChart(container, {}, startTime);

            const chartConfig = (window.Chart as any).mock.calls[0][1];
            const data = chartConfig.data.datasets[0].data;

            expect(data).toHaveLength(3);
            expect(data[0].x).toBe(0);
        });

        test('should fallback to x:0 for invalid timestamp formats', () => {
            window.globalData = {
                eventMesgs: [
                    { timestamp: 'invalid', event: 'Event 1' },
                    { timestamp: null, event: 'Event 2' },
                    { event: 'Event 3' } // No timestamp
                ]
            };
            const container = document.createElement('div');
            const startTime = new Date('2023-01-01T10:00:00Z');

            renderEventMessagesChart(container, {}, startTime);

            const chartConfig = (window.Chart as any).mock.calls[0][1];
            const data = chartConfig.data.datasets[0].data;

            expect(data).toHaveLength(3);
                    data.forEach((point: any) => {
                expect(point.x).toBe(0);
            });
        });

        test('should handle invalid startTime gracefully', () => {
            const container = document.createElement('div');
            const startTime = 'invalid' as any;

            renderEventMessagesChart(container, {}, startTime);

            const chartConfig = (window.Chart as any).mock.calls[0][1];
            const data = chartConfig.data.datasets[0].data;

            expect(data).toHaveLength(3);
                    data.forEach((point: any) => {
                expect(point.x).toBe(0);
            });
        });
    });

    describe('Chart Configuration', () => {
        test('should create scatter chart with correct type and configuration', () => {
            const container = document.createElement('div');

            renderEventMessagesChart(container, {}, new Date());

            expect(window.Chart).toHaveBeenCalled();
            const chartConfig = (window.Chart as any).mock.calls[0][1];

            expect(chartConfig.type).toBe('scatter');
            expect(chartConfig.data.datasets).toHaveLength(1);
            expect(chartConfig.data.datasets[0].label).toBe('Events');
        });

        test('should configure dataset with correct styling and colors', () => {
            const container = document.createElement('div');

            renderEventMessagesChart(container, {}, new Date());

            const chartConfig = (window.Chart as any).mock.calls[0][1];
            const dataset = chartConfig.data.datasets[0];

            expect(dataset.backgroundColor).toBe('#ff5722CC'); // Custom color from localStorage
            expect(dataset.borderColor).toBe('#ff5722');
            expect(dataset.pointRadius).toBe(6);
            expect(dataset.pointHoverRadius).toBe(8);
        });

        test('should use default color when localStorage color is not available', () => {
            mockLocalStorage.getItem.mockReturnValue(null);
            const container = document.createElement('div');

            renderEventMessagesChart(container, {}, new Date());

            const chartConfig = (window.Chart as any).mock.calls[0][1];
            const dataset = chartConfig.data.datasets[0];

            expect(dataset.backgroundColor).toBe('#9c27b0CC'); // Default purple
            expect(dataset.borderColor).toBe('#9c27b0');
        });

        test('should configure chart options based on provided options - all enabled', () => {
            const container = document.createElement('div');
            const options = {
                showLegend: true,
                showTitle: true,
                showGrid: true,
                zoomPluginConfig: { zoom: { enabled: true } }
            };

            renderEventMessagesChart(container, options, new Date());

            const chartConfig = (window.Chart as any).mock.calls[0][1];

            expect(chartConfig.options.plugins.legend.display).toBe(true);
            expect(chartConfig.options.plugins.title.display).toBe(true);
            expect(chartConfig.options.scales.x.grid.display).toBe(true);
            expect(chartConfig.options.plugins.zoom).toEqual({ zoom: { enabled: true } });
        });

        test('should configure chart options based on provided options - all disabled', () => {
            const container = document.createElement('div');
            const options = {
                showLegend: false,
                showTitle: false,
                showGrid: false
            };

            renderEventMessagesChart(container, options, new Date());

            const chartConfig = (window.Chart as any).mock.calls[0][1];

            expect(chartConfig.options.plugins.legend.display).toBe(false);
            expect(chartConfig.options.plugins.title.display).toBe(false);
            expect(chartConfig.options.scales.x.grid.display).toBe(false);
        });

        test('should set correct axis titles and configuration', () => {
            const container = document.createElement('div');

            renderEventMessagesChart(container, {}, new Date());

            const chartConfig = (window.Chart as any).mock.calls[0][1];

            expect(chartConfig.options.scales.x.type).toBe('linear');
            expect(chartConfig.options.scales.x.display).toBe(true);
            expect(chartConfig.options.scales.x.title.text).toBe('Time (s)');
            expect(chartConfig.options.scales.y.display).toBe(false);
        });

        test('should configure responsive and aspect ratio options', () => {
            const container = document.createElement('div');

            renderEventMessagesChart(container, {}, new Date());

            const chartConfig = (window.Chart as any).mock.calls[0][1];

            expect(chartConfig.options.responsive).toBe(true);
            expect(chartConfig.options.maintainAspectRatio).toBe(false);
        });
    });

    describe('Canvas Creation and Styling', () => {
        test('should create canvas with correct ID and styling', () => {
            const container = document.createElement('div');

            renderEventMessagesChart(container, {}, new Date());

            const canvas = container.querySelector('canvas');
            expect(canvas?.id).toBe('chart-events-0');
            expect(canvas?.style.borderRadius).toBe('12px');
          expect(canvas?.style.boxShadow).toBe('0 2px 4px #00000020');
        });

        test('should append canvas to container', () => {
            const container = document.createElement('div');

            renderEventMessagesChart(container, {}, new Date());

            expect(container.children.length).toBe(1);
            expect(container.children[0].tagName).toBe('CANVAS');
        });

        test('should apply theme-based canvas styling', () => {
            const container = document.createElement('div');

            renderEventMessagesChart(container, {}, new Date());

            const canvas = container.querySelector('canvas');
                // BoxShadow should match the theme shadow value
                expect(canvas?.style.boxShadow).toBe('0 2px 4px #00000020');
        });
    });

    describe('Chart Instance Management', () => {
        test('should add chart instance to global instances array', () => {
            const container = document.createElement('div');

            renderEventMessagesChart(container, {}, new Date());

            expect(window._chartjsInstances).toHaveLength(1);
                expect(window._chartjsInstances?.[0]).toBe(mockChart);
        });

        test('should initialize global instances array if it doesn\'t exist', () => {
            delete (global.window as any)._chartjsInstances;
            const container = document.createElement('div');

            renderEventMessagesChart(container, {}, new Date());

            expect(window._chartjsInstances).toBeDefined();
            expect(window._chartjsInstances).toHaveLength(1);
        });

        test('should call updateChartAnimations with correct parameters', async () => {
            const { updateChartAnimations } = await import('../../utils/charts/core/updateChartAnimations.js');
            const container = document.createElement('div');

            renderEventMessagesChart(container, {}, new Date());

            expect(updateChartAnimations).toHaveBeenCalledWith(mockChart, 'Event Messages');
        });
    });

    describe('Tooltip Configuration', () => {
        test('should configure tooltip with theme colors', () => {
            const container = document.createElement('div');

            renderEventMessagesChart(container, {}, new Date());

            const chartConfig = (window.Chart as any).mock.calls[0][1];
            const tooltip = chartConfig.options.plugins.tooltip;

            expect(tooltip.backgroundColor).toBe('#f8f9fa');
            expect(tooltip.titleColor).toBe('#000000');
            expect(tooltip.bodyColor).toBe('#000000');
            expect(tooltip.borderColor).toBe('#dee2e6');
            expect(tooltip.borderWidth).toBe(1);
        });

        test('should format tooltip label correctly', () => {
            const container = document.createElement('div');

            renderEventMessagesChart(container, {}, new Date());

            const chartConfig = (window.Chart as any).mock.calls[0][1];
            const tooltipCallback = chartConfig.options.plugins.tooltip.callbacks.label;

            const mockContext = {
                raw: { event: 'Test Event' }
            };

            const result = tooltipCallback(mockContext);
            expect(result).toBe('Test Event');
        });

        test('should handle missing event in tooltip', () => {
            const container = document.createElement('div');

            renderEventMessagesChart(container, {}, new Date());

            const chartConfig = (window.Chart as any).mock.calls[0][1];
            const tooltipCallback = chartConfig.options.plugins.tooltip.callbacks.label;

            const mockContext = {
                raw: {}
            };

            const result = tooltipCallback(mockContext);
            expect(result).toBe('Event');
        });
    });

    describe('Plugin Configuration', () => {
        test('should include chartZoomResetPlugin and chartBackgroundColorPlugin', () => {
            const container = document.createElement('div');

            renderEventMessagesChart(container, {}, new Date());

            const chartConfig = (window.Chart as any).mock.calls[0][1];

            expect(chartConfig.plugins).toContain('chartBackgroundColorPlugin');
            expect(chartConfig.plugins[0]).toEqual({ id: 'chartZoomResetPlugin' });
        });

        test('should configure chartBackgroundColorPlugin with theme colors', () => {
            const container = document.createElement('div');

            renderEventMessagesChart(container, {}, new Date());

            const chartConfig = (window.Chart as any).mock.calls[0][1];
            const bgPlugin = chartConfig.options.plugins.chartBackgroundColorPlugin;

            expect(bgPlugin.backgroundColor).toBe('#ffffff');
        });
    });

    describe('Scale Configuration', () => {
        test('should configure x-axis with time formatting callback', async () => {
            const { formatTime } = await import('../../utils/formatting/formatters/formatTime.js');
            const container = document.createElement('div');

            renderEventMessagesChart(container, {}, new Date());

            const chartConfig = (window.Chart as any).mock.calls[0][1];
            const xAxisCallback = chartConfig.options.scales.x.ticks.callback;

            const result = xAxisCallback(300);
            expect(formatTime).toHaveBeenCalledWith(300, true);
            expect(result).toBe('300s');
        });

        test('should configure x-axis ticks with theme colors', () => {
            const container = document.createElement('div');

            renderEventMessagesChart(container, {}, new Date());

            const chartConfig = (window.Chart as any).mock.calls[0][1];

            expect(chartConfig.options.scales.x.ticks.color).toBe('#000000');
            expect(chartConfig.options.scales.x.title.color).toBe('#000000');
            expect(chartConfig.options.scales.x.grid.color).toBe('#e9ecef');
        });
    });

    describe('Error Handling', () => {
        test('should handle Chart.js constructor throwing error', () => {
            (global.window as any).Chart = vi.fn(() => {
                throw new Error('Chart creation failed');
            });

            const container = document.createElement('div');

            expect(() => renderEventMessagesChart(container, {}, new Date())).not.toThrow();
            expect(mockConsoleError).toHaveBeenCalledWith(
                '[ChartJS] Error rendering event messages chart:',
                expect.any(Error)
            );
        });

        test('should handle errors gracefully without throwing', async () => {
            const { getThemeConfig } = await import('../../utils/theming/core/theme.js');
            (getThemeConfig as any).mockImplementation(() => {
                throw new Error('Theme config failed');
            });

            const container = document.createElement('div');

            expect(() => renderEventMessagesChart(container, {}, new Date())).not.toThrow();
            expect(mockConsoleError).toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty event messages array', () => {
            window.globalData = { eventMesgs: [] };
            const container = document.createElement('div');

            renderEventMessagesChart(container, {}, new Date());

            expect(container.children.length).toBe(0);
            expect(window.Chart).not.toHaveBeenCalled();
        });

        test('should handle null Chart.js instance', () => {
            // Mock Chart constructor to throw an error or simulate failure
            const mockChartConstructor = vi.fn(() => {
                throw new Error('Chart construction failed');
            });
            (global.window as any).Chart = mockChartConstructor;
            const container = document.createElement('div');

            // Function should not throw even when Chart constructor fails
            expect(() => {
                renderEventMessagesChart(container, {}, new Date());
            }).not.toThrow();

            // Chart constructor should be called
            expect(mockChartConstructor).toHaveBeenCalled();
        });

        test('should handle events with all timestamp variations', () => {
            window.globalData = {
                eventMesgs: [
                    { time: new Date('2023-01-01T10:00:00Z'), event: 'Event 1' },
                    { timestamp: 1672570800, event: 'Event 2' },
                    { event: 'Event 3' } // No timestamp
                ]
            };
            const container = document.createElement('div');
            const startTime = new Date('2023-01-01T10:00:00Z');

            renderEventMessagesChart(container, {}, startTime);

            const chartConfig = (window.Chart as any).mock.calls[0][1];
            expect(chartConfig.data.datasets[0].data).toHaveLength(3);
        });

        test('should handle missing container gracefully', () => {
            expect(() => renderEventMessagesChart(null as any, {}, new Date())).not.toThrow();
        });

        test('should handle undefined options object', () => {
            const container = document.createElement('div');

            expect(() => renderEventMessagesChart(container, undefined as any, new Date())).not.toThrow();
        });

        test('should handle very large timestamp values', () => {
            window.globalData = {
                eventMesgs: [
                    { timestamp: Number.MAX_SAFE_INTEGER, event: 'Large Event' },
                    { timestamp: -Number.MAX_SAFE_INTEGER, event: 'Negative Event' }
                ]
            };
            const container = document.createElement('div');

            renderEventMessagesChart(container, {}, new Date());

            const chartConfig = (window.Chart as any).mock.calls[0][1];
            expect(chartConfig.data.datasets[0].data).toHaveLength(2);
        });
    });
});
