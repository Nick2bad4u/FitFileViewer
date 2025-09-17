import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Define types for our global extensions
declare global {
  interface Window {
    Chart?: any;
    showNotification?: (message: string, type: string) => void;
  }
}

// Mock dependencies before importing the module
vi.mock("../../../../../utils/charts/theming/chartThemeUtils.js", () => ({
  detectCurrentTheme: vi.fn().mockReturnValue("light")
}));

vi.mock("../../../../../utils/data/zones/chartZoneColorUtils.js", () => ({
  getChartZoneColors: vi.fn().mockImplementation(() => ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff'])
}));

vi.mock("../../../../../utils/data/lookups/getUnitSymbol.js", () => ({
  getUnitSymbol: vi.fn().mockReturnValue('h:m:s')
}));

vi.mock("../../../../../utils/formatting/formatters/formatTime.js", () => ({
  formatTime: vi.fn().mockImplementation((value) => `${value}s`)
}));

// Mock Chart.js plugins
vi.mock("../../../../../utils/charts/plugins/chartZoomResetPlugin.js", () => ({
  chartZoomResetPlugin: {}
}));

vi.mock("../../../../../utils/charts/plugins/chartBackgroundColorPlugin.js", () => ({
  chartBackgroundColorPlugin: {}
}));

// Import the module after mocks
import { renderSingleHRZoneBar } from "../../../../../utils/data/zones/renderSingleHRZoneBar.js";
import * as chartThemeUtils from "../../../../../utils/charts/theming/chartThemeUtils.js";
import * as formatTime from "../../../../../utils/formatting/formatters/formatTime.js";
import * as chartZoneColorUtils from "../../../../../utils/data/zones/chartZoneColorUtils.js";

describe('renderSingleHRZoneBar', () => {
  let canvas: HTMLCanvasElement;
  let originalChart: any;
  let originalShowNotification: any;
  let mockChartInstance: any;

  beforeEach(() => {
    // Create a canvas element for testing
    canvas = document.createElement('canvas');

    // Save original globals
    originalChart = window.Chart;
    originalShowNotification = window.showNotification;

    // Reset the previous spy if any
    vi.clearAllMocks();

    // Create a complete mock Chart instance with all required structures
    mockChartInstance = {
      destroy: vi.fn(),
      update: vi.fn(),
      data: {
        datasets: []
      },
      options: {
        scales: {
          y: { ticks: { callback: vi.fn(), color: null } },
          x: { ticks: { color: null } }
        },
        plugins: {
          tooltip: { callbacks: { label: vi.fn() } },
          chartBackgroundColorPlugin: { backgroundColor: null }
        }
      }
    };

    // Set up Chart.js spy properly for each test
    window.Chart = vi.fn().mockImplementation((canvas, config) => {
      mockChartInstance.config = config;
      return mockChartInstance;
    });

    // Mock showNotification
    window.showNotification = vi.fn();
  });

  afterEach(() => {
    // Restore original globals
    window.Chart = originalChart;

    // Also reset any potential changes to the document body
    document.body.className = '';
    window.showNotification = originalShowNotification;
    vi.resetAllMocks();
  });

  it('should create a Chart.js chart with correct configuration', () => {
    // Prepare test data
    const zoneData = [
      { label: 'Zone 1', value: 300, color: '#ff0000' },
      { label: 'Zone 2', value: 600, color: '#00ff00' },
      { label: 'Zone 3', value: 450, color: '#0000ff' }
    ];

    // Call the function
    const result = renderSingleHRZoneBar(canvas, zoneData);

    // Verify Chart.js was called with correct parameters
    expect(window.Chart).toHaveBeenCalledTimes(1);
    expect(window.Chart).toHaveBeenCalledWith(canvas, expect.objectContaining({
      type: 'bar',
      data: expect.objectContaining({
        labels: ['Time in Zone']
      })
    }));

    // Verify the result
    expect(result).toBe(mockChartInstance);
  });

  it('should handle custom options like title', () => {
    // Prepare test data
    const zoneData = [
      { label: 'Zone 1', value: 300, color: '#ff0000' }
    ];

    // Call with custom options
    renderSingleHRZoneBar(canvas, zoneData, { title: 'Custom HR Zones Title' });

    // Extract the options passed to Chart.js
    const chartCall = (window.Chart as any).mock.calls[0];
    const chartConfig = chartCall ? chartCall[1] : null;

    // Verify title was set correctly
    expect(chartConfig?.options?.plugins?.title?.display).toBe(true);
    expect(chartConfig?.options?.plugins?.title?.text).toBe('Custom HR Zones Title');
  });

  it('should use zone colors from chartZoneColorUtils when colors not provided', () => {
    // Create a fresh spy for this test
    vi.restoreAllMocks();

    // Mock Chart constructor specifically for this test
    window.Chart = vi.fn().mockImplementation((canvasElem, config) => {
      mockChartInstance.config = config;
      return mockChartInstance;
    });

    // Mock the getChartZoneColors function
    vi.spyOn(chartZoneColorUtils, 'getChartZoneColors').mockReturnValue(['#ff0000', '#00ff00', '#0000ff']);

    // Prepare test data without colors
    const zoneData = [
      { label: 'Zone 1', value: 300 },
      { label: 'Zone 2', value: 600 }
    ];

    // Call the function
    const chart = renderSingleHRZoneBar(canvas, zoneData);

    // Verify the function returned a chart
    expect(chart).toBe(mockChartInstance);

    // Verify that Chart constructor was called
    expect(window.Chart).toHaveBeenCalledTimes(1);

    // Verify the chart was created with correct data structure
    const chartCall = (window.Chart as any).mock.calls[0];
    expect(chartCall).toBeDefined();
    expect(chartCall[0]).toBe(canvas);

    const chartConfig = chartCall[1];
    expect(chartConfig).toBeDefined();
    expect(chartConfig.data.datasets).toHaveLength(2);
    expect(chartConfig.data.datasets[0].label).toBe('Zone 1');
    expect(chartConfig.data.datasets[1].label).toBe('Zone 2');

    // Verify colors were set (mocked getChartZoneColors would provide these)
    expect(chartConfig.data.datasets[0].backgroundColor).toBeDefined();
    expect(chartConfig.data.datasets[1].backgroundColor).toBeDefined();
  });

  it('should handle dark theme correctly', () => {
    // Restore all mocks for clean test
    vi.restoreAllMocks();

    // Override theme mock for this test
    vi.mocked(chartThemeUtils.detectCurrentTheme).mockReturnValue("dark");

    // Mock Chart constructor specifically for this test
    window.Chart = vi.fn().mockImplementation((canvasElem, config) => {
      mockChartInstance.config = config;
      return mockChartInstance;
    });

    const zoneData = [{ label: 'Zone 1', value: 300 }];

    // Call the function
    renderSingleHRZoneBar(canvas, zoneData);

    // Verify Chart constructor was called
    expect(window.Chart).toHaveBeenCalledTimes(1);

    // Get the chart options from the constructor call
    const chartCall = (window.Chart as any).mock.calls[0];
    expect(chartCall).toBeDefined();

    const chartConfig = chartCall[1];
    expect(chartConfig).toBeDefined();
    expect(chartConfig.options).toBeDefined();

    // Verify dark theme styling was applied in the configuration
    expect(chartConfig.options.scales.y.ticks.color).toBe('#fff');
    expect(chartConfig.options.scales.x.ticks.color).toBe('#fff');
    expect(chartConfig.options.plugins.chartBackgroundColorPlugin.backgroundColor).toBe('#181c24');
  });

  it('should handle invalid inputs gracefully', () => {
    // Test with null canvas
    const result1 = renderSingleHRZoneBar(null as any, []);
    expect(result1).toBeNull();
    expect(window.showNotification).toHaveBeenCalledWith('Failed to render HR zone bar', 'error');

    // Reset mocks
    vi.clearAllMocks();

    // Test with null zoneData
    const result2 = renderSingleHRZoneBar(canvas, null as any);
    expect(result2).toBeNull();
    expect(window.showNotification).toHaveBeenCalledWith('Failed to render HR zone bar', 'error');

    // Reset mocks
    vi.clearAllMocks();

    // Test with missing Chart.js
    window.Chart = undefined;
    const result3 = renderSingleHRZoneBar(canvas, [{ label: 'Zone 1', value: 300 }]);
    expect(result3).toBeNull();
    expect(window.showNotification).toHaveBeenCalledWith('Failed to render HR zone bar', 'error');
  });

  it('should format time values correctly in tooltips and y-axis', () => {
    // Restore all mocks for clean test
    vi.restoreAllMocks();

    // Mock Chart constructor specifically for this test
    window.Chart = vi.fn().mockImplementation((canvasElem, config) => {
      mockChartInstance.config = config;
      return mockChartInstance;
    });

    const zoneData = [{ label: 'Zone 1', value: 300 }];

    // Call the function
    renderSingleHRZoneBar(canvas, zoneData);

    // Verify Chart constructor was called
    expect(window.Chart).toHaveBeenCalledTimes(1);

    // Get the chart options from the constructor call
    const chartCall = (window.Chart as any).mock.calls[0];
    expect(chartCall).toBeDefined();

    const chartConfig = chartCall[1];
    expect(chartConfig).toBeDefined();
    expect(chartConfig.options).toBeDefined();

    // Verify the callbacks exist
    expect(chartConfig.options.scales.y.ticks.callback).toBeDefined();
    expect(chartConfig.options.plugins.tooltip.callbacks.label).toBeDefined();

    // Test the formatTime callback behavior by executing it
    const yTickCallback = chartConfig.options.scales.y.ticks.callback;
    expect(yTickCallback(100)).toBe("100s"); // Our mock returns value + "s"

    // Test the tooltip label callback
    const tooltipCallback = chartConfig.options.plugins.tooltip.callbacks.label;
    const mockContext = {
      dataset: { label: "Zone 1" },
      parsed: { y: 300 }
    };
    expect(tooltipCallback(mockContext)).toBe("Zone 1: 300s");
  });
});
