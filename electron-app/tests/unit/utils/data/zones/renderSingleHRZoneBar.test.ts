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
  getChartZoneColors: vi.fn().mockReturnValue(['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff'])
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

    // Create a mock Chart instance
    mockChartInstance = {
      destroy: vi.fn(),
      update: vi.fn(),
      data: {},
      options: {}
    };

    // Set up window.Chart correctly so it can be detected by the module
    window.Chart = vi.fn((canvas, config) => {
      // Store the config for inspection in tests
      mockChartInstance.config = config;
      // Return the mock Chart instance
      return mockChartInstance;
    });

    // Mock showNotification
    window.showNotification = vi.fn();

    // Reset mocks between tests
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original globals
    window.Chart = originalChart;
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
    // Verify Chart is properly defined globally
    expect(window.Chart).toBeDefined();
    expect(typeof window.Chart).toBe('function');

    // Prepare test data without colors
    const zoneData = [
      { label: 'Zone 1', value: 300 },
      { label: 'Zone 2', value: 600 }
    ];

    // Call the function
    const chart = renderSingleHRZoneBar(canvas, zoneData);

    // Verify the function returned a chart
    expect(chart).toBeDefined();

    // Verify that Chart.js was called
    expect(window.Chart).toHaveBeenCalled();

    // Get the configuration passed to Chart
    expect(mockChartInstance.config).toBeDefined();

    // Check if datasets were created with right data
    expect(mockChartInstance.config.data.datasets[0].label).toBe('Zone 1');
    expect(mockChartInstance.config.data.datasets[1].label).toBe('Zone 2');

    // Verify colors were set
    expect(mockChartInstance.config.data.datasets[0].backgroundColor).toBeDefined();
    expect(mockChartInstance.config.data.datasets[1].backgroundColor).toBeDefined();
  });

  it('should handle dark theme correctly', () => {
    // Override theme mock for this test
    vi.mocked(chartThemeUtils.detectCurrentTheme).mockReturnValueOnce("dark");

    const zoneData = [{ label: 'Zone 1', value: 300 }];

    // Call the function
    renderSingleHRZoneBar(canvas, zoneData);

    // Get the options from the chart config
    const options = mockChartInstance.config.options;

    // Verify dark theme styling was applied
    expect(options.scales.y.ticks.color).toBe('#fff');
    expect(options.scales.x.ticks.color).toBe('#fff');
    expect(options.plugins.chartBackgroundColorPlugin.backgroundColor).toBe('#181c24');
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
    const zoneData = [{ label: 'Zone 1', value: 300 }];

    // Call the function
    renderSingleHRZoneBar(canvas, zoneData);

    // Get the options from the chart config
    const options = mockChartInstance.config.options;

    // Verify the callbacks exist
    expect(options.scales.y.ticks.callback).toBeDefined();
    expect(options.plugins.tooltip.callbacks.label).toBeDefined();

    // Verify formatTime was called during rendering
    expect(vi.mocked(formatTime.formatTime)).toHaveBeenCalled();
  });
});
